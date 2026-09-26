/**
 * Tests for two small fixes:
 * - `ATexture.setMagFilter` sets the magnification filter (it used to set `minFilter`).
 * - `GetDeepTHREEJSClone` passes its `cloneGeometry`/`cloneMaterial` flags on to the children.
 */
import * as THREE from "three";
import {AMeshModel2D, ATexture, GetDeepTHREEJSClone} from "../../";

new AMeshModel2D(); // priming reference to avoid circular-import errors (see RenderMatrix.test.ts in scene/__tests__).

describe("ATexture filters", () => {
    test("setMagFilter sets magFilter and leaves minFilter alone", () => {
        const tex = new ATexture(new THREE.Texture());
        tex.setMinFilter(THREE.LinearMipmapLinearFilter);
        tex.setMagFilter(THREE.NearestFilter);
        expect(tex.threejs.magFilter).toBe(THREE.NearestFilter);
        expect(tex.threejs.minFilter).toBe(THREE.LinearMipmapLinearFilter);
    });
});

describe("GetDeepTHREEJSClone", () => {
    /** A parent mesh with one child mesh, each with its own geometry and material. */
    function makeHierarchy() {
        const parent = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial());
        const child = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial());
        parent.add(child);
        return {parent, child};
    }

    test("by default, children get cloned geometry and material", () => {
        const {parent, child} = makeHierarchy();
        const clone = GetDeepTHREEJSClone(parent) as THREE.Mesh;
        const childClone = clone.children[0] as THREE.Mesh;
        expect(childClone).not.toBe(child);
        expect(childClone.geometry).not.toBe(child.geometry);
        expect(childClone.material).not.toBe(child.material);
    });

    test("cloneGeometry=false and cloneMaterial=false apply to the children too", () => {
        const {parent, child} = makeHierarchy();
        const clone = GetDeepTHREEJSClone(parent, false, false) as THREE.Mesh;
        const childClone = clone.children[0] as THREE.Mesh;
        expect(clone.geometry).toBe(parent.geometry);
        expect(childClone.geometry).toBe(child.geometry);
        expect(childClone.material).toBe(child.material);
    });

    test("a mesh with an array of materials clones each material", () => {
        const mats = [new THREE.MeshBasicMaterial(), new THREE.MeshBasicMaterial()];
        const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mats);
        const clone = GetDeepTHREEJSClone(mesh) as THREE.Mesh;
        const cloneMats = clone.material as THREE.Material[];
        expect(Array.isArray(cloneMats)).toBe(true);
        expect(cloneMats.length).toBe(2);
        expect(cloneMats[0]).not.toBe(mats[0]);
        expect(cloneMats[1]).not.toBe(mats[1]);
    });
});
