
import {
    ADragInteraction,
    AKeyboardInteraction,
    SetInteractionCallbacks,
    AInteractionEvent,
    AInteractionMode,
    ADOMPointerMoveInteraction, AClickInteraction, ARightClickInteraction
} from "../../interaction";
import {ACamera} from "../../math";
import type {CameraModelInterface} from "../camera";
import {ALabel, GetClassLabel} from "../../base";
import {V2} from "../../math";
import {AWheelInteraction} from "../../interaction/AWheelInteraction";
import type {ASceneController, HitList} from "../ASceneController";
import type {HasInteractionModeCallbacks} from "../../interaction";
import type {ANodeModel} from "../nodeModel";

/**
 * Base interaction mode for scene controllers (both Three.js and Two.js). It listens for keyboard, mouse-move,
 * wheel, drag, click, and right-click input on the render window's container and forwards each to a same-named
 * method (`onKeyDown`, `onKeyUp`, `onMouseMove`, `onWheelMove`, `onDragStart`, `onDragMove`, `onDragEnd`, `onClick`,
 * `onRightClick`). Those methods do nothing by default.
 *
 * To make a mode, either subclass and override the callbacks you need, or pass callbacks to
 * {@link ASceneController.createNewInteractionMode}. It also gives easy access to the scene's camera and to picking
 * (`getNodeAtCursor`, `getNodeModelAtCursor`).
 */
@ALabel("ASceneInteractionMode")
export class ASceneInteractionMode extends AInteractionMode implements HasInteractionModeCallbacks {

    /**
     * This mode class's own label (see `GetClassLabel`): the default name it's stored under in the
     * interaction mode map.
     */
    static InteractionModeClassName(): string {
        return GetClassLabel(this, true);
    }

    // onKeyDown!:CallbackType;
    // Default input callbacks: all do nothing. Override the ones you need (or pass them to the constructor).
    /** Called when a key is pressed. */
    onKeyDown(event:AInteractionEvent, interaction:AKeyboardInteraction){}
    /** Called when a key is released. */
    onKeyUp(event:AInteractionEvent, interaction:AKeyboardInteraction){}
    /** Called when the mouse wheel moves. */
    onWheelMove(event:AInteractionEvent, interaction?:AWheelInteraction){}
    /** Called when the pointer moves. */
    onMouseMove(event:AInteractionEvent, interaction?: ADOMPointerMoveInteraction){}
    /** Called when a drag starts (mouse button pressed). */
    onDragStart(event:AInteractionEvent, interaction:ADragInteraction){}
    /** Called as the pointer moves during a drag. */
    onDragMove(event:AInteractionEvent, interaction:ADragInteraction){}
    /** Called when a drag ends (mouse button released). */
    onDragEnd(event:AInteractionEvent, interaction:ADragInteraction){}
    /** Called on a click. The browser also sends a click at the end of a drag. */
    onClick(event:AInteractionEvent, interaction:AClickInteraction){}
    /** Called on a right-click. */
    onRightClick(event:AInteractionEvent, interaction:ARightClickInteraction){}

    /** The scene controller this mode belongs to. */
    get owner():ASceneController{
        return this._owner as ASceneController;
    }

    // onKeyUp!:CallbackType;
    // onMouseMove!:CallbackType;
    // onWheelMove!:AWheelInteractionCallback;
    // onDragStart!:ADragInteractionCallback;
    // onDragMove!:ADragInteractionCallback;
    // onDragEnd!:ADragInteractionCallback;

    // new ASceneInteractionMode(
    //     name,
    //     owner,
    //     {
    //         onKeyDown: (event:AInteractionEvent, interaction:AKeyboardInteraction)=>{},
    //         onKeyUp:(event:AInteractionEvent, interaction:AKeyboardInteraction)=>{},
    //         onDragStart:(event:AInteractionEvent, interaction:ADragInteraction)=>{},
    //         onDragMove:(event:AInteractionEvent, interaction:ADragInteraction)=>{},
    //         onDragEnd:(event:AInteractionEvent, interaction:ADragInteraction)=>{},
    //         // onClick:(event:AInteractionEvent)=>{},
    //         // afterActivate:(...args:any[])=>{},
    //         // afterDeactivate:(...args:any[])=>{},
    //         // beforeActivate:(...args:any[])=>{},
    //         // beforeDeactivate:(...args:any[])=>{},
    //         //dispose:()=>{},
    //     }
    // )

