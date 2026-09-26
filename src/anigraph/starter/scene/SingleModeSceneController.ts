// import {
//     AGLContext, Color,
//     AClickInteraction, ADragInteraction,
//     AInteractionEvent, AKeyboardInteraction,
//     V3
// } from "../../index";
import {V3} from "../../math";
import {AClickInteraction, ADragInteraction, AInteractionEvent, AKeyboardInteraction} from "../../interaction";
import {ABasicSceneController} from "./ABasicSceneController";
import type {ACameraModel3D} from "../../scene/camera";

/**
 * A 3D scene controller that handles input directly, instead of through separate interaction-mode classes.
 * Subclasses implement the input callbacks below (`onClick`, `onKeyDown`, `onKeyUp`, and the three drag callbacks);
 * `initInteractions()` binds them and attaches keyboard, click, and drag interactions to the canvas, on top of the
 * inherited default interaction mode.
 *
 * `_beforeInitScene` places the camera at `(0,0,10)`, so the scene's camera must be an {@link ACameraModel3D}.
 */
export abstract class SingleModeSceneController extends ABasicSceneController{
    static ModeName:string="Default"
    /** The keyboard interaction created in `initInteractions()`; read `keyboardInteraction.keysDownState` for held keys. */
    keyboardInteraction!:AKeyboardInteraction;

    /** Called when the canvas is clicked. */
    abstract onClick(event:AInteractionEvent):void;
    /** Called when a key is pressed while the canvas has focus. */
    abstract onKeyDown(event:AInteractionEvent, interaction:AKeyboardInteraction):void;
    /** Called when a key is released while the canvas has focus. */
    abstract onKeyUp(event:AInteractionEvent, interaction:AKeyboardInteraction):void;
    // abstract onMouseMove(event?:AInteractionEvent, interaction?: ADOMPointerMoveInteraction):void;

    /** Called when a drag starts on the canvas. */
    abstract dragStartCallback(event:AInteractionEvent, interaction?:ADragInteraction):void;
    /** Called as the cursor moves during a drag. */
    abstract dragMoveCallback(event:AInteractionEvent, interaction?:ADragInteraction):void;
    /** Called when a drag ends. */
    abstract dragEndCallback(event:AInteractionEvent, interaction?:ADragInteraction):void;


    /**
     * Calls the inherited `initInteractions()`, then binds this controller's input callbacks and attaches keyboard,
     * click, and drag interactions to the canvas.
     */
    initInteractions() {
        super.initInteractions();
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onClick = this.onClick.bind(this);
        this.dragStartCallback = this.dragStartCallback.bind(this);
        this.dragMoveCallback = this.dragMoveCallback.bind(this);
        this.dragEndCallback = this.dragEndCallback.bind(this);
        // this.onMouseMove = this.onMouseMove.bind(this);
        this.eventTarget.tabIndex = this.tabIndex;

        this.keyboardInteraction = AKeyboardInteraction.Create(
            this.eventTarget,
            // this.eventTarget.ownerDocument,
            this.onKeyDown,
            this.onKeyUp,
        );
        this.addInteraction(this.keyboardInteraction);

        this.addInteraction(AClickInteraction.Create(this.eventTarget, this.onClick))

        this.addInteraction(ADragInteraction.Create(
            this.eventTarget,
            this.dragStartCallback,
            this.dragMoveCallback,
            this.dragEndCallback
        ))
    }

    /**
     * Runs the inherited `_beforeInitScene` (which makes the control panel's interaction-mode dropdown switch
     * modes), then resizes the rendering context to the window and moves the camera to `(0,0,10)`.
     */
    _beforeInitScene(...args:any[]){
        super._beforeInitScene(...args);
        if(this.renderWindow) {
            this.onWindowResize(this.renderWindow);
        }
        // this.camera.setPerspectiveFOV(75, this.renderWindow.aspect)
        // This starter is 3D-only (it sets a Vec3 camera position), unlike `cameraModel`'s dimension-agnostic type.
        (this.cameraModel as ACameraModel3D).setPosition(V3(0,0,10));

    }

    // async initScene() {
    //     super.initScene();
    // }




}
