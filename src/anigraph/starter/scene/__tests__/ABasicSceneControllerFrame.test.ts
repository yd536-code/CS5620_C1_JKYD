/**
 * Tests for the default per-frame loop of {@link ABasicSceneController} (`_basicAnimationFrameCallback`), which the
 * 3D starter controller uses.
 *
 * It should update the scene model with `model.clock.currentTime` (the clock's time computed at that moment, not
 * the value from its last system-time tick), then update the controller, then render the passes.
 *
 * A real controller needs a WebGL context, so these call the real prototype method on a small fake `this`.
 */
// Load a higher-level module first; the engine has a circular import that only resolves in this order.
import {AMeshModel2D} from "../../../scene/nodes/2d/mesh2d/AMeshModel2D";
import {ABasicSceneController} from "../ABasicSceneController";

new AMeshModel2D();

describe("ABasicSceneController._basicAnimationFrameCallback", () => {
    test("updates the model with the clock's currentTime, then the controller, then renders", () => {
        const calls: string[] = [];
        const modelTimeUpdate = jest.fn((..._args: any[]) => {calls.push("model.timeUpdate");});
        const fakeThis = {
            // The stored `time` is from the last tick; `currentTime` is computed now. They differ on purpose.
            model: {clock: {time: 1.0, currentTime: 1.012}, timeUpdate: modelTimeUpdate},
            timeUpdate: () => calls.push("controller.timeUpdate"),
            renderPasses: () => calls.push("render"),
        };

        ABasicSceneController.prototype._basicAnimationFrameCallback.call(fakeThis, {} as any);

        expect(modelTimeUpdate).toHaveBeenCalledTimes(1);
        expect(modelTimeUpdate).toHaveBeenCalledWith(1.012);
        expect(calls).toEqual(["model.timeUpdate", "controller.timeUpdate", "render"]);
    });
});