    /**
     * Sets up the mode's callbacks: the class's own methods, overridden by any in `interactionCallbacks`. If `owner`
     * is given, also calls `init(owner)` to start listening for input; otherwise call `init` yourself later.
     * @param name the mode's name; defaults to the class's label (`serializationLabel`)
     * @param owner the scene controller this mode belongs to
     * @param interactionCallbacks optional callbacks that replace the class's own `onKeyDown`, `onDragStart`, etc.
     */
    constructor(name?:string, owner?:ASceneController,
                interactionCallbacks?:HasInteractionModeCallbacks,
                ...args:any[]) {
        super(name, owner);
        //Set and bind default interaction callbacks if they are defined for class
        SetInteractionCallbacks(this, this, true);

        //Override with any custom callbacks provided in the argument to the constructor.
        if(interactionCallbacks) {
            SetInteractionCallbacks(this, interactionCallbacks, false);
        }
        if(name === undefined){
            this.name = this.serializationLabel;
        }
        this.isGUISelectable = true;
        if(owner){
            this.init(this.owner);
        }
    }


    /**
     * Creates the input interactions (keyboard, pointer move, wheel, drag, click, right-click) on `domElement` and
     * connects them to this mode's callbacks. Called by `init`.
     *
     * Every interaction is always created. The callback methods are always defined (the base class gives each a
     * no-op default, and `SetInteractionCallbacks` only ever replaces one with another function), so an input you
     * don't handle just reaches a callback that does nothing.
     */
    setupInteractions(){
        this.addInteraction(AKeyboardInteraction.Create(
            this.domElement.ownerDocument,
            this.onKeyDown,
            this.onKeyUp
        ));
        this.addInteraction(ADOMPointerMoveInteraction.Create(
            this.domElement,
            this.onMouseMove
        ));
        this.addInteraction(AWheelInteraction.Create(
            this.domElement,
            this.onWheelMove
        ));
        this.addInteraction(ADragInteraction.Create(
            this.domElement,
            this.onDragStart,
            this.onDragMove,
            this.onDragEnd
        ));
        this.addInteraction(AClickInteraction.Create(
            this.domElement,
            this.onClick
        ));
        this.addInteraction(ARightClickInteraction.Create(
            this.domElement,
            this.onRightClick
        ));
    }

    /** Returns the mouse movement (`movementX`, `movementY`) in pixels since the last mouse event, as a `Vec2`. */
    static GetMouseEventMovement(event:AInteractionEvent){
        let webEvent = (event.DOMEvent as MouseEvent);
        // @ts-ignore
        const movementX = webEvent.movementX || webEvent.mozMovementX || webEvent.webkitMovementX || 0;
        // @ts-ignore
        const movementY = webEvent.movementY || webEvent.mozMovementY || webEvent.webkitMovementY || 0;
        return V2(movementX, movementY);
    }



    /** The scene controller this mode belongs to (same as `owner`). */
    get sceneController(): ASceneController{
        return this.owner;
    }

    /**
     * This mode's class's own label (see `GetClassLabel`). Used as the mode's default name, which is the key
     * `AInteractionModeMap` stores it under -- so it must never be an ancestor's label, or several modes
     * would share one name and overwrite each other.
     */
    get serializationLabel(): string {
        return GetClassLabel(this.constructor, true);
    }

    /**
     * The scene's camera model (a node in the scene, 2D or 3D). Its wrapped `ACamera` is `camera`.
     */
    get cameraModel(): CameraModelInterface & ANodeModel {
        return this.owner.cameraModel;
    }

    /** The `ACamera` wrapped by `cameraModel` (projection, and pose math for 3D cameras). */
    get camera(): ACamera {
        return this.cameraModel.camera;
    }

    /** Returns the node views under the cursor. See {@link ASceneController.getNodeViewAtCursor}. */
    getNodeAtCursor(event: AInteractionEvent, firstPickOnly: boolean = true): HitList {
        return this.owner.getNodeViewAtCursor(event, firstPickOnly);
    }

    /** Returns the frontmost pickable node model under the cursor, or `undefined`. */
    getNodeModelAtCursor(event: AInteractionEvent): ANodeModel | undefined {
        return this.owner.getNodeModelAtCursor(event);
    }

    /** The DOM element this mode listens to: the owner's render window container. */
    // domElement!: HTMLElement;
    get domElement():HTMLElement{
        return this.owner._renderWindow.container;
    }



    /** Sets the owner and creates the input interactions (`setupInteractions`). */
    init(owner: ASceneController, ...args: any[]) {
        this._owner = owner;
        this.setupInteractions();
    }



    /**
     * Creates an instance of this class for `owner` in one call (instead of `new` followed by `init`).
     * @returns the new interaction mode
     */
    static Create(owner: ASceneController, ...args: any[]) {
        let controls = new this();
        controls.init(owner);
        return controls;
    }

}




