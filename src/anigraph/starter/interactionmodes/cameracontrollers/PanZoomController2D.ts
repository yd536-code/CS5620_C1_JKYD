import type {AInteractionEvent} from "../../../interaction";
import type {ADragInteraction} from "../../../interaction/ADragInteraction";
import type {AWheelInteraction} from "../../../interaction/AWheelInteraction";
import type {Vec2} from "../../../math";
import type {ACameraModel2D} from "../../../scene/camera";
import type {ACameraController} from "./ACameraController";

/**
 * Drag-to-pan and wheel-to-zoom controls for a 2D camera ({@link ACameraModel2D}), on both the Three.js and Two.js
 * backends. Used by {@link APanZoomInteractionMode2D} (Three.js) and {@link ATwoJSDebugInteractionMode} (Two.js).
 *
 * - **Pan** moves the camera model's own 2D transform (`cameraModel.prsa.position`), which is what a 2D camera
 *   renders from on both backends. The camera moves opposite the drag, so the content follows the cursor. If the
 *   camera model's transform is a `Mat3`, the first drag converts it to a `NodeTransform2D` with
 *   `convertTransformToPRSA()`.
 * - **Zoom** changes the wrapped `ACamera`'s `zoom` (higher = more magnified on both backends). Scrolling down
 *   zooms out, never below `minZoom`.
 *
 * How the pan distance is measured depends on the backend's camera convention, set by `pixelSpace`:
 * - `pixelSpace = false` (Three.js): the drag is converted to world coordinates with `cameraModel.ndcToWorld` at the
 *   current and previous cursor positions.
 * - `pixelSpace = true` (Two.js): the drag is measured in canvas pixels (`event.cursorPosition`) and divided by the
 *   current zoom. The Two.js scene view draws with `translation = -position * zoom`, so this makes one pixel of
 *   drag move the content by one pixel at any zoom.
 */
export class PanZoomController2D implements ACameraController {
    /** The camera model this controller moves. The interaction modes that own a controller re-point this at the
     * scene's current camera model each time they use the controller, so replacing the scene's camera works. */
    cameraModel: ACameraModel2D;
    /** Change in `cameraModel.camera.zoom` per unit of wheel `deltaY`. */
    zoomSpeed: number = 0.001;
    /** Smallest allowed `cameraModel.camera.zoom`, so zooming out can't collapse or flip the view. */
    minZoom: number = 0.1;
    /** When true, measures the pan from `event.cursorPosition` (canvas pixels, divided by the current zoom) instead
     * of `event.ndcCursor` through `cameraModel.ndcToWorld`. {@link ATwoJSDebugInteractionMode} passes `true`;
     * {@link APanZoomInteractionMode2D} leaves it `false`. See the class docstring. */
    readonly pixelSpace: boolean;

    /**
     * @param cameraModel the 2D camera model to move
     * @param zoomSpeed overrides the default `zoomSpeed`
     * @param pixelSpace `true` for Two.js scenes (see `pixelSpace`). Defaults to `false`.
     */
    constructor(cameraModel: ACameraModel2D, zoomSpeed?: number, pixelSpace?: boolean) {
        this.cameraModel = cameraModel;
        if (zoomSpeed !== undefined) this.zoomSpeed = zoomSpeed;
        this.pixelSpace = pixelSpace ?? false;
    }

    /** The wrapped `ACamera` of `cameraModel` (holds `zoom`). */
    get camera() {
        return this.cameraModel.camera;
    }

    /** The cursor position to track for panning, in whichever space this controller was configured for. */
    private _cursorForDrag(event: AInteractionEvent): Vec2 | null {
        return this.pixelSpace ? event.cursorPosition : event.ndcCursor;
    }

    onDragStart(event: AInteractionEvent, interaction: ADragInteraction): void {
        interaction.setInteractionState('lastCursor', this._cursorForDrag(event));
    }

    onDragMove(event: AInteractionEvent, interaction: ADragInteraction): void {
        const cursor = this._cursorForDrag(event);
        const lastCursor = interaction.getInteractionState('lastCursor');
        interaction.setInteractionState('lastCursor', cursor);
        if (!cursor || !lastCursor) {
            // No cursor (this event) or no prior cursor (drag just started outside the canvas) means there is
            // nothing to compute a delta against.
            return;
        }
        const delta = this.pixelSpace
            ? cursor.minus(lastCursor).times(1 / this.camera.zoom)
            : this.cameraModel.ndcToWorld(cursor).minus(this.cameraModel.ndcToWorld(lastCursor));
        // `prsa` throws if the camera model's transform is a Mat3, so convert it first. convertTransformToPRSA() does
        // nothing if it already is a NodeTransform2D (the default). A Mat3 transform is replaced by a NodeTransform2D
        // with anchor 0 (and a warning if the matrix has shear).
        this.cameraModel.convertTransformToPRSA();
        const pose = this.cameraModel.prsa;
        // Subtract, not add: moving the camera opposite the drag is what makes the *content* appear to follow the
        // cursor (the usual "grab and drag" pan convention -- matches three.js's own OrbitControls.pan sign).
        pose.position = pose.position.minus(delta);
    }

    onDragEnd(event: AInteractionEvent, interaction: ADragInteraction): void {
    }

    onWheelMove(event: AInteractionEvent, interaction: AWheelInteraction): void {
        const deltaY = (event.DOMEvent as WheelEvent).deltaY;
        // Scrolling down (deltaY > 0) zooms out. Higher `zoom` means more magnified on both backends, so this
        // needs no backend branch.
        this.camera.zoom = Math.max(this.minZoom, this.camera.zoom - deltaY * this.zoomSpeed);
    }
}
