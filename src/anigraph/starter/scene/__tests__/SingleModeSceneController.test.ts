/**
 * Tests that `SingleModeSceneController._beforeInitScene` runs the inherited `ABasicSceneController._beforeInitScene`,
 * which subscribes the controller to the control panel's interaction-mode dropdown (`addInteractionModeAppState`).
 *
 * Building a real scene controller needs a browser (WebGL), so the method is called on a stand-in object that has
 * only what `_beforeInitScene` touches. `super` inside the method still resolves to `ABasicSceneController`.
 */
// Import order matters: see the note in RenderMatrix.test.ts (in scene/__tests__).
import {AMeshModel2D} from "../../../scene/nodes/2d/mesh2d/AMeshModel2D";
import {V3} from "../../../math";
import {SingleModeSceneController} from "../SingleModeSceneController";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

describe("SingleModeSceneController._beforeInitScene", () => {
    test("calls the inherited _beforeInitScene (dropdown wiring) and still moves the camera to (0, 0, 10)", () => {
        const fake = {
            renderWindow: undefined,
            onWindowResize: jest.fn(),
            cameraModel: {setPosition: jest.fn()},
            addInteractionModeAppState: jest.fn(),
        };
        SingleModeSceneController.prototype._beforeInitScene.call(fake as any);

        expect(fake.addInteractionModeAppState).toHaveBeenCalledTimes(1);
        expect(fake.cameraModel.setPosition).toHaveBeenCalledTimes(1);
        const position = fake.cameraModel.setPosition.mock.calls[0][0];
        expect(position.elements).toEqual(V3(0, 0, 10).elements);
    });
});
