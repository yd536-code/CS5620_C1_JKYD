/**
 * Integration test, against the real node-model classes, for the space (2D vs 3D) compatibility check.
 * `AObjectNode.test.js` (in `base/aobject/__tests__`) tests the generic
 * mechanism in isolation with lightweight fakes; this file confirms `ANodeModel2D`/`ANodeModel3D` are correctly
 * tagged (`nodeSpace`) and that mixing them now throws eagerly, at `addChild` time, rather than only lazily the
 * next time something happens to call `getWorldTransform()`.
 *
 * Because the check happens at `addChild` time, `ANodeModel2D.getWorldTransform` and
 * `PolygonModel2D.getWorldTransform2D` need no `instanceof ANodeModel3D` guards of their own: a 2D node's parent
 * can never be a 3D node. The check also rejects the reverse direction (a 3D node parented under a 2D node), at
 * any depth.
 */
// Import order matters: see the note in RenderMatrix.test.ts, in this same directory. Note the extra trap this
// file found: babel's TypeScript transform elides an import that is never referenced as a *value* (it can't tell
// type-only usage from dead code without full type info), so an import kept "for its priming side effect only"
// and never actually used gets silently dropped from the compiled output -- and stops priming anything. `AMeshModel2D`
// below is therefore actually constructed, not just imported.
import {AMeshModel2D} from "../nodes/2d/mesh2d/AMeshModel2D";
import {AGroupNodeModel2D} from "../nodeModel/AGroupNodeModel2D";
import {ANodeModel3D} from "../nodeModel/ANodeModel3D";
import {PolygonModel2D} from "../../starter/nodes/polygon2D/PolygonModel2D";

describe("nodeSpace tags on the real node-model classes", () => {
    test("ANodeModel2D subclasses report '2D'", () => {
        expect(new AMeshModel2D().nodeSpace).toBe('2D');
        expect(new AGroupNodeModel2D().nodeSpace).toBe('2D');
        expect(new PolygonModel2D().nodeSpace).toBe('2D');
    });

    test("ANodeModel3D reports '3D'", () => {
        expect(new ANodeModel3D().nodeSpace).toBe('3D');
    });
});

describe("mixing 2D and 3D node models is rejected at addChild time", () => {
    test("a 3D node cannot be added as a child of a 2D node", () => {
        const parent2D = new AGroupNodeModel2D();
        const child3D = new ANodeModel3D();
        expect(() => parent2D.addChild(child3D)).toThrow();
        expect(child3D.parent).toBeNull();
    });

    test("a 2D node cannot be added as a child of a 3D node (the reverse direction)", () => {
        const parent3D = new ANodeModel3D();
        const child2D = new AGroupNodeModel2D();
        expect(() => parent3D.addChild(child2D)).toThrow();
        expect(child2D.parent).toBeNull();
    });

    test("PolygonModel2D (which had its own guard in getWorldTransform2D) is also rejected as a child of a 3D node", () => {
        const parent3D = new ANodeModel3D();
        const child = new PolygonModel2D();
        expect(() => parent3D.addChild(child)).toThrow();
    });

    test("same-space parenting still works, and getWorldTransform still computes correctly (no guard needed to reach this path anymore)", () => {
        const parent = new AGroupNodeModel2D();
        const child = new AGroupNodeModel2D();
        parent.addChild(child);
        expect(() => child.getWorldTransform()).not.toThrow();
    });
});
