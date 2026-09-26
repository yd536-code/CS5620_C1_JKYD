import {ASerializableFromJSON, ASerializableToJSON, GetIndexedCopy} from "../ASerializable";
import {AMaterial, AShaderMaterial, AShaderModel, ATexture} from "../../../../anigraph";
import {AssetManager} from "../../../../anigraph/fileio/AAssetManager";
import * as THREE from "three";

/**
 * `AMaterial`/`AShaderMaterial`/`ATexture` are live GPU/runtime-resource
 * wrappers, so they serialize as *asset references* (a registered model name,
 * plus per-instance overrides) rather than a field dump of the live
 * `THREE.Material`/`THREE.Texture`. See each class's own `toJSON`/`fromJSON`
 * doc comments for the reasoning; this covers the round trip end to end.
 *
 * `AShaderMaterial` needs a real `AShaderModel` with shader source to build
 * a `THREE.ShaderMaterial` from -- rather than depend on `AssetManager
 * .loadShaderMaterialModel` (a real network fetch of a .glsl file, not
 * available in this test environment), this registers a minimal fixture
 * model directly into `AssetManager.materials`'s registry with hand-set
 * (never-compiled, since nothing here touches a real WebGL context) source
 * strings -- everything downstream of that (`_CreateTHREEJS`, `CreateMaterial`)
 * is exercised for real.
 */
function makeTestShaderModel(name: string): AShaderModel {
    const model = new AShaderModel();
    // @ts-ignore -- protected, but this is a test fixture standing in for AssetManager.loadShaderMaterialModel's real (network-dependent) shader loading.
    model._shaderSource = {vertexSource: "void main(){}", fragSource: "void main(){}"};
    model.name = name;
    AssetManager.materials.materials[name] = model;
    return model;
}

