/**
 * Characterization tests for `ABasicDiffuseShaderModel`/`ABlinnPhongShaderModel` (and the Blinn-Phong subclasses
 * that inherit their class-wide control-panel folder): their `AddAppState`/`CreateModel`/`getClassControlSpecGroup`
 * behavior.
 *
 * The "added" bookkeeping is pinned by observable behavior (how many times the class-wide folder is registered), not
 * by flag names. The subtle cases: a subclass reads its nearest declaring ancestor's flag (so `ATerrainShaderModel`
 * won't re-add "BlinnPhong" after `ABlinnPhongShaderModel` has), while `AddAppState` writes the flag on the class it
 * was called on (so `ABlinnPhongShaderModel` *does* add after `ATerrainShaderModel` has).
 *
 * Class statics persist within a module registry, so every test loads fresh modules via `jest.isolateModules`.
 * `AShaderModel.ShaderSourceLoaded` is stubbed so no shader file is ever fetched.
 */
export {};

function load() {
    let mods: any;
    jest.isolateModules(() => {
        const ag = require("../../../");
        const {AAppState, SetAppState} = require("../../../appstate/AAppState");
        const {ABasicDiffuseShaderModel} = require("../ABasicDiffuseShaderModel");
        const shadermodels = require("../index");
        class TestAppState extends AAppState {}
        const appState = new TestAppState();
        SetAppState(appState);
        const added: string[] = [];
        const orig = appState.addControlSpecGroup.bind(appState);
        appState.addControlSpecGroup = (name: string, ...rest: any[]) => {
            added.push(name);
            return orig(name, ...rest);
        };
        jest.spyOn(ag.AShaderModel, "ShaderSourceLoaded").mockResolvedValue(undefined);
        // `ag` for the barrel's own exports (AShaderModel); the shadermodels barrel for the Blinn-Phong family,
        // which the top-level barrel does not re-export.
        mods = {ag: {...ag, ...shadermodels, BlinnPhongMaterial: require("../ABlinnPhongShaderModel").BlinnPhongMaterial},
            appState, added, ABasicDiffuseShaderModel};
    });
    return mods;
}

function sliderSummary(group: any) {
    const raw = group.getRawSpec();
    return Object.keys(raw).map(k => [k, raw[k].value, raw[k].min, raw[k].max, raw[k].step]);
}

describe("getClassControlSpecGroup", () => {
    test("ABasicDiffuseShaderModel: folder 'Basic', ambient then diffuse", () => {
        const {ABasicDiffuseShaderModel} = load();
        const g = ABasicDiffuseShaderModel.getClassControlSpecGroup();
        expect(g.name).toBe("Basic");
        expect(sliderSummary(g)).toEqual([
            ["ambient", 0.02, 0, 1, 0.001],
            ["diffuse", 0.3, 0, 1, 0.001],
        ]);
    });

    test("ABlinnPhongShaderModel: folder 'BlinnPhong', ambient, diffuse, specular, specularExp", () => {
        const {ag} = load();
        const g = ag.ABlinnPhongShaderModel.getClassControlSpecGroup();
        expect(g.name).toBe("BlinnPhong");
        expect(sliderSummary(g)).toEqual([
            ["ambient", 0.02, 0, 1, 0.001],
            ["diffuse", 0.3, 0, 1, 0.001],
            ["specular", 0.01, 0, 1, 0.001],
            ["specularExp", 5, 0, 20, 0.01],
        ]);
    });

    test("slider onChange writes app state under the shader's key", () => {
        const {ag, appState} = load();
        const raw = ag.ABlinnPhongShaderModel.getClassControlSpecGroup().getRawSpec();
        raw.specularExp.onChange(7.5);
        expect(appState.getState("specularExp")).toBe(7.5);
    });
});

