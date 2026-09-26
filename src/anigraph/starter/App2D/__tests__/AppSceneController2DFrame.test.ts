/**
 * Tests for the default per-frame loop of {@link AppSceneController2D} (`onAnimationFrameCallback`).
 *
 * The 2D starter controller should update the scene model once per frame, like the 3D starter does: it calls
 * `model.timeUpdate(model.clock.currentTime)`, then its own `timeUpdate()` (interaction modes), then clears and
 * renders. `currentTime` is the clock's time computed at that moment, not the value from its last system-time tick,
 * so frame-to-frame steps follow the real frame timing.
 *
 * Building a real controller needs a WebGL context, so these call the real prototype method on a small fake `this`
 * that has only the members the method reads (the same technique as `scene/__tests__/ASceneController.test.ts`).
 */
// Load a higher-level module first; the engine has a circular import that only resolves in this order.
import {AMeshModel2D} from "../../../scene/nodes/2d/mesh2d/AMeshModel2D";
import {AppSceneController2D} from "../AppSceneController2D";

new AMeshModel2D();

/**
 * Makes a fake controller that records the order of the calls made during one frame.
 * @param time the value the fake model's clock computes for `currentTime`. Its stored `time` (from the last tick)
 * is deliberately different, so a test can tell which one was used.
 */
function makeFakeController(time: number) {
    const calls: string[] = [];
    const modelTimeUpdate = jest.fn((..._args: any[]) => {calls.push("model.timeUpdate");});
    const fakeThis = {
        model: {clock: {time: time - 0.016, currentTime: time}, timeUpdate: modelTimeUpdate},
        timeUpdate: () => calls.push("controller.timeUpdate"),
        getThreeJSScene: () => "scene",
        getThreeJSCamera: () => "camera",
    };
    const context = {
        renderer: {
            clear: () => calls.push("clear"),
            render: () => calls.push("render"),
        },
    };
    return {fakeThis, context, calls, modelTimeUpdate};
}

describe("AppSceneController2D.onAnimationFrameCallback", () => {
    test("calls model.timeUpdate once per frame, with the model clock's currentTime", () => {
        const {fakeThis, context, modelTimeUpdate} = makeFakeController(2.5);

        AppSceneController2D.prototype.onAnimationFrameCallback.call(fakeThis, context as any);

        expect(modelTimeUpdate).toHaveBeenCalledTimes(1);
        expect(modelTimeUpdate).toHaveBeenCalledWith(2.5);
    });

    test("updates the model, then the controller, then clears and renders", () => {
        const {fakeThis, context, calls} = makeFakeController(0);

        AppSceneController2D.prototype.onAnimationFrameCallback.call(fakeThis, context as any);

        expect(calls).toEqual(["model.timeUpdate", "controller.timeUpdate", "clear", "render"]);
    });
});
