/**
 * The `ANodeModel3D` constructor keeps the vertices it is given. It used to replace them
 * with an empty `VertexArray3D` after `super(...)` stored them.
 */
// Import order matters: see the note in RenderMatrix.test.ts.
import {AMeshModel2D} from "../nodes/2d/mesh2d/AMeshModel2D";
import {ANodeModel3D} from "../nodeModel/ANodeModel3D";
import {AMeshModel3D} from "../nodes/trianglemesh/AMeshModel3D";
import {VertexArray3D} from "../../geometry";
import {NodeTransform3D, V3} from "../../math";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

function triangle() {
    const verts = new VertexArray3D();
    verts.addVertex(V3(0, 0, 0));
    verts.addVertex(V3(1, 0, 0));
    verts.addVertex(V3(0, 1, 0));
    return verts;
}

describe("ANodeModel3D constructor", () => {
    test("keeps the verts passed in", () => {
        const verts = triangle();
        const node = new ANodeModel3D(verts);
        expect(node.verts).toBe(verts);
        expect(node.verts.nVerts).toBe(3);
    });

    test("keeps the verts and the transform when both are passed", () => {
        const verts = triangle();
        const T = new NodeTransform3D(V3(1, 2, 3));
        const node = new ANodeModel3D(verts, T);
        expect(node.verts).toBe(verts);
        expect(node.transform.getPosition().z).toBeCloseTo(3);
    });

    test("with no verts, creates an empty VertexArray3D", () => {
        const node = new ANodeModel3D();
        expect(node.verts).toBeInstanceOf(VertexArray3D);
        expect(node.verts.nVerts).toBe(0);
    });

    test("AMeshModel3D still keeps its verts, and defaults to empty", () => {
        const verts = triangle();
        expect(new AMeshModel3D(verts).verts).toBe(verts);
        expect(new AMeshModel3D().verts.nVerts).toBe(0);
    });
});
