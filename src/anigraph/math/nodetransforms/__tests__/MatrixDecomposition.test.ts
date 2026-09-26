/**
 * Tests for decomposing a matrix into a PRSA node transform: `setWithMatrix`, `FromMatrix` and `TryFromMatrix` on
 * `NodeTransform2D` and `NodeTransform3D`. An exact matrix must
 * round-trip through `getMatrix()`; a sheared one must be reported (`TryFromMatrix` returns `undefined`, and the
 * best-effort `setWithMatrix` warns once per session instead of on every call).
 */
import {Mat3, Mat4, NodeTransform2D, NodeTransform3D, Quaternion, V2, V3} from "../../../";

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

function expectMatClose(a: Mat3 | Mat4, b: Mat3 | Mat4) {
    expect(a.elements.length).toBe(b.elements.length);
    for (let i = 0; i < a.elements.length; i++) {
        expect(a.elements[i]).toBeCloseTo(b.elements[i], 5);
    }
}

describe("NodeTransform2D decomposition", () => {
    const exactCases: [string, Mat3][] = [
        ["identity", Mat3.Identity()],
        ["translation", Mat3.Translation2D(V2(3, -2))],
        ["rotation", Mat3.Rotation(1.2)],
        ["non-uniform scale", Mat3.Scale2D(V2(2, 0.5))],
        ["negative scale (reflection)", Mat3.Scale2D(V2(1, -3))],
        ["PRSA with an anchor", new NodeTransform2D(V2(1, 2), 0.7, V2(2, 3), V2(0.5, -1)).getMatrix()],
        ["zero x scale", Mat3.Rotation(0.4).times(Mat3.Scale2D(V2(0, 2))) as Mat3],
    ];

    test.each(exactCases)("TryFromMatrix reproduces an exact matrix (%s)", (_name, m) => {
        const t = NodeTransform2D.TryFromMatrix(m);
        expect(t).toBeDefined();
        expectMatClose(t!.getMatrix(), m);
    });

    test("with no options, the anchor is zero and the position is the translation", () => {
        const m = new NodeTransform2D(V2(1, 2), 0.7, V2(2, 3), V2(0.5, -1)).getMatrix();
        const t = NodeTransform2D.TryFromMatrix(m)!;
        expect(t.anchor.x).toBeCloseTo(0);
        expect(t.anchor.y).toBeCloseTo(0);
        expect(t.position.x).toBeCloseTo(m.m02);
        expect(t.position.y).toBeCloseTo(m.m12);
    });

    test("the anchor option keeps the anchor and solves for the position", () => {
        const original = new NodeTransform2D(V2(1, 2), 0.7, V2(2, 3), V2(0.5, -1));
        const t = NodeTransform2D.TryFromMatrix(original.getMatrix(), {anchor: V2(0.5, -1)})!;
        expect(t.anchor.x).toBeCloseTo(0.5);
        expect(t.anchor.y).toBeCloseTo(-1);
        expect(t.position.x).toBeCloseTo(1);
        expect(t.position.y).toBeCloseTo(2);
        expect(t.rotation).toBeCloseTo(0.7);
    });

    test("the position option keeps the position and solves for the anchor", () => {
        const original = new NodeTransform2D(V2(1, 2), 0.7, V2(2, 3), V2(0.5, -1));
        const t = NodeTransform2D.TryFromMatrix(original.getMatrix(), {position: V2(1, 2)})!;
        expect(t.anchor.x).toBeCloseTo(0.5);
        expect(t.anchor.y).toBeCloseTo(-1);
        expectMatClose(t.getMatrix(), original.getMatrix());
    });

    test("giving both a position and an anchor throws", () => {
        expect(() => NodeTransform2D.TryFromMatrix(Mat3.Identity(), {position: V2(), anchor: V2()})).toThrow();
    });

    test("TryFromMatrix returns undefined for a shear matrix, or a non-affine one", () => {
        expect(NodeTransform2D.TryFromMatrix(SHEAR2D)).toBeUndefined();
        const projective = Mat3.Identity();
        projective.m20 = 0.3;
        expect(NodeTransform2D.TryFromMatrix(projective)).toBeUndefined();
    });

    test("setWithMatrix no longer logs on every call, and warns once (not per call) for an inexact matrix", () => {
        const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
        NodeTransform2D._warnedInexactSetWithMatrix = false;
        for (let i = 0; i < 5; i++) {
            NodeTransform2D.FromMatrix(Mat3.Rotation(i));
        }
        expect(warn).not.toHaveBeenCalled();
        NodeTransform2D.FromMatrix(SHEAR2D);
        NodeTransform2D.FromMatrix(SHEAR2D);
        expect(warn).toHaveBeenCalledTimes(1);
        warn.mockRestore();
    });

    test("setWithMatrix with a position keeps it (the existing signature)", () => {
        const m = new NodeTransform2D(V2(4, 5), 0.3, V2(1, 2), V2(1, 1)).getMatrix();
        const t = NodeTransform2D.FromMatrix(m, V2(4, 5));
        expect(t.position.x).toBeCloseTo(4);
        expect(t.position.y).toBeCloseTo(5);
        expectMatClose(t.getMatrix(), m);
    });
});

