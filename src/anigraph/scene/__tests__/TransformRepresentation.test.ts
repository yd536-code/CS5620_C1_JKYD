/**
 * Tests for how a node's transform is represented and edited (PRSA vs. matrix):
 *
 * - `node.prsa` is the live PRSA transform, and throws on a matrix node instead of handing back a copy.
 * - `convertTransformToPRSA()`/`convertTransformToMatrix()` change the representation in place.
 * - `setTransform` keeps the node's current representation: a matrix given to a PRSA node is decomposed, keeping
 *   the node's anchor; a PRSA given to a matrix node becomes its matrix. It warns (once per node) only when the
 *   matrix can't be represented as PRSA (the node switches to a matrix), or when a non-zero anchor is folded into a
 *   matrix.
 */
// Import order matters: see the note in RenderMatrix.test.ts.
import {AMeshModel2D} from "../nodes/2d/mesh2d/AMeshModel2D";
import {AGroupNodeView} from "../nodeView/AGroupNodeView";
import {AGroupNodeModel2D} from "../nodeModel/AGroupNodeModel2D";
import {AGroupNodeModel3D} from "../nodeModel/AGroupNodeModel3D";
import {ANodeModel3D} from "../nodeModel/ANodeModel3D";
import * as THREE from "three";
import {Mat3, Mat4, NodeTransform2D, NodeTransform3D, Quaternion, V2, V3} from "../../math";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

const SHEAR2D = new Mat3(
    1, 0.5, 0,
    0, 1, 0,
    0, 0, 1
);

const SHEAR3D = new Mat4(
    1, 0.5, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
);

function expectMatClose(a: Mat3 | Mat4, b: Mat3 | Mat4, digits: number = 6) {
    expect(a.elements.length).toBe(b.elements.length);
    for (let i = 0; i < a.elements.length; i++) {
        expect(a.elements[i]).toBeCloseTo(b.elements[i], digits);
    }
}

/** The render matrix a view of a 2D node should show: `m` embedded with `z` as the z translation. */
function embedded2D(m: Mat3, z: number): number[] {
    const t = m.Mat4From2DH();
    t.m23 = z;
    const target = new THREE.Matrix4();
    t.assignTo(target);
    return target.elements.slice();
}

function expectViewMatrix(view: AGroupNodeView, expected: number[]) {
    const actual = view.threejs.matrix.elements.slice();
    for (let i = 0; i < 16; i++) {
        expect(actual[i]).toBeCloseTo(expected[i], 10);
    }
}

let warn: jest.SpyInstance;
beforeEach(() => {
    warn = jest.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
    warn.mockRestore();
});

describe("2D: prsa", () => {
    test("returns the live transform on a PRSA node; editing it moves the node and redraws its view", () => {
        const node = new AGroupNodeModel2D();
        const view = new AGroupNodeView();
        view.setModel(node);
        expect(node.transformIsPRSA).toBe(true);
        expect(node.prsa).toBe(node.transform);

        node.prsa.position = V2(3, 4);
        node.prsa.rotation = 0.5;
        expect((node.transform as NodeTransform2D).position).toEqual(V2(3, 4));
        expectViewMatrix(view, embedded2D(node.transform.getMatrix(), 0));
    });

    test("throws on a matrix node, with a message that names convertTransformToPRSA()", () => {
        const node = new AGroupNodeModel2D();
        node.convertTransformToMatrix();
        expect(node.transformIsPRSA).toBe(false);
        expect(() => node.prsa).toThrow(/Mat3.*convertTransformToPRSA\(\)/);
    });
});

