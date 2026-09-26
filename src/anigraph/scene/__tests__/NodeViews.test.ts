/**
 * Tests for the Three.js node views, which get their render matrix from the model (the model handles 2D vs. 3D).
 *
 * Covers the transform paths (2D and 3D group views, world transforms, already-embedded matrices, and the loud
 * failure for a 2D transform handed to a 3D node) and the one behavior the mesh views must keep distinct: whether
 * `update()` re-sends the vertices to the graphic (3D mesh views do, the 2D mesh view does not).
 */
// Import order matters: see the note in RenderMatrix.test.ts.
import {AGroupNodeView} from "../nodeView/AGroupNodeView";
import {AGroupNodeModel2D} from "../nodeModel/AGroupNodeModel2D";
import {AGroupNodeModel3D} from "../nodeModel/AGroupNodeModel3D";
import {AMeshModel2D} from "../nodes/2d/mesh2d/AMeshModel2D";
import {AMeshView2D} from "../nodes/2d/mesh2d/AMeshView2D";
import {AMeshModel3D} from "../nodes/trianglemesh/AMeshModel3D";
import {ATriangleMeshView} from "../nodes/trianglemesh/ATriangleMeshView";
import {AMaterial} from "../../rendering/material";
import * as THREE from "three";
import {LineModel2D} from "../nodes/2d/lines/LineModel2D";
import {LineView2D} from "../nodes/2d/lines/LineView2D";
import {LineSegmentsModel2D} from "../nodes/2d/lines/LineSegmentsModel2D";
import {LineSegmentsView2D} from "../nodes/2d/lines/LineSegmentsView2D";
import {VectorModel2D} from "../nodes/2d/lines/VectorModel2D";
import {VectorView2D} from "../nodes/2d/lines/VectorView2D";
import {Color, Mat3, Mat4, V2, V3} from "../../math";

function viewMatrix(view: AGroupNodeView): number[] {
    return view.threejs.matrix.elements.slice();
}

function expectSame(actual: number[], expected: number[]) {
    expect(actual).toHaveLength(16);
    for (let i = 0; i < 16; i++) {
        expect(actual[i]).toBeCloseTo(expected[i], 12);
    }
}

/** Reference 2D embedding for a 2D node: the 2D homogeneous embedding with z in m23. */
function embedded2D(m: Mat3, z: number): number[] {
    const t = m.Mat4From2DH();
    t.m23 = z;
    const target = new THREE.Matrix4();
    t.assignTo(target);
    return target.elements.slice();
}

function elementsOf(m: Mat4): number[] {
    const target = new THREE.Matrix4();
    m.assignTo(target);
    return target.elements.slice();
}

function makeMaterial(): AMaterial {
    const material = new AMaterial();
    material._material = new THREE.MeshBasicMaterial();
    return material;
}

describe("AGroupNodeView applies the model's embedded transform", () => {
    test("2D group: the local transform is embedded with the model's zValue", () => {
        const model = new AGroupNodeModel2D();
        model.convertTransformToMatrix(); // keep these on the Mat3 path: setTransform keeps the representation
        const t = Mat3.Translation2D(V2(2, 3)).times(Mat3.Rotation(0.4));
        model.setTransform(t);
        model.zValue = 0.75;
        const view = new AGroupNodeView();
        view.setModel(model);
        expectSame(viewMatrix(view), embedded2D(t, 0.75));
    });

    test("2D group: the view follows later changes to the model's transform", () => {
        const model = new AGroupNodeModel2D();
        model.convertTransformToMatrix(); // keep these on the Mat3 path: setTransform keeps the representation
        const view = new AGroupNodeView();
        view.setModel(model);
        const t = Mat3.Translation2D(V2(-4, 1));
        model.setTransform(t);
        expectSame(viewMatrix(view), embedded2D(t, 0));
    });

    test("2D group: the view follows later changes to the model's zValue", () => {
        // Nothing else changes here, so only the zValue change itself can update the view (the LabCatDepth slider
        // in the ShapesAndMaterials scene does exactly this).
        const model = new AGroupNodeModel2D();
        model.convertTransformToMatrix(); // keep these on the Mat3 path: setTransform keeps the representation
        const t = Mat3.Translation2D(V2(1, 2));
        model.setTransform(t);
        const view = new AGroupNodeView();
        view.setModel(model);
        model.zValue = -0.3;
        expectSame(viewMatrix(view), embedded2D(t, -0.3));
        model.zValue = 0.4;
        expectSame(viewMatrix(view), embedded2D(t, 0.4));
    });

    test("3D group: the 4x4 transform is applied as is", () => {
        const model = new AGroupNodeModel3D();
        model.convertTransformToMatrix(); // keep this on the Mat4 path
        const t = Mat4.Translation3D(V3(1, 2, 3)).times(Mat4.Scale3D(2));
        model.setTransform(t);
        const view = new AGroupNodeView();
        view.setModel(model);
        expectSame(viewMatrix(view), elementsOf(t));
    });

    test("setTransform accepts a 2D world transform (embedded with z) and an already-embedded Mat4 (as is)", () => {
        const parent = new AGroupNodeModel2D();
        parent.convertTransformToMatrix();
        parent.setTransform(Mat3.Translation2D(V2(10, 20)));
        const child = new AGroupNodeModel2D();
        child.convertTransformToMatrix();
        child.setTransform(Mat3.Rotation(0.3));
        child.zValue = 0.5;
        parent.addChild(child);
        const view = new AGroupNodeView();
        view.setModel(child);

        view.setTransform(child.getWorldTransform());
        expectSame(viewMatrix(view), embedded2D(child.getWorldTransform() as Mat3, 0.5));

        const explicit = Mat4.From2DMat3(Mat3.Scale2D(3));
        view.setTransform(explicit);
        expectSame(viewMatrix(view), elementsOf(explicit));
    });

    test("a 2D transform handed to a 3D node's view fails loudly instead of rendering garbage", () => {
        const model = new AGroupNodeModel3D();
        const view = new AGroupNodeView();
        view.setModel(model);
        expect(() => view.setTransform(Mat3.Rotation(0.2))).toThrow(/cannot embed a 2D/);
    });
});

