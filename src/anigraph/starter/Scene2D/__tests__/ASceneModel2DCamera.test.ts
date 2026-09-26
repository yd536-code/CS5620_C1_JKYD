/**
 * Tests for the typed `cameraModel` accessor of {@link ASceneModel2D}.
 *
 * `ASceneModel.cameraModel` is typed as the general `CameraModelInterface & ANodeModel`, and `ASceneModel2D`
 * narrows it to {@link ACameraModel2D}. That lets 2D scene code move the camera with `this.cameraModel.prsa` without a
 * cast. The type-level part is checked by `tsc` compiling this file; these tests check the runtime behavior: the
 * narrowed accessor and the base-class accessor share one storage field, and assigning through either works.
 *
 * The cameras here are built with `new ACameraModel2D(ACamera.CreateOrthographic(...))` rather than the scene's
 * `init*Camera` helpers, because those read near/far defaults from the global app state, which unit tests don't set.
 */
// Load a higher-level module first; the engine has a circular import that only resolves in this order.
import {AMeshModel2D} from "../../../scene/nodes/2d/mesh2d/AMeshModel2D";
import {ASceneModel2D} from "../ASceneModel2D";
import {ACameraModel2D} from "../../../scene/camera/ACameraModel2D";
import {ASceneModel} from "../../../scene/ASceneModel";
import {ACamera, V2} from "../../../math";
import type {AppState} from "../../../appstate";

new AMeshModel2D();

/** Minimal concrete 2D scene model: every abstract hook is a no-op. */
class TestSceneModel2D extends ASceneModel2D {
    protected initScene(...args: any[]): void {}
    initAppState(appState: AppState): void {}
    timeUpdate(...args: any[]): void {}

    /** Moves the camera the way the C1 docs show, with no cast (fails to compile if the accessor isn't typed). */
    moveCameraTo(x: number, y: number) {
        this.cameraModel.prsa.position = V2(x, y);
    }
}

/** A 2D camera that doesn't need the app state. */
function makeCamera(): ACameraModel2D {
    return new ACameraModel2D(ACamera.CreateOrthographic(-3, 3, -3, 3, -5, 5));
}

describe("ASceneModel2D.cameraModel", () => {
    test("is undefined before a camera is set", () => {
        const scene = new TestSceneModel2D("scene");
        expect(scene.cameraModel).toBeUndefined();
    });

    test("assigning through the 2D accessor stores the camera, and the base-class accessor sees the same object", () => {
        const scene = new TestSceneModel2D("scene");
        const camera = makeCamera();
        scene.cameraModel = camera;
        expect(scene.cameraModel).toBe(camera);
        const asBase: ASceneModel = scene;
        expect(asBase.cameraModel).toBe(camera);
    });

    test("assigning through the base-class accessor is visible through the 2D accessor", () => {
        const scene = new TestSceneModel2D("scene");
        const camera = makeCamera();
        const asBase: ASceneModel = scene;
        asBase.cameraModel = camera;
        expect(scene.cameraModel).toBe(camera);
    });

    test("the camera can be moved through prsa without a cast", () => {
        const scene = new TestSceneModel2D("scene");
        scene.cameraModel = makeCamera();
        scene.moveCameraTo(1.5, -2);
        expect(scene.cameraModel.prsa.position.x).toBeCloseTo(1.5);
        expect(scene.cameraModel.prsa.position.y).toBeCloseTo(-2);
    });
});