describe("2D: convertTransformToPRSA / convertTransformToMatrix", () => {
    test("round-trip without changing the render matrix", () => {
        const node = new AMeshModel2D();
        node.zValue = 0.25;
        node.setTransform(new NodeTransform2D(V2(1, 2), 0.3, V2(2, 0.5)));
        const before = node.getRenderMatrix().clone();
        node.convertTransformToMatrix();
        expect(node.transform).toBeInstanceOf(Mat3);
        expectMatClose(node.getRenderMatrix(), before);
        node.convertTransformToPRSA();
        expect(node.transform).toBeInstanceOf(NodeTransform2D);
        expectMatClose(node.getRenderMatrix(), before);
        expect(warn).not.toHaveBeenCalled();
    });

    test("each is a no-op on its own type", () => {
        const node = new AMeshModel2D();
        const prsa = node.transform;
        node.convertTransformToPRSA();
        expect(node.transform).toBe(prsa);
        node.convertTransformToMatrix();
        const matrix = node.transform;
        node.convertTransformToMatrix();
        expect(node.transform).toBe(matrix);
    });

    test("convertTransformToMatrix warns once if the anchor is non-zero, and not if it is zero", () => {
        const zero = new AMeshModel2D();
        zero.prsa.position = V2(1, 1);
        zero.convertTransformToMatrix();
        expect(warn).not.toHaveBeenCalled();

        const anchored = new AMeshModel2D();
        anchored.prsa.anchor = V2(1, 0);
        const before = anchored.transform.getMatrix();
        anchored.convertTransformToMatrix();
        expectMatClose(anchored.transform.getMatrix(), before);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toMatch(/anchor/);
    });

    test("convertTransformToPRSA on a shear Mat3 uses the closest PRSA and warns once", () => {
        const node = new AMeshModel2D(undefined, SHEAR2D);
        node.convertTransformToPRSA();
        expect(node.transform).toBeInstanceOf(NodeTransform2D);
        expect(warn).toHaveBeenCalledTimes(1);
    });
});

describe("2D: setTransform keeps the representation", () => {
    test("an exact Mat3 on a PRSA node: stays PRSA, same matrix, same anchor, later rotation pivots about it, no warning", () => {
        const node = new AMeshModel2D();
        node.prsa.anchor = V2(1, 0); // e.g. an arm link whose anchor is its joint
        const m = Mat3.Translation2D(V2(5, 5)).times(Mat3.Rotation(0.4)) as Mat3;
        node.setTransform(m);

        expect(node.transformIsPRSA).toBe(true);
        expectMatClose(node.transform.getMatrix(), m);
        expect(node.prsa.anchor.x).toBeCloseTo(1);
        expect(node.prsa.anchor.y).toBeCloseTo(0);

        // The anchor point stays put when the rotation changes.
        const pivot = () => node.transform.getMatrix().times(V3(1, 0, 1)) as any;
        const before = pivot();
        node.prsa.rotation += 1.0;
        const after = pivot();
        expect(after.x).toBeCloseTo(before.x);
        expect(after.y).toBeCloseTo(before.y);
        expect(warn).not.toHaveBeenCalled();
    });

    test("a shear Mat3 on a PRSA node: switches to that Mat3, warns once, and a second call doesn't warn", () => {
        const node = new AMeshModel2D();
        node.setTransform(SHEAR2D);
        // (toEqual, not toBe: the state proxy wraps the stored object.)
        expect(node.transform).toBeInstanceOf(Mat3);
        expect(node.transform).toEqual(SHEAR2D);
        expect(() => node.prsa).toThrow();
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toMatch(/now a Mat3/);

        node.setTransform(SHEAR2D.clone());
        expect(warn).toHaveBeenCalledTimes(1);
    });

    test("a NodeTransform2D on a Mat3 node: stays a Mat3 with the same matrix; warns once for a non-zero anchor only", () => {
        const node = new AMeshModel2D();
        node.convertTransformToMatrix();

        const noAnchor = new NodeTransform2D(V2(1, 2), 0.3);
        node.setTransform(noAnchor);
        expect(node.transform).toBeInstanceOf(Mat3);
        expectMatClose(node.transform.getMatrix(), noAnchor.getMatrix());
        expect(warn).not.toHaveBeenCalled();

        const anchored = new NodeTransform2D(V2(1, 2), 0.3, V2(1, 1), V2(0, 2));
        node.setTransform(anchored);
        expect(node.transform).toBeInstanceOf(Mat3);
        expectMatClose(node.transform.getMatrix(), anchored.getMatrix());
        expect(warn).toHaveBeenCalledTimes(1);
        node.setTransform(anchored.clone());
        expect(warn).toHaveBeenCalledTimes(1);
    });

    test("a PRSA node given a NodeTransform2D stores it as is, and a Mat3 node given a Mat3 stores it as is", () => {
        const prsaNode = new AMeshModel2D();
        const t = new NodeTransform2D(V2(1, 2));
        prsaNode.setTransform(t);
        expect(prsaNode.transform).toBeInstanceOf(NodeTransform2D);
        expect(prsaNode.transform).toEqual(t);

        const matrixNode = new AMeshModel2D(undefined, Mat3.Identity());
        const m = Mat3.Rotation(0.2);
        matrixNode.setTransform(m);
        expect(matrixNode.transform).toBeInstanceOf(Mat3);
        expect(matrixNode.transform).toEqual(m);
    });

    test("a 3D transform given to a 2D PRSA node is projected, then decomposed", () => {
        const node = new AMeshModel2D();
        node.setTransform(Mat4.Translation3D(V3(1, 2, 3)));
        expect(node.transformIsPRSA).toBe(true);
        expect(node.prsa.position.x).toBeCloseTo(1);
        expect(node.prsa.position.y).toBeCloseTo(2);
    });

    test("replacing the transform with a decomposed one redraws the view", () => {
        const node = new AGroupNodeModel2D();
        const view = new AGroupNodeView();
        view.setModel(node);
        const m = Mat3.Translation2D(V2(-4, 1)).times(Mat3.Rotation(0.7)) as Mat3;
        node.setTransform(m);
        expectViewMatrix(view, embedded2D(m, 0));
    });
});