describe("AMaterial/AShaderMaterial/ATexture asset-reference round trips", () => {
    test("a plain AMaterial round-trips via its model's registered name (AssetManager.DEFAULT_MATERIALS.Basic)", () => {
        const material = AssetManager.CreateBasicMaterial();
        const revived = ASerializableFromJSON<AMaterial>(ASerializableToJSON(material));

        expect(revived).toBeInstanceOf(AMaterial);
        expect(revived.model.name).toBe(AssetManager.DEFAULT_MATERIALS.Basic);
        // Reconstructed via the *same* registered singleton model, not a clone of it.
        expect(revived.model).toBe(AssetManager.materials.getMaterialModel(AssetManager.DEFAULT_MATERIALS.Basic));
    });

    test("AMaterial.fromJSON warns and falls back to a bare instance when modelName is missing or unregistered", () => {
        const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {
        });
        try {
            expect(AMaterial.fromJSON({})).toBeInstanceOf(AMaterial);
            expect(AMaterial.fromJSON({modelName: "NoSuchModelRegisteredAnywhere"})).toBeInstanceOf(AMaterial);
            expect(warnSpy).toHaveBeenCalledTimes(2);
        } finally {
            warnSpy.mockRestore();
        }
    });

    test("AShaderMaterial round-trips its model reference plus per-instance uniform overrides (number/bool/vector)", () => {
        const model = makeTestShaderModel("D7TestShaderModel_uniforms");
        const material = model.CreateMaterial() as AShaderMaterial;
        material.setUniform("alpha", 0.6);
        material.setUniform("useTint", true);
        material.setUniform("tint", new THREE.Vector3(0.1, 0.2, 0.3), "vec3");

        const revived = ASerializableFromJSON<AShaderMaterial>(ASerializableToJSON(material));

        expect(revived).toBeInstanceOf(AShaderMaterial);
        expect(revived.model.name).toBe("D7TestShaderModel_uniforms");
        expect(revived.getUniformValue("alpha")).toBeCloseTo(0.6);
        expect(revived.getUniformValue("useTint")).toBe(true);
        const tint = revived.getUniformValue("tint");
        expect(tint).toBeInstanceOf(THREE.Vector3);
        expect(tint.x).toBeCloseTo(0.1);
        expect(tint.y).toBeCloseTo(0.2);
        expect(tint.z).toBeCloseTo(0.3);
    });

    test("AShaderMaterial round-trips a texture reference (ATexture instance, not a raw THREE.Texture dump)", () => {
        const model = makeTestShaderModel("D7TestShaderModel_texture");
        const material = model.CreateMaterial() as AShaderMaterial;
        const texture = new ATexture("./images/gradientParticle.png", "d7TestTexture");
        material.setDiffuseTexture(texture);

        const json = ASerializableToJSON(material);
        // The raw THREE.Texture (type "t") must not have been walked as a generic uniform.
        expect(json).not.toContain('"diffuseMap"');

        // Regression test: THREE.TextureLoader.load() (used by loadFromURL, which fromJSON calls)
        // returns synchronously with .image === null -- always, not a test-environment quirk -- and
        // only assigns a real image once the network load finishes, later. AShaderMaterial.fromJSON
        // -> setTexture reads tex.width/height immediately, synchronously, as part of reviving --
        // this must not crash on an ATexture whose image genuinely hasn't loaded yet.
        const revived = ASerializableFromJSON<AShaderMaterial>(json);
        expect(revived.diffuseTexture).toBeInstanceOf(ATexture);
        expect(revived.diffuseTexture?.name).toBe("d7TestTexture");
        // @ts-ignore -- _url is @AObjectState, readable directly on the instance.
        expect(revived.diffuseTexture?._url).toBe("./images/gradientParticle.png");
        expect(revived.diffuseTexture?.threejs).toBeInstanceOf(THREE.Texture);
        expect(revived.diffuseTexture?.width).toBe(0);
    });

    test("ATexture.fromJSON reconstructs threejs from _url; warns and leaves it undefined when there is no _url", () => {
        const texture = new ATexture("./images/gradientParticle.png", "d7StandaloneTexture");
        const revived = ASerializableFromJSON<ATexture>(ASerializableToJSON(texture));
        expect(revived).toBeInstanceOf(ATexture);
        expect(revived.name).toBe("d7StandaloneTexture");
        expect(revived.threejs).toBeInstanceOf(THREE.Texture);

        // Regression test: ATexture.LoadAsync (what AssetManager.loadTexture actually uses, the
        // common real-world path) constructs via the "already-have-a-THREE.Texture" branch, not
        // loadFromURL -- it must still end up with _url set (LoadAsync's own job now), or fromJSON
        // has nothing to reconstruct from and revives with threejs left undefined, which crashes
        // the first thing that reads .width/.height (e.g. AShaderMaterial.setTexture).
        const loadedTexture = new ATexture(new THREE.Texture(), "d7LoadAsyncStyleTexture");
        loadedTexture._url = "./images/gradientParticle.png";
        loadedTexture.setTexData("url", "./images/gradientParticle.png");
        const revivedLoaded = ASerializableFromJSON<ATexture>(ASerializableToJSON(loadedTexture));
        expect(revivedLoaded.threejs).toBeInstanceOf(THREE.Texture);

        const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {
        });
        try {
            const noUrlTexture = new ATexture();
            noUrlTexture._setTHREETexture(new THREE.Texture());
            noUrlTexture.name = "noUrl";
            const revivedNoUrl = ASerializableFromJSON<ATexture>(ASerializableToJSON(noUrlTexture));
            expect(revivedNoUrl).toBeInstanceOf(ATexture);
            expect(revivedNoUrl.threejs).toBeUndefined();
            expect(warnSpy).toHaveBeenCalled();
        } finally {
            warnSpy.mockRestore();
        }
    });

    test("two objects sharing one AShaderMaterial instance still share it after a round trip (shared-reference dedup on a real asset reference)", () => {
        const model = makeTestShaderModel("D7TestShaderModel_shared");
        const sharedMaterial = model.CreateMaterial() as AShaderMaterial;
        sharedMaterial.setUniform("alpha", 0.42);

        const indexed = GetIndexedCopy({a: {material: sharedMaterial}, b: {material: sharedMaterial}});
        const json = JSON.stringify(indexed);
        // Exactly one full ({_aserial_class_id, ...}) copy of the material; the second reference is a {_aserial_ref} pointer.
        const fullCopies = (json.match(/"D7TestShaderModel_shared"/g) ?? []).length;
        expect(fullCopies).toBe(1);
        expect(indexed.b.material._aserial_ref).toBeDefined();

        const revived = ASerializableFromJSON<{ a: { material: AShaderMaterial }; b: { material: AShaderMaterial } }>(
            ASerializableToJSON({a: {material: sharedMaterial}, b: {material: sharedMaterial}})
        );
        expect(revived.a.material).toBe(revived.b.material);
        expect(revived.a.material.getUniformValue("alpha")).toBeCloseTo(0.42);
    });
});