describe("NodeTransform3D decomposition", () => {
    const exactCases: [string, Mat4][] = [
        ["identity", Mat4.Identity()],
        ["translation", Mat4.Translation3D(V3(1, -2, 3))],
        ["rotation", Mat4.RotationAxisAngle(V3(1, 2, 3).getNormalized(), 0.9)],
        ["non-uniform scale", Mat4.Scale3D(V3(2, 0.5, 3))],
        ["negative determinant", Mat4.Scale3D(V3(1, 1, -2))],
        ["reflection on x", Mat4.RotationZ(0.5).times(Mat4.Scale3D(V3(-1, 2, 1))) as Mat4],
        ["PRSA with an anchor", new NodeTransform3D(V3(1, 2, 3), Quaternion.FromAxisAngle(V3(0, 1, 1).getNormalized(), 0.8), V3(2, 1, 3), V3(0.5, -1, 2)).getMatrix()],
        ["zero z scale", Mat4.RotationX(0.3).times(Mat4.Scale3D(V3(1, 2, 0))) as Mat4],
        ["two zero scales", Mat4.RotationY(0.3).times(Mat4.Scale3D(V3(0, 2, 0))) as Mat4],
    ];

    test.each(exactCases)("TryFromMatrix reproduces an exact matrix (%s)", (_name, m) => {
        const t = NodeTransform3D.TryFromMatrix(m);
        expect(t).toBeDefined();
        expectMatClose(t!.getMatrix(), m);
    });

    test("with no options, the anchor is zero and the position is the translation (FromMatrix too)", () => {
        const m = Mat4.Translation3D(V3(5, 6, 7)).times(Mat4.RotationZ(0.4)) as Mat4;
        for (const t of [NodeTransform3D.TryFromMatrix(m)!, NodeTransform3D.FromMatrix(m)]) {
            expect(t.anchor.L2()).toBeCloseTo(0);
            expect(t.position.x).toBeCloseTo(5);
            expect(t.position.y).toBeCloseTo(6);
            expect(t.position.z).toBeCloseTo(7);
        }
    });

    test("the anchor option keeps the anchor and solves for the position", () => {
        const q = Quaternion.FromAxisAngle(V3(0, 1, 1).getNormalized(), 0.8);
        const original = new NodeTransform3D(V3(1, 2, 3), q, V3(2, 1, 3), V3(0.5, -1, 2));
        const t = NodeTransform3D.TryFromMatrix(original.getMatrix(), {anchor: V3(0.5, -1, 2)})!;
        expect(t.anchor.x).toBeCloseTo(0.5);
        expect(t.anchor.y).toBeCloseTo(-1);
        expect(t.anchor.z).toBeCloseTo(2);
        expect(t.position.x).toBeCloseTo(1);
        expect(t.position.y).toBeCloseTo(2);
        expect(t.position.z).toBeCloseTo(3);
        expectMatClose(t.getMatrix(), original.getMatrix());
    });

    test("TryFromMatrix returns undefined for a shear matrix, or a non-affine one", () => {
        expect(NodeTransform3D.TryFromMatrix(SHEAR3D)).toBeUndefined();
        const projective = Mat4.Identity();
        projective.m32 = -1;
        expect(NodeTransform3D.TryFromMatrix(projective)).toBeUndefined();
    });

    test("setWithMatrix warns once (not per call) for an inexact matrix, and not at all for exact ones", () => {
        const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
        NodeTransform3D._warnedInexactSetWithMatrix = false;
        NodeTransform3D.FromMatrix(Mat4.RotationX(0.2));
        expect(warn).not.toHaveBeenCalled();
        NodeTransform3D.FromMatrix(SHEAR3D);
        NodeTransform3D.FromMatrix(SHEAR3D);
        expect(warn).toHaveBeenCalledTimes(1);
        warn.mockRestore();
    });

    test("new NodeTransform3D(mat4) decomposes the matrix", () => {
        const m = Mat4.Translation3D(V3(1, 2, 3)).times(Mat4.RotationY(0.6)) as Mat4;
        expectMatClose(new NodeTransform3D(m).getMatrix(), m);
    });
});
