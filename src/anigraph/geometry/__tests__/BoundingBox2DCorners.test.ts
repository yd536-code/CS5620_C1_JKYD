/**
 * Checks that `BoundingBox2D.corners` (and the boundary loop built from it) apply the box's `transform`, and that
 * `getLocalCorners` does not.
 */
// Priming import: loading the whole engine through a node model first avoids circular-import errors.
import {AMeshModel2D} from "../../";
import {BoundingBox2D, Mat3, V2, Vec2} from "../../";

new AMeshModel2D();

function unitSquare(): BoundingBox2D {
    return BoundingBox2D.FromVec2s([V2(0, 0), V2(1, 1)]);
}

function expectPoints(actual: Vec2[], expected: Vec2[]) {
    expect(actual.length).toBe(expected.length);
    actual.forEach((p, i) => {
        expect(p.x).toBeCloseTo(expected[i].x, 10);
        expect(p.y).toBeCloseTo(expected[i].y, 10);
    });
}

describe("BoundingBox2D.corners", () => {
    test("with the default (identity) transform, corners are the local corners", () => {
        const b = unitSquare();
        expectPoints(b.corners, [V2(0, 0), V2(1, 0), V2(1, 1), V2(0, 1)]);
    });

    test("applies a translation", () => {
        const b = unitSquare();
        b.transform = Mat3.Translation2D(V2(5, -2));
        expectPoints(b.corners, [V2(5, -2), V2(6, -2), V2(6, -1), V2(5, -1)]);
    });

    test("applies rotation and scale (counterclockwise quarter turn after scaling by 2)", () => {
        const b = unitSquare();
        b.transform = Mat3.Rotation(Math.PI / 2).times(Mat3.Scale2D(2));
        expectPoints(b.corners, [V2(0, 0), V2(0, 2), V2(-2, 2), V2(-2, 0)]);
    });

    test("getLocalCorners ignores the transform", () => {
        const b = unitSquare();
        b.transform = Mat3.Translation2D(V2(5, -2));
        expectPoints(b.getLocalCorners(), [V2(0, 0), V2(1, 0), V2(1, 1), V2(0, 1)]);
    });

    test("GetBoundaryLinesVertexArray traces the transformed corners as a closed loop", () => {
        const b = unitSquare();
        b.transform = Mat3.Translation2D(V2(5, -2));
        const va = b.GetBoundaryLinesVertexArray();
        const pts: Vec2[] = [];
        for (let i = 0; i < va.nVerts; i++) {
            pts.push(va.getPoint2DAt(i));
        }
        expectPoints(pts, [V2(5, -2), V2(6, -2), V2(6, -1), V2(5, -1), V2(5, -2)]);
    });

    test("an empty box has no corners", () => {
        expect(new BoundingBox2D().corners).toEqual([]);
    });
});
