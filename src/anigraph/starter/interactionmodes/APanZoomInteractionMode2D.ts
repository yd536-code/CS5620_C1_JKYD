import {
    ALabel
} from "../../base";
import {
    ADragInteraction,
    AInteractionEvent
} from "../../interaction";
import {ASceneController} from "../../scene/ASceneController";
import {AWheelInteraction} from "../../interaction/AWheelInteraction";
import {ASceneInteractionMode} from "../../scene/interactionmodes/ASceneInteractionMode";
import {PanZoomController2D} from "./cameracontrollers/PanZoomController2D";
import type {ACameraModel2D} from "../../scene/camera";
import {forwardToControllers} from "./cameracontrollers/ACameraController";

import type {HasInteractionModeCallbacks} from "../../interaction";

/**
 * The 2D (Three.js) starter's default interaction mode: drag to pan and mouse wheel to zoom the scene's
 * {@link ACameraModel2D}. It forwards input to one `PanZoomController2D`. {@link ASceneController2D} registers it
 * in `initInteractions()` instead of the 3D {@link ADebugInteractionMode}, which has no effect on a 2D camera.
 *
 * `panZoomController` is created lazily, on first access: `ASceneInteractionMode`'s constructor runs `init()` inside
 * `super(...)`, and a field set there would be reset by this class's field declarations right afterward.
 */
@ALabel("APanZoomInteractionMode2D")
export class APanZoomInteractionMode2D extends ASceneInteractionMode {
    private _panZoomController?: PanZoomController2D;
    static NameInGUI: string = "Pan/Zoom";

    /** The pan/zoom controller this mode forwards events to. Created on first access, and pointed at the owner's
     * current `cameraModel` on every access. */
    get panZoomController(): PanZoomController2D {
        // Point the controller at the owner's current camera model on every access, so it keeps working if the
        // scene replaces its camera model. (With no owner yet, keep whatever camera the controller already has.)
        const cameraModel = this.owner ? this.cameraModel as ACameraModel2D : undefined;
        if (!this._panZoomController) {
            this._panZoomController = new PanZoomController2D(cameraModel as ACameraModel2D);
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

    /** The camera controllers input events are forwarded to (just `panZoomController`). Override this getter to add
     * another controller. */
    get cameraControllers(): PanZoomController2D[] {
        return [this.panZoomController];
    }

    constructor(owner?: ASceneController,
                name?: string,
                interactionCallbacks?: HasInteractionModeCallbacks,
                ...args: any[]) {
        super(name, owner, interactionCallbacks, ...args);
    }

    /**
     * Creates an instance and calls `init(owner)` in one step.
     * @param owner the scene controller that will own this mode
     */
    static Create(owner: ASceneController, ...args: any[]) {
        let controls = new this();
        controls.init(owner);
        return controls;
    }

    onWheelMove(event: AInteractionEvent, interaction: AWheelInteraction) {
        forwardToControllers(this.cameraControllers, 'onWheelMove', event, interaction);
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
}
