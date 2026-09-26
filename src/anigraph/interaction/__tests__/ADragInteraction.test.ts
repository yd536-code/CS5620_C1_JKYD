/**
 * A drag interaction created with only some of its callbacks survives a whole start/move/end sequence.
 * `ASceneInteractionMode` creates a drag when *any* of `onDragStart`/`onDragMove`/`onDragEnd`
 * exists, so the missing ones must default to no-ops.
 */
// Import order matters: see the note in RenderMatrix.test.ts (in scene/__tests__).
import {AMeshModel2D} from "../../scene/nodes/2d/mesh2d/AMeshModel2D";
import {AInteraction, AMockInteractionEvent} from "../AInteraction";
import {ADragInteraction} from "../ADragInteraction";
import {V2} from "../../math";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

function mockEvent() {
    const interaction = new AInteraction(AMockInteractionEvent.GetMockElement());
    return new AMockInteractionEvent(interaction, V2(0.1, 0.2), false, false, false, {} as any);
}

describe("ADragInteraction.Create with missing callbacks", () => {
    test("only an end callback: start and move are no-ops, end still runs", () => {
        const ended: any[] = [];
        const drag = ADragInteraction.Create(AMockInteractionEvent.GetMockElement(), undefined, undefined,
            (event: any) => { ended.push(event); });
        const event = mockEvent();
        expect(() => drag.callDragStartCallback(event)).not.toThrow();
        expect(() => drag.callDragMoveCallback(event)).not.toThrow();
        drag.callDragEndCallback(event);
        expect(ended).toEqual([event]);
    });

    test("only a move callback: start and end are no-ops, move still runs", () => {
        let moves = 0;
        const drag = ADragInteraction.Create(AMockInteractionEvent.GetMockElement(), undefined, () => { moves++; });
        const event = mockEvent();
        expect(() => drag.callDragStartCallback(event)).not.toThrow();
        drag.callDragMoveCallback(event);
        expect(() => drag.callDragEndCallback(event)).not.toThrow();
        expect(moves).toBe(1);
    });

    test("the start wrapper still records the start cursor when the start callback is missing", () => {
        const drag = ADragInteraction.Create(AMockInteractionEvent.GetMockElement(), undefined, undefined);
        const event = mockEvent();
        drag.callDragStartCallback(event);
        expect(drag._cursorStartNDCPosition).toBe(event.ndcCursor);
    });
});
