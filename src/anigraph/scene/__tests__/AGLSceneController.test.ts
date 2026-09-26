/**
 * Tests for `AGLSceneController.setCurrentRenderTarget`. Switching back to the canvas
 * (`null` or no argument) used to leave `currentRenderTarget` pointing at the old render target.
 *
 * `AGLSceneController` needs a real WebGL renderer to construct, so, like `ASceneController.test.ts`, this calls the
 * real prototype method against a small fake `this` with only what the method reads (`context.setRenderTarget`).
 */
// Import order matters: see the note in RenderMatrix.test.ts.
import {AMeshModel2D} from "../nodes/2d/mesh2d/AMeshModel2D";
import {AGLSceneController} from "../AGLSceneController";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

function makeFakeController() {
    const setRenderTarget = jest.fn();
    const fake: any = {context: {setRenderTarget}, _currentRenderTarget: null};
    Object.defineProperty(fake, "currentRenderTarget", {
        get: () => fake._currentRenderTarget,
    });
    return {fake, setRenderTarget};
}

describe("AGLSceneController.setCurrentRenderTarget", () => {
    test("setting a target records it and hands its three.js target to the renderer", () => {
        const {fake, setRenderTarget} = makeFakeController();
        const target: any = {target: "THREE_TARGET"};
        AGLSceneController.prototype.setCurrentRenderTarget.call(fake, target);
        expect(fake.currentRenderTarget).toBe(target);
        expect(setRenderTarget).toHaveBeenLastCalledWith("THREE_TARGET");
    });

    test.each([null, undefined])("switching back to the canvas with %p resets currentRenderTarget to null", (arg) => {
        const {fake, setRenderTarget} = makeFakeController();
        AGLSceneController.prototype.setCurrentRenderTarget.call(fake, {target: "THREE_TARGET"} as any);
        AGLSceneController.prototype.setCurrentRenderTarget.call(fake, arg);
        expect(fake.currentRenderTarget).toBeNull();
        expect(setRenderTarget).toHaveBeenLastCalledWith(null);
    });
});
