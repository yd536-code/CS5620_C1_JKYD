/**
 * Parity tests for the model-side render-matrix embedding (`embedTransform`, `getRenderMatrix`,
 * `getWorldRenderMatrix`).
 *
 * The model decides how a 2D or 3D transform becomes a 4x4 render matrix. These tests keep a reference
 * implementation that branches on the type of the transform it is given (`referenceSetTransform2D` and friends
 * below) and assert that the model-side methods produce exactly the same 4x4 matrices, for local and world transforms, with and
 * without a z value, and for transforms that are already 4x4.
 */
// Import order matters: the engine has a circular import between `math` and the base classes, and it only resolves
// when a higher-level module is loaded before `../../math` (the other scene tests follow the same rule).
import {AMeshModel2D} from "../nodes/2d/mesh2d/AMeshModel2D";
import {AGroupNodeModel2D} from "../nodeModel/AGroupNodeModel2D";
import {ANodeModel3D} from "../nodeModel/ANodeModel3D";
import * as THREE from "three";
import {Mat3, Mat4, NodeTransform2D, NodeTransform3D, TransformationInterface, V2, V3, Quaternion} from "../../math";

/**
 * Reference 2D embedding: returns the elements of the THREE.Matrix4 a view would write for a 2D node, branching
 * on the transform's type.
 */
function referenceSetTransform2D(transform: TransformationInterface, zValue: number): number[] {
    const target = new THREE.Matrix4();
    if (transform instanceof Mat3) {
        let t = transform.Mat4From2DH();
        t.m23 = zValue;
        t.assignTo(target);
    } else if (transform instanceof NodeTransform2D) {
        let t = transform.getMatrix().Mat4From2DH();
        t.m23 = zValue;
        t.assignTo(target);
    } else {
        (transform.getMatrix() as Mat4).assignTo(target);
    }
    return target.elements.slice();
}

/** The behavior `AGLNodeView.setTransform` had for a 3D node. */
function referenceSetTransform3D(transform: TransformationInterface): number[] {
    const target = new THREE.Matrix4();
    (transform.getMatrix() as Mat4).assignTo(target);
    return target.elements.slice();
}

function elementsOf(m: Mat4): number[] {
    const target = new THREE.Matrix4();
    m.assignTo(target);
    return target.elements.slice();
}

function expectSameMatrix(actual: number[], expected: number[]) {
    expect(actual).toHaveLength(16);
    for (let i = 0; i < 16; i++) {
        expect(actual[i]).toBeCloseTo(expected[i], 12);
    }
}

const rotatedScaledTranslated = () => Mat3.Translation2D(V2(1.5, -2.25)).times(Mat3.Rotation(0.6)).times(Mat3.Scale2D(2.0));
const prsa = () => {
    const t = new NodeTransform2D();
    t.position = V2(3, 4);
    t.rotation = -0.9;
    t.scale = 1.5;
    t.anchor = V2(0.25, 0.5);
    return t;
};

describe("2D nodes: embedTransform matches the reference setTransform2D", () => {
    const zValues = [0, 0.75, -2];

    test.each(zValues)("Mat3 transform, zValue %p", (z) => {
        const node = new AMeshModel2D();
        node.zValue = z;
        const t = rotatedScaledTranslated();
        expectSameMatrix(elementsOf(node.embedTransform(t)), referenceSetTransform2D(t, z));
    });

    test.each(zValues)("NodeTransform2D transform, zValue %p", (z) => {
        const node = new AMeshModel2D();
        node.zValue = z;
        const t = prsa();
        expectSameMatrix(elementsOf(node.embedTransform(t)), referenceSetTransform2D(t, z));
    });

    test("an already-embedded Mat4 passes through unchanged and without z injection", () => {
        const node = new AMeshModel2D();
        node.zValue = 5;
        const embedded = Mat4.From2DMat3(rotatedScaledTranslated());
        expectSameMatrix(elementsOf(node.embedTransform(embedded)), referenceSetTransform2D(embedded, 5));
    });

    test("does not modify the transform it was given", () => {
        const node = new AMeshModel2D();
        node.zValue = 3;
        const t = rotatedScaledTranslated();
        const before = t.elements.slice();
        node.embedTransform(t);
        expect(t.elements).toEqual(before);
    });

    test("getRenderMatrix embeds the node's own transform (a Mat3 node)", () => {
        const node = new AMeshModel2D();
        node.convertTransformToMatrix(); // setTransform keeps the node's representation, so make it a Mat3 node first
        node.zValue = 1.25;
        node.setTransform(rotatedScaledTranslated());
        expectSameMatrix(elementsOf(node.getRenderMatrix()), referenceSetTransform2D(node.transform, 1.25));
    });

    test("getRenderMatrix for a PRSA node", () => {
        const node = new AMeshModel2D();
        node.zValue = -0.5;
        node.setTransformPRSA(prsa());
        expectSameMatrix(elementsOf(node.getRenderMatrix()), referenceSetTransform2D(node.transform, -0.5));
    });

    test("getWorldRenderMatrix embeds the world transform (parent then child)", () => {
        const parent = new AGroupNodeModel2D();
        parent.convertTransformToMatrix();
        parent.setTransform(Mat3.Translation2D(V2(10, 20)).times(Mat3.Scale2D(2)));
        const child = new AMeshModel2D();
        child.convertTransformToMatrix();
        child.setTransform(Mat3.Rotation(0.3));
        child.zValue = 0.5;
        parent.addChild(child);
        const world = child.getWorldTransform();
        expectSameMatrix(elementsOf(child.getWorldRenderMatrix()), referenceSetTransform2D(world, 0.5));
    });
});

describe("3D nodes: embedTransform matches the reference setTransform", () => {
    test("Mat4 transform", () => {
        const node = new ANodeModel3D();
        node.convertTransformToMatrix(); // setTransform keeps the node's representation, so make it a Mat4 node first
        const t = Mat4.Translation3D(V3(1, 2, 3)).times(Mat4.Scale3D(2));
        node.setTransform(t);
        expectSameMatrix(elementsOf(node.embedTransform(t)), referenceSetTransform3D(t));
        expectSameMatrix(elementsOf(node.getRenderMatrix()), referenceSetTransform3D(t));
    });

    test("NodeTransform3D transform", () => {
        const node = new ANodeModel3D();
        const t = new NodeTransform3D();
        t.position = V3(-1, 4, 2);
        t.rotation = Quaternion.RotationX(0.7);
        t.scale = V3(1, 2, 3);
        node.setTransform(t);
        expectSameMatrix(elementsOf(node.getRenderMatrix()), referenceSetTransform3D(t));
    });

    test("getWorldRenderMatrix embeds the world transform", () => {
        const parent = new ANodeModel3D();
        parent.setTransform(Mat4.Translation3D(V3(5, 0, 0)));
        const child = new ANodeModel3D();
        child.setTransform(Mat4.Scale3D(2));
        parent.addChild(child);
        expectSameMatrix(elementsOf(child.getWorldRenderMatrix()), referenceSetTransform3D(child.getWorldTransform()));
    });

    test("a 2D (Mat3) transform is rejected with a specific error instead of silently mis-rendering", () => {
        const node = new ANodeModel3D();
        expect(() => node.embedTransform(Mat3.Rotation(0.2))).toThrow(/cannot embed a 2D/);
    });
});
