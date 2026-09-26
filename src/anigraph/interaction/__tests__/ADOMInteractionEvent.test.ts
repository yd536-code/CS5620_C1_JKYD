/**
 * Tests that `ADOMInteractionEvent`'s position getters work when the owner's event target is an SVG element.
 * An `<svg>` is an `Element` but not an `HTMLElement`, so every getter must check for `Element`.
 */
// Import order matters: see the note in RenderMatrix.test.ts (in scene/__tests__).
import {AMeshModel2D} from "../../scene/nodes/2d/mesh2d/AMeshModel2D";
import {ADOMInteractionEvent, AInteraction, AMockInteractionEvent} from "../AInteraction";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

function makeSVGEvent() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    // A 200x100 box at the page origin, so the expected coordinates are easy to work out.
    svg.getBoundingClientRect = () => ({left: 0, top: 0, right: 200, bottom: 100, width: 200, height: 100} as any);
    const interaction = new AInteraction(AMockInteractionEvent.GetMockElement());
    interaction.owner = {eventTarget: svg} as any;
    return new ADOMInteractionEvent({clientX: 150, clientY: 25} as any, interaction);
}

describe("ADOMInteractionEvent with an SVG event target", () => {
    test("positionInContext gives pixel coordinates", () => {
        const p = makeSVGEvent().positionInContext;
        expect(p).not.toBeNull();
        expect(p!.x).toBeCloseTo(150);
        expect(p!.y).toBeCloseTo(25);
    });

    test("cursorPositionCenterOrigin gives coordinates (not null)", () => {
        const p = makeSVGEvent().cursorPositionCenterOrigin;
        expect(p).not.toBeNull();
        expect(p!.x).toBeCloseTo(50);  // 150 - 100
        expect(p!.y).toBeCloseTo(25);  // 50 - 25 (y up)
    });

    test("ndcCursor gives coordinates (not null)", () => {
        const p = makeSVGEvent().ndcCursor;
        expect(p).not.toBeNull();
        expect(p!.x).toBeCloseTo(0.5);
        expect(p!.y).toBeCloseTo(0.5);
    });
});