describe("2D: getTransformAsPRSA and the deprecated aliases", () => {
    test("getTransformAsPRSA always returns a copy: on a PRSA node and on a Mat3 node", () => {
        const node = new AMeshModel2D();
        const prsaCopy = node.getTransformAsPRSA();
        expect(prsaCopy).not.toBe(node.transform);
        prsaCopy.position = V2(9, 9);
        expect(node.prsa.position).toEqual(V2(0, 0));
        node.convertTransformToMatrix();
        const copy = node.getTransformAsPRSA();
        copy.position = V2(9, 9);
        expect((node.transform as Mat3).c2.Point2D).toEqual(V2(0, 0));
    });

    test("setTransformToMatrix/setTransformToPRSA behave like the new names", () => {
        const node = new AMeshModel2D();
        node.prsa.position = V2(2, 3);
        node.setTransformToMatrix();
        expect(node.transform).toBeInstanceOf(Mat3);
        node.setTransformToPRSA();
        expect(node.transform).toBeInstanceOf(NodeTransform2D);
        expect(node.prsa.position.x).toBeCloseTo(2);
        expect(node.prsa.position.y).toBeCloseTo(3);
    });
});

describe("2D: adopt() -- reparenting a node without moving it on screen", () => {
    /** Reparents `other` under `parent` without moving it on screen, by composing with the parent's inverse world transform. */
    function adopt(parent: AMeshModel2D, other: AMeshModel2D) {
        const otherWorld = other.getWorldTransform();
        other.reparent(parent);
        other.setTransform(parent.getWorldTransform().getInverse().times(otherWorld));
    }

    test("the adopted node's world transform is unchanged, and its prsa still works afterwards", () => {
        const root = new AGroupNodeModel2D();
        const player = new AMeshModel2D();
        const cat = new AMeshModel2D();
        root.addChild(player);
        root.addChild(cat);
        player.setTransform(new NodeTransform2D(V2(3, 1), 0.8, V2(1.5, 1.5)));
        cat.setTransform(new NodeTransform2D(V2(-2, 4), -0.3, V2(0.5, 0.5)));

        const catWorld = cat.getWorldTransform();
        adopt(player, cat);
        expect(cat.parent).toBe(player);
        expectMatClose(cat.getWorldTransform(), catWorld);
        expect(cat.transformIsPRSA).toBe(true);

        cat.prsa.rotation += 0.1; // no longer a silently-lost edit
        expect(cat.getWorldTransform().isEqualTo(catWorld, 1e-6)).toBe(false);
        expect(warn).not.toHaveBeenCalled();
    });
});

