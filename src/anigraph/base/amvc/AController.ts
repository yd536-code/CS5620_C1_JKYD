import {AModel} from "./AModel";
import {AObjectNode} from "../aobject";
import {AClock} from "../../time";
import {AInteraction, AInteractionMode, AInteractionModeMap, BasicInteractionModes} from "../../interaction";
import {CallbackType} from "../../basictypes";
import {BezierTween} from "../../geometry/BezierTween";
import type {ARenderContext, ARenderWindow} from "../../rendering";
import {HasInteractions} from "./HasInteractions";

/** What every controller provides: its scene controller and the DOM element its interactions listen to. */
export interface AControllerInterface{
    sceneController:SceneControllerInterface;
    get eventTarget():HTMLElement;
}

/** What a scene controller provides to the rendering code (implemented by `ASceneController`). */
export interface SceneControllerInterface extends AControllerInterface{
    /** Whether rendering has been set up and frames can be drawn. */
    get isReadyToRender():boolean;
    /** Sets up rendering into the given render window. */
    initRendering(renderWindow: ARenderWindow):Promise<void>;
    /** Called once per animation frame. */
    onAnimationFrameCallback(context: ARenderContext):void;
    /** Called when the render window is resized. */
    onWindowResize(renderWindow: ARenderWindow):void;
    get renderWindow(): ARenderWindow;
    get context(): ARenderContext;
}

/**
 * Base class for controllers in AniGraph's model-view-controller design. A controller handles user input through
 * named interaction modes (see {@link HasInteractions}) and has its own clock, which starts playing when the
 * controller is created and drives `addTimedAction`.
 */
export abstract class AController extends AObjectNode implements AControllerInterface, HasInteractions{
    protected _model!:AModel;
    protected _clock: AClock;
    /** The current time of this controller's clock. */
    get time(){
        return this._clock.time;
    }
    /** The scene controller this controller belongs to. */
    abstract get sceneController():SceneControllerInterface;
    /** The DOM element that interactions listen to for events. */
    abstract get eventTarget():HTMLElement;

    /**
     * Interaction mode map. Its `modes` property maps mode names to {@link AInteractionMode}s.
     * @protected
     */
    protected _interactions!: AInteractionModeMap;
    /**
     * The name of the current mode, which can be active or inactive. A controller has at most one active mode at a
     * time.
     * @protected
     */
    protected _currentInteractionModeName: string;

    /** The defined interaction modes, by name. */
    get interactionModes(){
        return this._interactions.modes;
    }

    /**
     * The name of the current interaction mode (active or inactive). Used by GUI code outside the class hierarchy
     * (e.g. `ControlPanelInteractionModeWiring`).
     */
    get currentInteractionModeName(){
        return this._currentInteractionModeName;
    }


    /**
     * The current interaction mode.
     */
    get interactionMode() {
        return this._interactions.modes[this._currentInteractionModeName];
    }

    constructor() {
        super();
        this._clock = new AClock();
        this._clock.play();
        this._interactions = new AInteractionModeMap(this);
        this._currentInteractionModeName = BasicInteractionModes.default;
    }

    /** The DOM element of the scene controller's render context. */
    getContextDOMElement(){
        return this.sceneController.context.domElement;
    }

    /**
     * Adds an interaction to the current mode.
     * @param interaction
     * @returns the interaction
     */
    addInteraction(interaction: AInteraction) {
        this.interactionMode.addInteraction(interaction);
        // interaction.owner = this;
        return interaction;
    }

    /** Activates the current interaction mode. */
    activateInteractions() {
        this.interactionMode.activate();
    }

    /**
     * Deactivates the current mode and activates the mode named `name` (the default mode if omitted). Does nothing
     * if that mode is already current and active.
     */
    setCurrentInteractionMode(name?: string) {
        const activeMode = name ? name : BasicInteractionModes.default;
        if (activeMode === this._currentInteractionModeName && this.interactionMode?.active) {
            return;
        }
        this.interactionMode.deactivate();
        this._interactions.setActiveMode(activeMode);
        this._currentInteractionModeName = activeMode;
    }

    /**
     * Defines an interaction mode under `name`: `mode` if given, otherwise a new empty mode. Replaces (with a
     * warning) any mode already defined under that name. The mode is not activated.
     */
    defineInteractionMode(name: string, mode?: AInteractionMode) {
        this._interactions.defineMode(name, mode);
    }

    /** Deactivates and removes the mode named `name`. */
    clearInteractionMode(name: string) {
        this._interactions.undefineMode(name)
    }

    /** Removes every interaction mode and starts over with a fresh mode map (which has an empty default mode). */
    clearAllInteractionModes(){
        this._interactions.clearAllModes();
        this._interactions = new AInteractionModeMap(this);
    }

    /** Whether a mode named `name` is defined. */
    isInteractionModeDefined(name: string):boolean {
        return this._interactions.modeIsDefined(name);
    }


    /**
     * Calls `callback(progress)` on every tick of this controller's clock for `duration` seconds (clock time), with
     * `progress` going from 0 to 1 (reshaped by `tween`, if given). The last call is always with the final progress,
     * so the action ends exactly at its end state; then `actionOverCallback` runs. See
     * {@link AClock.addTimedActionTo}.
     *
     * If you provide a handle, the action will not start while a subscription with that handle already exists, so
     * you won't start a second copy before the first has finished. Call `this.unsubscribe(handle)` to cancel it.
     * Releasing the controller also stops it.
     * @param callback  what should be called at each update
     * @param duration  how long it will take in total
     * @param actionOverCallback  what to run when completed
     * @param tween  an optional tween curve
     * @param handle  a handle to identify the timed action
     * @returns the action's handle, or `undefined` if an action with `handle` is already running
     */
    addTimedAction(callback: (actionProgress: number) => any, duration: number, actionOverCallback?: CallbackType, tween?: BezierTween, handle?: string) {
        return this._clock.addTimedActionTo(this, callback, duration, actionOverCallback, tween, handle);
    }

    /** Disposes of the interaction modes (`dispose()`), then releases the controller. */
    release(...args: undefined[]) {
        this.dispose();
        super.release(...args);
    }

    /** Disposes of this controller's interaction modes. */
    dispose() {
        this._interactions.dispose();
    }
}
