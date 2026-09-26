/**
 * Tests for `AInteractionMode.addInteraction`: an interaction that already has an owner is rejected *before*
 * the mode touches it, so a failed add leaves nothing registered and the interaction's on/off state unchanged.
 */
// Import order matters: see the note in RenderMatrix.test.ts (in scene/__tests__).
import {AMeshModel2D} from "../../scene/nodes/2d/mesh2d/AMeshModel2D";
import {AInteraction, AMockInteractionEvent} from "../AInteraction";
import {AInteractionMode} from "../AInteractionMode";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

describe("AInteractionMode.addInteraction", () => {
    test("an interaction that already has an owner is not registered or toggled", () => {
        const mode = new AInteractionMode("TestMode");
        const interaction = new AInteraction(AMockInteractionEvent.GetMockElement());
        interaction.activate();
        interaction.owner = {} as any; // pretend another mode already owns it
        expect(() => mode.addInteraction(interaction)).toThrow("interaction already has owner");
        expect((mode as any).interactions).toHaveLength(0);
        // The mode is inactive, so a successful add would have deactivated the interaction.
        expect(interaction.active).toBe(true);
    });
});