describe("3D", () => {
    test("prsa is live on a PRSA node, and throws on a Mat4 node", () => {
        const node = new AGroupNodeModel3D();
        expect(node.transformIsPRSA).toBe(true);
        node.prsa.position = V3(1, 2, 3);
        expect(node.transform.getMat4().c3.Point3D).toEqual(V3(1, 2, 3));
        node.convertTransformToMatrix();
        expect(node.transformIsPRSA).toBe(false);
        expect(() => node.prsa).toThrow(/Mat4.*convertTransformToPRSA\(\)/);
    });

    test("convertTransformToPRSA/convertTransformToMatrix round-trip without changing the render matrix", () => {
        const node = new ANodeModel3D();
        node.setTransform(new NodeTransform3D(V3(1, 2, 3), Quaternion.RotationY(0.6), V3(2, 1, 1)));
        const before = node.getRenderMatrix().clone();
        node.convertTransformToMatrix();
        expect(node.transform).toBeInstanceOf(Mat4);
        expectMatClose(node.getRenderMatrix(), before);
        node.convertTransformToPRSA();
        expect(node.transform).toBeInstanceOf(NodeTransform3D);
        expectMatClose(node.getRenderMatrix(), before);
        expect(warn).not.toHaveBeenCalled();
    });

    test("an exact Mat4 on a PRSA node: stays PRSA, same matrix, keeps the anchor, no warning", () => {
        const node = new ANodeModel3D();
        node.prsa.anchor = V3(0, 1, 0);
        const m = Mat4.Translation3D(V3(1, 2, 3)).times(Mat4.RotationZ(0.5)).times(Mat4.Scale3D(2)) as Mat4;
        node.setTransform(m);
        expect(node.transformIsPRSA).toBe(true);
        expectMatClose(node.transform.getMat4(), m);
        expect(node.prsa.anchor.y).toBeCloseTo(1);
        expect(warn).not.toHaveBeenCalled();
    });

    test("a shear Mat4 on a PRSA node: switches to that Mat4 and warns once", () => {
        const node = new ANodeModel3D();
        node.setTransform(SHEAR3D);
        expect(node.transform).toBeInstanceOf(Mat4);
        expect(node.transform).toEqual(SHEAR3D);
        node.setTransform(SHEAR3D.clone());
        expect(warn).toHaveBeenCalledTimes(1);
    });

    test("a NodeTransform3D on a Mat4 node: stays a Mat4; warns once for a non-zero anchor only", () => {
        const node = new ANodeModel3D();
        node.convertTransformToMatrix();
        node.setTransform(new NodeTransform3D(V3(1, 2, 3)));
        expect(node.transform).toBeInstanceOf(Mat4);
        expect(warn).not.toHaveBeenCalled();
        const anchored = new NodeTransform3D(V3(1, 2, 3), undefined, undefined, V3(0, 0, 1));
        node.setTransform(anchored);
        expect(node.transform).toBeInstanceOf(Mat4);
        expectMatClose(node.transform.getMat4(), anchored.getMat4());
        expect(warn).toHaveBeenCalledTimes(1);
    });

    test("setTransform(Mat3) or a NodeTransform2D on a 3D node throws at call time", () => {
        const node = new ANodeModel3D();
        expect(() => node.setTransform(Mat3.Rotation(0.2))).toThrow(/Mat4From2DH/);
        expect(() => node.setTransform(new NodeTransform2D())).toThrow(/NodeTransform2D/);
    });

    test("getTransformAsPRSA always returns a copy, and setTransformToMat4 behaves like convertTransformToMatrix", () => {
        const node = new ANodeModel3D();
        const prsaCopy = node.getTransformAsPRSA();
        expect(prsaCopy).not.toBe(node.transform);
        prsaCopy.position = V3(9, 9, 9);
        expect(node.prsa.position).toEqual(V3(0, 0, 0));
        node.setTransformToMat4();
        expect(node.transform).toBeInstanceOf(Mat4);
        const copy = node.getTransformAsPRSA();
        copy.position = V3(9, 9, 9);
        expect(node.transform.getMat4().c3.Point3D).toEqual(V3(0, 0, 0));
    });
});