describe("AddAppState / CreateModel bookkeeping", () => {
    test("ABasicDiffuseShaderModel.CreateModel adds its folder by default, once", async () => {
        const {ABasicDiffuseShaderModel, added} = load();
        await ABasicDiffuseShaderModel.CreateModel("basic");
        await ABasicDiffuseShaderModel.CreateModel("basic");
        expect(added).toEqual(["Basic"]);
    });

    test("ABasicDiffuseShaderModel.CreateModel(name, false) adds nothing; default shader name is 'basic'", async () => {
        const {ABasicDiffuseShaderModel, added, ag} = load();
        const m = await ABasicDiffuseShaderModel.CreateModel(undefined, false);
        expect(added).toEqual([]);
        expect(m).toBeInstanceOf(ABasicDiffuseShaderModel);
        expect(m.name).toBe("basic");
        expect(ag.AShaderModel.ShaderSourceLoaded).toHaveBeenCalledWith("basic");
    });

    test("ABlinnPhongShaderModel.CreateModel does not add by default; with true, adds once", async () => {
        const {ag, added} = load();
        await ag.ABlinnPhongShaderModel.CreateModel("blinnphong");
        expect(added).toEqual([]);
        await ag.ABlinnPhongShaderModel.CreateModel("blinnphong", true);
        await ag.ABlinnPhongShaderModel.CreateModel("blinnphong", true);
        expect(added).toEqual(["BlinnPhong"]);
    });

    test("the Basic and BlinnPhong flags are independent", async () => {
        const {ag, added, ABasicDiffuseShaderModel} = load();
        await ABasicDiffuseShaderModel.CreateModel("basic");
        await ag.ABlinnPhongShaderModel.CreateModel("blinnphong", true);
        expect(added).toEqual(["Basic", "BlinnPhong"]);
    });

    test("a subclass inherits its ancestor's flag: ATerrainShaderModel won't re-add after ABlinnPhongShaderModel", async () => {
        const {ag, added} = load();
        await ag.ABlinnPhongShaderModel.CreateModel("blinnphong", true);
        await ag.ATerrainShaderModel.CreateModel("terrain", true);
        await ag.ABasicTexturedShaderModel.CreateModel("textured", true);
        expect(added).toEqual(["BlinnPhong"]);
    });

    test("...but the flag is written on the calling class: ABlinnPhongShaderModel adds after ATerrainShaderModel", async () => {
        const {ag, added} = load();
        await ag.ATerrainShaderModel.CreateModel("terrain", true);
        await ag.ABlinnPhongShaderModel.CreateModel("blinnphong", true);
        expect(added).toEqual(["BlinnPhong", "BlinnPhong"]);
    });

    test("CreateModel returns an instance of the class it was called on", async () => {
        const {ag} = load();
        expect(await ag.ATerrainShaderModel.CreateModel("terrain")).toBeInstanceOf(ag.ATerrainShaderModel);
    });

    test("AddAppState called directly adds the folder each time it is called", () => {
        const {ag, added} = load();
        ag.ABlinnPhongShaderModel.AddAppState();
        ag.ABlinnPhongShaderModel.AddAppState();
        expect(added).toEqual(["BlinnPhong", "BlinnPhong"]);
    });
});

describe("CreateMaterial default uniforms", () => {
    function withStubSource(model: any) {
        model._shaderSource = {name: model.name, vertexSource: "void main(){}", fragSource: "void main(){}"};
        return model;
    }

    test("Blinn-Phong materials get diffuse/ambient/specular/specularExp defaults; explicit uniforms win", async () => {
        const {ag} = load();
        const model = withStubSource(await ag.ABlinnPhongShaderModel.CreateModel("blinnphong"));
        const mat = model.CreateMaterial({specular: 0.9});
        expect(mat).toBeInstanceOf(ag.BlinnPhongMaterial);
        expect(mat.getUniformValue("diffuse")).toBe(0.3);
        expect(mat.getUniformValue("ambient")).toBe(0.02);
        expect(mat.getUniformValue("specular")).toBe(0.9);
        expect(mat.getUniformValue("specularExp")).toBe(5);
    });

    test("Basic diffuse materials get only diffuse/ambient defaults", async () => {
        const {ABasicDiffuseShaderModel} = load();
        const model = withStubSource(await ABasicDiffuseShaderModel.CreateModel("basic", false));
        const mat = model.CreateMaterial();
        expect(mat.getUniformValue("diffuse")).toBe(0.3);
        expect(mat.getUniformValue("ambient")).toBe(0.02);
        expect(mat.getUniformValue("specular")).toBeUndefined();
    });
});
