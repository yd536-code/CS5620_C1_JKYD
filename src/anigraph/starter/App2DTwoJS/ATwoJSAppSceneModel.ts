import {ASceneModel2D} from "../Scene2D/ASceneModel2D";
import {ASerializable} from "../../base";

/**
 * Base class for the scene model of a Two.js 2D scene. It is an {@link ASceneModel2D} (same lifecycle:
 * `initAppState`, `PreloadAssets`, `initCamera`, `initScene`), with a default camera and an empty `timeUpdate`.
 *
 * Subclasses must implement `initScene()` (create node models and add them with `this.addNode(node)`); override
 * `timeUpdate` and `initAppState` as needed.
 *
 * **Camera and coordinates:** `initCamera` creates an {@link ACameraModel2D}. The Two.js scene view applies that
 * camera's position and zoom to the whole drawing (`translation = -position * zoom`, `scale = zoom`), so the default
 * camera (position 0, zoom 1) leaves raw canvas pixels unchanged: 1 model unit = 1 canvas pixel, origin at the top
 * left, y pointing down. Two.js scenes work in this pixel space and read the cursor from `event.cursorPosition`.
 * (The inherited `getWorldCoordinatesOfCursorEvent` goes through the camera's orthographic projection instead, so
 * its result does not match what Two.js draws.)
 */
@ASerializable("ATwoJSAppSceneModel")
export abstract class ATwoJSAppSceneModel extends ASceneModel2D {
    /**
     * Creates an orthographic {@link ACameraModel2D} spanning `[-scale, scale]` and adds it to the scene. Two.js only
     * uses the camera's position and zoom, not this view volume.
     * @param scale defaults to 1
     */
    initCamera(scale?: number): void {
        this.initUniformOrthographicCamera(scale ?? 1);
    }

    /**
     * Per-frame model update, called with no arguments by the Two.js scene controller's `onAnimationFrameCallback`
     * (use `this.clock.time` for the time). Does nothing by default; override it with your scene's time-based logic.
     */
    timeUpdate(..._args: any[]): void {}
}
