/**
 * Tests for `AObject3DModelWrapper.getTextures`, which `AssetManager.createModelFromAsset` uses to find the textures
 * embedded in a loaded model file.
 *
 * It used to find textures only on `MeshPhongMaterial`/`MeshPhysicalMaterial` (so glTF models, whose loader makes
 * `MeshStandardMaterial`, never had theirs found), returned a `diffuse` key instead of `color` for other materials,
 * and only looked at the first child of a group.
 */
// Priming import: loading the whole engine through a node model first avoids circular-import errors.
import {AMeshModel2D} from "../../";
import * as THREE from "three";
import {AObject3DModelWrapper} from "../AObject3DModelWrapper";

new AMeshModel2D();

/** Makes a 1x1 three.js texture. */
function makeTexture() {
    return new THREE.DataTexture(new Uint8Array([255, 0, 0, 255]), 1, 1);
}

describe("AObject3DModelWrapper.getTextures", () => {
    test("finds the color and normal maps of a MeshStandardMaterial (what GLTFLoader makes)", () => {
        const map = makeTexture();
        const normalMap = makeTexture();
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({map, normalMap}));

        const textures = new AObject3DModelWrapper(mesh).getTextures();

        expect(textures.color?.threejs).toBe(map);
        expect(textures.normal?.threejs).toBe(normalMap);
    });

    test("still finds the textures of a MeshPhongMaterial", () => {
        const map = makeTexture();
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshPhongMaterial({map}));

        const textures = new AObject3DModelWrapper(mesh).getTextures();

        expect(textures.color?.threejs).toBe(map);
        expect(textures.normal).toBeUndefined();
    });

    test("finds a mesh nested below the first child of a group", () => {
        const map = makeTexture();
        const group = new THREE.Group();
        const inner = new THREE.Group();
        inner.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({map})));
        group.add(inner);

        const textures = new AObject3DModelWrapper(group).getTextures();

        expect(textures.color?.threejs).toBe(map);
    });

    test("a material without texture slots gives undefined color and normal (same keys, no warning spam)", () => {
        const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshNormalMaterial());

        const textures = new AObject3DModelWrapper(mesh).getTextures();

        expect(Object.keys(textures).sort()).toEqual(["color", "normal"]);
        expect(textures.color).toBeUndefined();
        expect(textures.normal).toBeUndefined();
        logSpy.mockRestore();
    });
});
