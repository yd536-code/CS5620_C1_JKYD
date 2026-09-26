import {ALabel} from "../../../base";
import {
    ADragInteraction,
    AInteractionEvent,
    AKeyboardInteraction,
    AWheelInteraction
} from "../../../interaction";
import type {HasInteractionModeCallbacks} from "../../../interaction";
import {ASceneInteractionMode} from "../../../scene/interactionmodes/ASceneInteractionMode";
import type {ASceneController} from "../../../scene/ASceneController";
import {PanZoomController2D} from "../../interactionmodes/cameracontrollers/PanZoomController2D";
import type {ACameraModel2D} from "../../../scene/camera";
import {forwardToControllers} from "../../interactionmodes/cameracontrollers/ACameraController";

/**
 * Pan/zoom interaction mode for Two.js scenes: drag to pan, mouse wheel to zoom, Shift+P ("P") logs the camera transform, and
 * clicks log the cursor position. It hosts one `PanZoomController2D` in pixel-space mode, which moves the scene's
 * {@link ACameraModel2D}; the Two.js scene view then applies that camera to the drawing. Register it with
 * {@link ATwoJSAppSceneController.addDebugInteractionMode}.
 */
@ALabel("ATwoJSDebugInteractionMode")
export class ATwoJSDebugInteractionMode extends ASceneInteractionMode {
    static NameInGUI: string = "Debug";

    private _panZoomController?: PanZoomController2D;

    /**
     * The pan/zoom controller this mode forwards events to, created on first access. (It is created lazily because
     * `ASceneInteractionMode`'s constructor runs `init()` inside `super(...)`, and a field set there would be
     * reset by this class's field declarations right afterward.)
     * Each access also points it at the owner's current `cameraModel`, so it keeps working if the scene replaces its
     * camera model.
     */
    get panZoomController(): PanZoomController2D {
        // Point the controller at the owner's current camera model on every access, so it keeps working if the
        // scene replaces its camera model. (With no owner yet, keep whatever camera the controller already has.)
        const cameraModel = this.owner ? this.cameraModel as ACameraModel2D : undefined;
        if (!this._panZoomController) {
            this._panZoomController = new PanZoomController2D(cameraModel as ACameraModel2D, undefined, true);
        } else if (cameraModel && this._panZoomController.cameraModel !== cameraModel) {
            this._panZoomController.cameraModel = cameraModel;
        }
        return this._panZoomController;
    }

    /** Zoom change per unit of wheel movement (passes through to `panZoomController.zoomSpeed`). */
    get zoomSpeed() { return this.panZoomController.zoomSpeed; }
    set zoomSpeed(value: number) { this.panZoomController.zoomSpeed = value; }
    /** Smallest allowed camera zoom (passes through to `panZoomController.minZoom`). */
    get minZoom() { return this.panZoomController.minZoom; }
    set minZoom(value: number) { this.panZoomController.minZoom = value; }

    /** The camera controllers this mode forwards input events to (just `panZoomController`). */
    get cameraControllers(): PanZoomController2D[] {
        return [this.panZoomController];
    }

    constructor(owner?: ASceneController,
                name?: string,
                interactionCallbacks?: HasInteractionModeCallbacks,
                ...args: any[]) {
        super(name, owner, interactionCallbacks, ...args);
    }

    onDragStart(event: AInteractionEvent, interaction: ADragInteraction): void {
        forwardToControllers(this.cameraControllers, 'onDragStart', event, interaction);
    }

    onDragMove(event: AInteractionEvent, interaction: ADragInteraction): void {
        forwardToControllers(this.cameraControllers, 'onDragMove', event, interaction);
    }

    onDragEnd(event: AInteractionEvent, interaction: ADragInteraction): void {
        forwardToControllers(this.cameraControllers, 'onDragEnd', event, interaction);
    }

    onWheelMove(event: AInteractionEvent, interaction: AWheelInteraction): void {
        forwardToControllers(this.cameraControllers, 'onWheelMove', event, interaction);
    }

    onKeyDown(event: AInteractionEvent, interaction: AKeyboardInteraction): void {
        if (event.key === "P") {
            console.log(this.cameraModel.transform);
        }
    }

    onClick(event: AInteractionEvent): void {
        if (event.cursorPosition) {
            console.log(`Click at ${event.cursorPosition.x}, ${event.cursorPosition.y}`);
        }
    }
}
