/**
 * Tests for Two.js fixes:
 * - `setWireframe(false)` draws stroke and fill; `setWireframe(true)` draws the stroke only.
 *   `setStrokeEnabled(false)` is the way to get a fill-only shape.
 * - a text graphic's stroke stays off after later style setters such as `setColor`.
 * - `ATwoJSSceneView.onModelNodeAdded` skips models with no view class silently, but a view that throws while
 *   it is being set up produces a visible `console.error` instead of disappearing without a trace.
 * - `ATwoJSPolygonGraphic.setVerts` with no vertices clears `twoShape`, and later vertices render again.
 */
// Import order matters: see the note in RenderMatrix.test.ts (in scene/__tests__).
import {AMeshModel2D} from "../../../scene/nodes/2d/mesh2d/AMeshModel2D";
import {Color, V2} from "../../../math";
import {VertexArray2D} from "../../../geometry";
import {ATwoJSMaterial} from "../ATwoJSMaterial";
import {ATwoJSPathGraphic, ATwoJSPolygonGraphic, ATwoJSTextGraphic} from "../graphicelements";
import {ATwoJSSceneView} from "../ATwoJSSceneView";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

/** A closed triangle path, used to check what `applyToShape` writes. */
function triangle() {
    return new ATwoJSPathGraphic([V2(0, 0), V2(10, 0), V2(0, 10)], true, Color.FromRGBA(1, 0, 0, 1));
}

describe("ATwoJSMaterial.setWireframe", () => {
    test("setWireframe(false): stroke on and fill on", () => {
        const g = triangle();
        g.setWireframe(false);
        const shape: any = g.twoShape;
        expect(shape.fill).toBe("rgb(255,0,0)");
        expect(shape.stroke).toBe("rgb(0,0,0)");
        expect(shape.linewidth).toBe(1);
    });

    test("setWireframe(true): stroke only, no fill", () => {
        const g = triangle();
        g.setWireframe(true);
        const shape: any = g.twoShape;
        expect(shape.fill).toBe("none");
        expect(shape.stroke).toBe("rgb(0,0,0)");
    });

    test("setWireframe(false) after setWireframe(true) turns the fill back on", () => {
        const m = new ATwoJSMaterial();
        m.setWireframe(true);
        m.setWireframe(false);
        expect(m.style.noFill).toBe(false);
        expect(m.style.noStroke).toBe(false);
    });

    test("setStrokeEnabled(false) gives a fill-only shape", () => {
        const g = triangle();
        g.setStrokeEnabled(false);
        const shape: any = g.twoShape;
        expect(shape.fill).toBe("rgb(255,0,0)");
        expect(shape.stroke).toBe("none");
    });
});

describe("ATwoJSTextGraphic stroke", () => {
    test("the stroke stays off after setColor", () => {
        const t = new ATwoJSTextGraphic("hello", 12);
        expect(t.twoShape.stroke).toBe("none");
        t.setColor(Color.FromRGBA(0, 0, 1, 1));
        expect(t.twoShape.fill).toBe("rgb(0,0,255)");
        expect(t.twoShape.stroke).toBe("none");
    });

    test("setStroke turns the stroke on on purpose", () => {
        const t = new ATwoJSTextGraphic("hello", 12);
        t.setStroke(Color.FromRGBA(1, 0, 0, 1), 2);
        expect(t.twoShape.stroke).toBe("rgb(255,0,0)");
        expect(t.twoShape.linewidth).toBe(2);
    });
});

describe("ATwoJSSceneView.onModelNodeAdded errors", () => {
    function makeView(): ATwoJSSceneView {
        // No camera model, so the view skips camera sync. See ATwoJSSceneView.test.ts for this fake controller.
        const fakeController: any = {model: {}};
        return new ATwoJSSceneView(fakeController);
    }

    test("a model with no view class is skipped silently", () => {
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        try {
            const view = makeView();
            expect(() => view.onModelNodeAdded(new AMeshModel2D())).not.toThrow();
            expect(errorSpy).not.toHaveBeenCalled();
        } finally {
            errorSpy.mockRestore();
        }
    });

    test("a view that throws while being set up produces a visible error", () => {
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        try {
            class BrokenView {
                setController() {}
                setModel() { throw new Error("broken view init"); }
            }
            const view = makeView();
            view.setDefaultViewClass(BrokenView as any);
            view.onModelNodeAdded(new AMeshModel2D());
            expect(errorSpy).toHaveBeenCalled();
            expect(String(errorSpy.mock.calls[0].join(" "))).toContain("broken view init");
        } finally {
            errorSpy.mockRestore();
        }
    });
});

describe("ATwoJSPolygonGraphic.setVerts with no vertices", () => {
    test("empty verts clear twoShape; later verts render again", () => {
        const square = new VertexArray2D();
        square.addVertices([V2(0, 0), V2(1, 0), V2(1, 1), V2(0, 1)]);
        const g = new ATwoJSPolygonGraphic(square);
        const group: any = g.displayObject.nativeGroup;
        expect(g.twoShape).not.toBeNull();
        expect(group.children.length).toBe(1);

        g.setVerts(new VertexArray2D());
        expect(g.twoShape).toBeNull();
        expect(group.children.length).toBe(0);

        g.setVerts(square);
        expect(g.twoShape).not.toBeNull();
        expect(group.children.length).toBe(1);
        expect(group.children[0]).toBe(g.twoShape);
    });
});