describe("mesh views keep their distinct vertex-update policies", () => {
    test("2D mesh view: a transform change does not re-send vertices, a geometry update does", () => {
        const model = new AMeshModel2D();
        model.setMaterial(makeMaterial());
        const view = AMeshView2D.Create(model);
        const setVerts2D = jest.spyOn(view.meshGraphic, "setVerts2D");

        model.setTransform(Mat3.Translation2D(V2(1, 1)));
        expect(setVerts2D).not.toHaveBeenCalled();

        model.signalGeometryUpdate();
        expect(setVerts2D).toHaveBeenCalled();
    });

    test("2D mesh view: the render matrix follows the model's transform and zValue", () => {
        const model = new AMeshModel2D();
        model.setMaterial(makeMaterial());
        model.zValue = 0.25;
        const view = AMeshView2D.Create(model);
        const t = Mat3.Translation2D(V2(5, -2));
        model.setTransform(t);
        expectSame(view.threejs.matrix.elements.slice(), embedded2D(t, 0.25));
    });

    test("3D mesh view: a transform change re-sends the vertices", () => {
        const model = new AMeshModel3D();
        model.setMaterial(makeMaterial());
        const view = ATriangleMeshView.Create(model);
        const setVerts = jest.spyOn(view.meshGraphic, "setVerts");

        model.setTransform(Mat4.Translation3D(V3(1, 0, 0)));
        expect(setVerts).toHaveBeenCalled();
    });

    test("Create returns the class it was called on", () => {
        const model = new AMeshModel2D();
        model.setMaterial(makeMaterial());
        expect(AMeshView2D.Create(model)).toBeInstanceOf(AMeshView2D);
    });
});

describe("2D line views apply the model's transform", () => {
    function withTwoVerts<T extends {verts: any}>(model: T): T {
        model.verts.addVertex(V2(0, 0), Color.FromString("#ff0000"));
        model.verts.addVertex(V2(1, 1), Color.FromString("#ff0000"));
        return model;
    }
    const cases: Array<[string, () => any, (m: any) => any]> = [
        ["LineView2D", () => withTwoVerts(new LineModel2D()), (m) => LineView2D.Create(m)],
        ["LineSegmentsView2D", () => withTwoVerts(new LineSegmentsModel2D()), (m) => LineSegmentsView2D.Create(m)],
        ["VectorView2D", () => withTwoVerts(new VectorModel2D()), (m) => VectorView2D.Create(m)],
    ];
    test.each(cases)("%s: the render matrix follows the model's transform", (_name, makeModel, makeView) => {
        const model = makeModel();
        model.setMaterial(makeMaterial());
        model.convertTransformToMatrix();
        const view = makeView(model);
        const t = Mat3.Translation2D(V2(3, -1)).times(Mat3.Rotation(0.3));
        model.setTransform(t);
        expectSame(view.threejs.matrix.elements.slice(), embedded2D(t, 0));
    });
});
