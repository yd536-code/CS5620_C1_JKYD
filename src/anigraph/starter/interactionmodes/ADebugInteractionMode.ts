import {
    ALabel
} from "../../base";
import {ADOMPointerMoveInteraction, ADragInteraction,
    AInteractionEvent,
    AKeyboardInteraction
} from "../../interaction";
import {ASceneController} from "../../scene/ASceneController";
import {AWheelInteraction} from "../../interaction/AWheelInteraction";
import {ASceneInteractionMode} from "../../scene/interactionmodes/ASceneInteractionMode";
import {FlyController3D} from "./cameracontrollers/FlyController3D";
import {OrbitController3D} from "./cameracontrollers/OrbitController3D";
import type {ACameraController} from "./cameracontrollers/ACameraController";
import {forwardToControllers} from "./cameracontrollers/ACameraController";

import type {HasInteractionModeCallbacks} from "../../interaction";

/**
 * The default 3D camera interaction mode ("fly plus orbit"):
 * - W/A/S/D move the camera forward/left/back/right, R/F move it up/down, and the mouse wheel dollies it along its
 *   view axis (`FlyController3D`).
 * - Dragging rotates the camera around `cameraOrbitCenter`, the world origin by default (`OrbitController3D`).
 * - Shift+P ("P") logs the camera transform.
 *
 * Each input callback is forwarded to whichever of the two controllers handles it. `cameraMovementSpeed`,
 * `cameraOrbitSpeed`, and `cameraOrbitCenter` pass through to the controllers' fields. Registered by
 * {@link ABasicSceneController.addDebugInteractionMode}.
 *
 * The controllers are created lazily, on first access: `ASceneInteractionMode`'s constructor runs `init()` inside
 * `super(...)`, and a field set there would be reset by this class's field declarations right afterward. Each access
 * also points them at the owner's current `cameraModel`, so replacing the scene's camera model just works.
 */
@ALabel("ADebugInteractionMode")
export class ADebugInteractionMode extends ASceneInteractionMode{
    private _flyController?:FlyController3D;
    private _orbitController?:OrbitController3D;
    static NameInGUI:string = "Debug";

    /** Handles WASD/RF movement and wheel dolly. Created on first access; on every access it is pointed at the
     * scene's current camera model (see `_currentCameraModel`), so it keeps working if the scene replaces its camera. */
    get flyController():FlyController3D{
        const cameraModel = this._currentCameraModel();
        if(!this._flyController){
            this._flyController = new FlyController3D(cameraModel as any);
        }else if(cameraModel && this._flyController.cameraModel !== cameraModel){
            this._flyController.cameraModel = cameraModel;
        }
        return this._flyController;
    }

    /** Handles drag-to-rotate. Created on first access; on every access it is pointed at the scene's current camera
     * model, like `flyController`. */
    get orbitController():OrbitController3D{
        const cameraModel = this._currentCameraModel();
        if(!this._orbitController){
            this._orbitController = new OrbitController3D(cameraModel as any);
        }else if(cameraModel && this._orbitController.cameraModel !== cameraModel){
            this._orbitController.cameraModel = cameraModel;
        }
        return this._orbitController;
    }

    /**
     * The owner's current camera model, or `undefined` if this mode has no owner yet (for example, when a setting
     * such as `cameraOrbitSpeed` is changed before `init(owner)`). The controller getters call this on every event,
     * so the controllers always move whichever camera the scene is using right now.
     */
    _currentCameraModel(){
        return this.owner ? this.cameraModel : undefined;
    }

    /** Distance moved per key event (passes through to `flyController.movementSpeed`). */
    get cameraMovementSpeed(){return this.flyController.movementSpeed;}
    set cameraMovementSpeed(value:number){this.flyController.movementSpeed = value;}
    /** Rotation per unit of cursor movement in NDC (passes through to `orbitController.orbitSpeed`). */
    get cameraOrbitSpeed(){return this.orbitController.orbitSpeed;}
    set cameraOrbitSpeed(value:number){this.orbitController.orbitSpeed = value;}
    /** The point the camera orbits when you drag, in world coordinates (passes through to
     * `orbitController.orbitCenter`). Defaults to the world origin. */
    get cameraOrbitCenter(){return this.orbitController.orbitCenter;}
    set cameraOrbitCenter(value){this.orbitController.orbitCenter = value;}

    /** The camera controllers input events are forwarded to, in order. Override this getter to add or replace a
     * controller without overriding every `onX` method. */
    get cameraControllers():ACameraController[]{
        return [this.flyController, this.orbitController];
    }

    constructor(owner?:ASceneController,
                name?:string,
                interactionCallbacks?:HasInteractionModeCallbacks,
                ...args:any[]) {
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

    onMouseMove(event:AInteractionEvent, interaction: ADOMPointerMoveInteraction){

    }

    onKeyDown(event:AInteractionEvent, interaction:AKeyboardInteraction){
        forwardToControllers(this.cameraControllers, 'onKeyDown', event, interaction);
        if(event.key === "P"){
            console.log(this.cameraModel.transform)
        }
    }

    onKeyUp(event:AInteractionEvent, interaction:AKeyboardInteraction){
        forwardToControllers(this.cameraControllers, 'onKeyUp', event, interaction);
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
