/**
 * Tests for `AInteractionEvent.ndcCursorForViewport`:
 * the pass-local NDC re-normalization that sits alongside the existing canvas-global `ndcCursor`, without
 * `interaction/` needing to depend on `scene/`'s `ARenderPass` (see the doc comment on the method itself).
 */
// Import order matters here: see `RenderMatrix.test.ts` (in `scene/__tests__`) for the underlying circular-import
// note. One extra trap: the
// priming import must be referenced as a *value* -- `@babel/preset-typescript` elides an import that never is.
import {AMeshModel2D} from "../../scene/nodes/2d/mesh2d/AMeshModel2D";
import {AInteraction, AMockInteractionEvent} from "../AInteraction";
import {V2} from "../../math";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

function mockEventAt(x: number, y: number) {
    const interaction = new AInteraction(AMockInteractionEvent.GetMockElement());
    // This test environment's jsdom has no global `PointerEvent`, which is what `AMockInteractionEvent`'s
    // constructor otherwise falls back to creating; passing a bare stand-in avoids that path entirely (all this
    // class's other members read from `_cursorPosition`, never from `_event`).
    return new AMockInteractionEvent(interaction, V2(x, y), false, false, false, {} as any);
}

describe("ndcCursorForViewport", () => {
    test("the full-canvas viewport is the identity: pass-local NDC equals ndcCursor", () => {
        const event = mockEventAt(0.3, -0.6);
        const local = event.ndcCursorForViewport([0, 0, 1, 1]);
        expect(local).not.toBeNull();
        expect(local!.x).toBeCloseTo(0.3);
        expect(local!.y).toBeCloseTo(-0.6);
    });

    test("a cursor in the right half of the canvas re-normalizes to the right-half viewport's own [-1, 1]", () => {
        // canvas-global ndc (0.5, 0) -> viewport-fraction (u, v) = (0.75, 0.5), inside the right-half viewport
        // [0.5, 0, 0.5, 1] at local-fraction ((0.75-0.5)/0.5, (0.5-0)/1) = (0.5, 0.5) -> local ndc (0, 0).
        const event = mockEventAt(0.5, 0);
        const local = event.ndcCursorForViewport([0.5, 0, 0.5, 1]);
        expect(local).not.toBeNull();
        expect(local!.x).toBeCloseTo(0);
        expect(local!.y).toBeCloseTo(0);
    });

    test("a cursor in the left half of the canvas falls outside the right-half viewport: null", () => {
        const event = mockEventAt(-0.5, 0);
        expect(event.ndcCursorForViewport([0.5, 0, 0.5, 1])).toBeNull();
    });

    test("the center of a bottom-left quarter viewport maps to that viewport's own center", () => {
        // canvas-global ndc (-0.5, -0.5) -> viewport-fraction (0.25, 0.25), the center of [0, 0, 0.5, 0.5].
        const event = mockEventAt(-0.5, -0.5);
        const local = event.ndcCursorForViewport([0, 0, 0.5, 0.5]);
        expect(local).not.toBeNull();
        expect(local!.x).toBeCloseTo(0);
        expect(local!.y).toBeCloseTo(0);
    });

    test("viewport edges are inclusive", () => {
        // canvas-global ndc (0, -1) -> viewport-fraction (0.5, 0) -- exactly the bottom edge of [0, 0, 1, 0.5].
        const event = mockEventAt(0, -1);
        expect(event.ndcCursorForViewport([0, 0, 1, 0.5])).not.toBeNull();
    });

    test("a degenerate (zero-size) viewport never contains the cursor", () => {
        const event = mockEventAt(0, 0);
        expect(event.ndcCursorForViewport([0, 0, 0, 1])).toBeNull();
        expect(event.ndcCursorForViewport([0, 0, 1, 0])).toBeNull();
    });
});
