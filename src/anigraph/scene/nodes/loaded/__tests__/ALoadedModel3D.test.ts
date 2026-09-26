/**
 * Tests for loaded-model nodes, using small three.js meshes built in the test in
 * place of a loaded file:
 * - `ALoadedModel3D` accepts a `THREE.BufferGeometry`, and its `sourceScale` (the constructor argument and later
 *   in-place edits) reaches the loaded objects and the view's copies of them.
 * - `AGLNodeView.initLoadedObjects(material)` applies the material it is given.
 */
// Import order matters: see the note in scene/__tests__/RenderMatrix.test.ts.
import {AMeshModel2D} from "../../2d/mesh2d/AMeshModel2D";
import {ALoadedModel3D} from "../ALoadedModel3D";
import {ALoadedView3D} from "../ALoadedView3D";
import {AMaterial} from "../../../../rendering/material";
import {ALoadedElement} from "../../../../rendering/loaded/ALoadedElement";
import {AObject3DModelWrapper} from "../../../../geometry";
import {NodeTransform3D, Quaternion, V3} from "../../../../math";
import * as THREE from "three";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

/** An `AMaterial` backed by a plain three.js material, so no shader loading is needed. */
function makeMaterial(): AMaterial {
    const material = new AMaterial();
    material._material = new THREE.MeshBasicMaterial();
    return material;
}

function makeMesh() {
    return new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
}

/** The view's `ALoadedElement`s (the view keeps them in a protected dictionary). */
function loadedElementsOf(view: any): ALoadedElement[] {
    return Object.values(view._loadedElements) as ALoadedElement[];
}

describe("ALoadedModel3D with a BufferGeometry", () => {
    test("no material: wraps the geometry in a mesh without throwing", () => {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const model = new ALoadedModel3D(geometry);
        const mesh = model.loadedObjects[0].object as THREE.Mesh;
        expect(mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh.geometry).toBe(geometry);
        expect(geometry.attributes.normal).toBeDefined();
    });

    test("with a material: the mesh and the model both use it", () => {
        const material = makeMaterial();
        const model = new ALoadedModel3D(new THREE.BoxGeometry(1, 1, 1), material);
        const mesh = model.loadedObjects[0].object as THREE.Mesh;
        expect(model.material).toBe(material);
        expect(mesh.material).toBe(material.threejs);
    });
});

describe("ALoadedModel3D sourceScale", () => {
    test("the constructor's sourceScale reaches the loaded object's source transform and matrix", () => {
        const model = new ALoadedModel3D(makeMesh(), undefined, 2);
        const wrapper = model.loadedObjects[0];
        expect(wrapper.sourceTransform.getMatrix().elements[0]).toBeCloseTo(2, 12);
        expect(wrapper.object.matrix.elements[0]).toBeCloseTo(2, 12);
        expect(wrapper.object.matrix.elements[5]).toBeCloseTo(2, 12);
    });

    test("an AObject3DModelWrapper argument gets the scale too", () => {
        const wrapper = new AObject3DModelWrapper(makeMesh());
        new ALoadedModel3D(wrapper, undefined, 4);
        expect(wrapper.object.matrix.elements[0]).toBeCloseTo(4, 12);
    });

    test("an asset's own source transform (e.g. from AssetManager.load3DModel) is kept, and scaling keeps its rotation", () => {
        const wrapper = new AObject3DModelWrapper(makeMesh());
        wrapper.sourceTransform = new NodeTransform3D(V3(), Quaternion.RotationX(Math.PI / 2), V3(0.5, 0.5, 0.5));
        const before = wrapper.object.matrix.elements.slice();
        const model = new ALoadedModel3D(wrapper);
        expect(wrapper.object.matrix.elements).toEqual(before);
        expect(model.sourceTransform.scale.x).toBeCloseTo(0.5, 12);

        model.sourceScale = 2;
        const expected = new NodeTransform3D(V3(), Quaternion.RotationX(Math.PI / 2), V3(2, 2, 2)).getMatrix();
        const actual = wrapper.sourceTransform.getMatrix();
        for (let i = 0; i < 16; i++) {
            expect(actual.elements[i]).toBeCloseTo(expected.elements[i], 12);
        }
    });

    test("editing sourceScale in place reaches the loaded object and the view's copy", () => {
        const model = new ALoadedModel3D(makeMesh());
        const view = new ALoadedView3D();
        view.setModel(model);
        const [element] = loadedElementsOf(view);
        expect(element.loadedObject.matrix.elements[0]).toBeCloseTo(1, 12);

        model.sourceScale = 3;

        expect(model.loadedObjects[0].object.matrix.elements[0]).toBeCloseTo(3, 12);
        expect(element.loadedObject.matrix.elements[0]).toBeCloseTo(3, 12);
    });

    test("assigning a new sourceTransform still works", () => {
        const model = new ALoadedModel3D(makeMesh());
        const view = new ALoadedView3D();
        view.setModel(model);
        const newTransform = model.sourceTransform.clone();
        newTransform.scale = 5;
        model.sourceTransform = newTransform;
        expect(model.loadedObjects[0].object.matrix.elements[0]).toBeCloseTo(5, 12);
        expect(loadedElementsOf(view)[0].loadedObject.matrix.elements[0]).toBeCloseTo(5, 12);
    });
});

/** A view that passes its own material to `initLoadedObjects`, as `AMaterialCopyView` does. */
class ViewWithOwnMaterial extends ALoadedView3D {
    static viewMaterial: AMaterial;
    init(): void {
        this.initLoadedObjects(ViewWithOwnMaterial.viewMaterial);
        this.update();
    }
}

describe("AGLNodeView.initLoadedObjects", () => {
    test("a material passed in is applied instead of the model's", () => {
        const modelMaterial = makeMaterial();
        ViewWithOwnMaterial.viewMaterial = makeMaterial();
        const model = new ALoadedModel3D(makeMesh(), modelMaterial);
        const view = new ViewWithOwnMaterial();
        view.setModel(model);
        const mesh = loadedElementsOf(view)[0].loadedObject as THREE.Mesh;
        expect(mesh.material).toBe(ViewWithOwnMaterial.viewMaterial.threejs);
    });

    test("with no material passed, the model's material is used", () => {
        const modelMaterial = makeMaterial();
        const model = new ALoadedModel3D(makeMesh(), modelMaterial);
        const view = new ALoadedView3D();
        view.setModel(model);
        const mesh = loadedElementsOf(view)[0].loadedObject as THREE.Mesh;
        expect(mesh.material).toBe(modelMaterial.threejs);
    });

    test("with neither, a plain MeshBasicMaterial is used", () => {
        const model = new ALoadedModel3D(makeMesh());
        const view = new ALoadedView3D();
        view.setModel(model);
        const mesh = loadedElementsOf(view)[0].loadedObject as THREE.Mesh;
        expect(mesh.material).toBeInstanceOf(THREE.MeshBasicMaterial);
    });
});
