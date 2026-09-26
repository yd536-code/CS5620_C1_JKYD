/**
 * Tests for `ALoadedElement.setMaterial`: a `Color` sets the color of each mesh's existing
 * material (instead of being assigned as the material itself), and meshes are found anywhere in the loaded object,
 * not only under `THREE.Group` nodes.
 *
 * Uses a fake `AObject3DModelWrapper` (only `getNewSceneObject()` is called by the constructor).
 */
import * as THREE from "three";
import {AMeshModel2D, Color} from "../../../";
import {ALoadedElement} from "../ALoadedElement";

new AMeshModel2D(); // priming reference to avoid circular-import errors (see RenderMatrix.test.ts in scene/__tests__).

/** A plain Object3D (not a Group) holding a mesh, which holds another mesh. */
function makeLoaded() {
    const root = new THREE.Object3D();
    const outer = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({color: 0x000000}));
    const inner = new THREE.Mesh(new THREE.BufferGeometry(), [new THREE.MeshBasicMaterial({color: 0x000000})]);
    root.add(outer);
    outer.add(inner);
    const fakeWrapper: any = {getNewSceneObject: () => root};
    return {element: new ALoadedElement(fakeWrapper), outer, inner};
}

describe("ALoadedElement.setMaterial", () => {
    test("a Color sets material.color on every mesh, including nested ones and material arrays", () => {
        const {element, outer, inner} = makeLoaded();
        element.setMaterial(Color.FromRGBA(0, 1, 0, 1));
        expect(outer.material).toBeInstanceOf(THREE.MeshStandardMaterial);
        expect((outer.material as THREE.MeshStandardMaterial).color.g).toBeCloseTo(1);
        const innerMat = (inner.material as THREE.MeshBasicMaterial[])[0];
        expect(innerMat).toBeInstanceOf(THREE.MeshBasicMaterial);
        expect(innerMat.color.g).toBeCloseTo(1);
    });

    test("a THREE.Material replaces the material on every mesh", () => {
        const {element, outer, inner} = makeLoaded();
        const m = new THREE.MeshNormalMaterial();
        element.setMaterial(m);
        expect(outer.material).toBe(m);
        expect(inner.material).toBe(m);
    });
});
