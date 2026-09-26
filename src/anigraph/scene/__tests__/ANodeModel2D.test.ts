/**
 * Tests for `ANodeModel2D`'s runtime transform-representation API (`getTransformAsPRSA`,
 * `setTransformToMatrix`, `setTransformToPRSA` -- now deprecated aliases of `convertTransformToMatrix`/
 * `convertTransformToPRSA`, which `TransformRepresentation.test.ts` covers along with `prsa`). Whether a 2D node's transform is a PRSA
 * `NodeTransform2D` or a `Mat3` is runtime state on the node, not a separate class, matching how `ANodeModel3D`
 * works.
 */
// Import order matters: see the note in RenderMatrix.test.ts, in this same directory.
import {AMeshModel2D} from "../nodes/2d/mesh2d/AMeshModel2D";
import {AGroupNodeModel2D} from "../nodeModel/AGroupNodeModel2D";
import {PolygonModel2D} from "../../starter/nodes/polygon2D/PolygonModel2D";
import {Mat3, NodeTransform2D, V2} from "../../math";

describe("default transform representation", () => {
    test("AGroupNodeModel2D defaults to NodeTransform2D", () => {
        expect(new AGroupNodeModel2D().transform).toBeInstanceOf(NodeTransform2D);
    });

    test("AMeshModel2D defaults to NodeTransform2D", () => {
        expect(new AMeshModel2D().transform).toBeInstanceOf(NodeTransform2D);
    });

    test("PolygonModel2D (built with no explicit transform) also defaults to NodeTransform2D, like every other 2D node (not a Mat3)", () => {
        expect(new PolygonModel2D().transform).toBeInstanceOf(NodeTransform2D);
    });

    test("constructing with an explicit Mat3 keeps that representation, regardless of the class default", () => {
        expect(new AMeshModel2D(undefined, Mat3.Identity()).transform).toBeInstanceOf(Mat3);
        expect(new PolygonModel2D(undefined, Mat3.Translation2D(V2(1, 2))).transform).toBeInstanceOf(Mat3);
    });

    test("setTransform(Mat3) on a default node keeps it a NodeTransform2D (setTransform keeps the representation)", () => {
        const node = new AGroupNodeModel2D();
        node.setTransform(Mat3.Identity());
        expect(node.transform).toBeInstanceOf(NodeTransform2D);
    });
});

describe("getTransformAsPRSA", () => {
    test("returns a copy even when the transform is a NodeTransform2D -- mutating the copy does NOT affect the model", () => {
        const node = new AMeshModel2D();
        node.prsa.position = V2(1, 2);
        const copy = node.getTransformAsPRSA();
        expect(copy).toBeInstanceOf(NodeTransform2D);
        expect(copy).not.toBe(node.transform);
        expect(copy.position).toEqual(V2(1, 2));
        copy.position = V2(3, 4);
        expect(node.prsa.position).toEqual(V2(1, 2));
    });

    test("returns a projected copy when the transform is a Mat3 -- mutating the copy does NOT affect the model", () => {
        const node = new AGroupNodeModel2D();
        node.convertTransformToMatrix();
        node.setTransform(Mat3.Translation2D(V2(1, 2)));
        const projected = node.getTransformAsPRSA();
        expect(projected).toBeInstanceOf(NodeTransform2D);
        expect(projected.position).toEqual(V2(1, 2));

        projected.position = V2(99, 99);
        expect(node.transform).toBeInstanceOf(Mat3); // unchanged representation
        expect(node.getTransformAsPRSA().position).toEqual(V2(1, 2)); // unchanged value: a fresh projection, not the mutated one
    });
});

describe("setTransformToMatrix / setTransformToPRSA", () => {
    test("setTransformToMatrix converts a NodeTransform2D to a Mat3 in place, preserving position", () => {
        const node = new AMeshModel2D();
        node.setTransformPRSA(new NodeTransform2D(V2(5, -2), 0));
        node.setTransformToMatrix();
        expect(node.transform).toBeInstanceOf(Mat3);
        expect((node.transform as Mat3).c2.Point2D).toEqual(V2(5, -2));
    });

    test("setTransformToMatrix is a no-op when already a Mat3", () => {
        const node = new AGroupNodeModel2D();
        node.convertTransformToMatrix();
        node.setTransform(Mat3.Translation2D(V2(7, 8)));
        const before = node.transform;
        node.setTransformToMatrix();
        expect(node.transform).toBe(before); // same object: untouched
    });

    test("setTransformToPRSA converts a Mat3 to a NodeTransform2D in place, preserving position", () => {
        const node = new AGroupNodeModel2D();
        node.convertTransformToMatrix();
        node.setTransform(Mat3.Translation2D(V2(-3, 6)));
        node.setTransformToPRSA();
        expect(node.transform).toBeInstanceOf(NodeTransform2D);
        expect((node.transform as NodeTransform2D).position).toEqual(V2(-3, 6));
    });

    test("setTransformToPRSA is a no-op when already a NodeTransform2D", () => {
        const node = new AMeshModel2D();
        const before = node.transform;
        node.setTransformToPRSA();
        expect(node.transform).toBe(before); // same object: untouched
    });

    test("round trip (PRSA -> Matrix -> PRSA) preserves position for a pure translation", () => {
        const node = new AMeshModel2D();
        node.setTransformPRSA(new NodeTransform2D(V2(2, 3), 0));
        node.setTransformToMatrix();
        node.setTransformToPRSA();
        expect((node.transform as NodeTransform2D).position).toEqual(V2(2, 3));
    });
});

describe("setTransformPRSA/setTransformMat3 still change the representation on purpose", () => {
    test("setTransformMat3 makes a PRSA node a Mat3 node, and setTransformPRSA makes it PRSA again", () => {
        const node = new AMeshModel2D();
        node.setTransformMat3(Mat3.Translation2D(V2(1, 2)));
        expect(node.transform).toBeInstanceOf(Mat3);
        node.setTransformPRSA(new NodeTransform2D(V2(3, 4)));
        expect(node.transform).toBeInstanceOf(NodeTransform2D);
    });
});
