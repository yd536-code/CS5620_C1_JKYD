/**
 * Tests for {@link AssetManager}: texture caching in `loadTexture` and the textures that `createModelFromAsset`
 * copies from a model file's own material. No real files are loaded: `ATexture.LoadAsync` is mocked, and models
 * are hand-built Three.js meshes.
 */
// Load a higher-level module first; the engine has a circular import that only resolves in this order.
import {AMeshModel2D, AObject3DModelWrapper, ATexture, AssetManager} from "../../index";
import * as THREE from "three";

new AMeshModel2D();

/** Clears the singleton's caches so tests don't see each other's textures or models. */
function resetAssetManager(){
    AssetManager._textures = {};
    AssetManager._3Dmodels = {};
    AssetManager.modelAssetsDetails = {};
}

describe("AssetManager.loadTexture caching", () => {
    let loadSpy: jest.SpyInstance;
    beforeEach(() => {
        resetAssetManager();
        // Every call makes a brand-new texture, so we can tell a cache hit from a reload.
        loadSpy = jest.spyOn(ATexture, "LoadAsync").mockImplementation(
            async (path: string) => {
                const tex = new ATexture(new THREE.Texture());
                tex._url = path;
                return tex;
            }
        );
    });
    afterEach(() => {
        loadSpy.mockRestore();
        resetAssetManager();
    });

    test("two loads of the same name and path return the same texture", async () => {
        await AssetManager.loadTexture("./images/a.png", "A");
        const first = AssetManager.getTexture("A");
        await AssetManager.loadTexture("./images/a.png", "A");
        expect(AssetManager.getTexture("A")).toBe(first);
        expect(loadSpy).toHaveBeenCalledTimes(1);
    });

    test("forceReload loads the file again and replaces the texture", async () => {
        await AssetManager.loadTexture("./images/a.png", "A");
        const first = AssetManager.getTexture("A");
        await AssetManager.loadTexture("./images/a.png", "A", true);
        expect(loadSpy).toHaveBeenCalledTimes(2);
        expect(AssetManager.getTexture("A")).not.toBe(first);
    });

    test("loading a different path under an existing name replaces the texture", async () => {
        await AssetManager.loadTexture("./images/a.png", "particle");
        await AssetManager.loadTexture("./images/b.png", "particle");
        expect(loadSpy).toHaveBeenCalledTimes(2);
        expect(AssetManager.getTexture("particle")._url).toBe("./images/b.png");
    });

    test("two loads started at the same time share one file load", async () => {
        await Promise.all([
            AssetManager.loadTexture("./images/a.png", "A"),
            AssetManager.loadTexture("./images/a.png", "A"),
        ]);
        expect(loadSpy).toHaveBeenCalledTimes(1);
    });

    test("the name defaults to the file name", async () => {
        await AssetManager.loadTexture("./images/sub/c.png");
        expect(AssetManager.getTexture("c.png")).toBeDefined();
    });
});

describe("AssetManager.createModelFromAsset with textures embedded in the model file", () => {
    beforeEach(resetAssetManager);
    afterEach(resetAssetManager);

    /** A stand-in for a material: just records the `setTexture` calls. */
    function fakeMaterial(){
        return {setTexture: jest.fn(), usesVertexColors: false};
    }
    /** A stand-in for a node model class: `Create` returns an object with a `setMaterial` spy. */
    const FakeModelClass = {
        Create: (_obj: any) => ({setMaterial: jest.fn()}),
    };

    test("the model's color map is set as the material's diffuse texture", () => {
        const map = new THREE.Texture();
        const mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshPhongMaterial({map}));
        AssetManager._3Dmodels["cat"] = new AObject3DModelWrapper(mesh);
        const material = fakeMaterial();
        AssetManager.createModelFromAsset("cat", FakeModelClass as any, material as any);
        const diffuseCalls = material.setTexture.mock.calls.filter((c: any[]) => c[0] === "diffuse");
        expect(diffuseCalls.length).toBe(1);
        expect(diffuseCalls[0][1]).toBeInstanceOf(ATexture);
        expect(diffuseCalls[0][1].threejs).toBe(map);
    });

    test("textures the model doesn't have are not set to undefined", () => {
        const mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshPhongMaterial());
        AssetManager._3Dmodels["plain"] = new AObject3DModelWrapper(mesh);
        const material = fakeMaterial();
        AssetManager.createModelFromAsset("plain", FakeModelClass as any, material as any);
        expect(material.setTexture).not.toHaveBeenCalled();
    });

    test("a texture loaded under the asset's own name takes priority", () => {
        const map = new THREE.Texture();
        const mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshPhongMaterial({map}));
        AssetManager._3Dmodels["cat"] = new AObject3DModelWrapper(mesh);
        const separate = new ATexture(new THREE.Texture());
        AssetManager._textures["cat"] = separate;
        const material = fakeMaterial();
        AssetManager.createModelFromAsset("cat", FakeModelClass as any, material as any);
        expect(material.setTexture).toHaveBeenCalledWith("diffuse", separate);
    });
});
