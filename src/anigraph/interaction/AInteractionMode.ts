import {AInteraction} from "./AInteraction";
import {HasInteractions} from "../base/amvc/HasInteractions";
import {CallbackType} from "../basictypes";
import {AWheelInteractionCallback} from "./AWheelInteraction";
import {ADragInteractionCallback} from "./ADragInteraction";
import {AKeyboardInteraction, KeyDownStateMap} from "./DOM";

/** Minimal shape of an interaction mode. */
export interface AInteractionModeInterface{
    interactions:AInteraction;
}

/** Built-in interaction mode names. Every {@link AInteractionModeMap} starts with a `default` mode. */
export enum BasicInteractionModes{
    default='default'
}


/** Event names for pointer lock being acquired or released. */
export enum PointerLockEvents{
    Lock="PointerLock_Lock",
    Unlock="PointerLock_Unlock",
}

/**
 * Optional standard callbacks for mouse, keyboard, and mode lifecycle events. Scene interaction modes (e.g.
 * `ASceneInteractionMode`) create the matching interactions for whichever callbacks are defined.
 */
export interface HasInteractionModeCallbacks {
    onKeyDown?:CallbackType|undefined;
    onKeyUp?:CallbackType|undefined;
    onMouseMove?:CallbackType|undefined;
    onWheelMove?:AWheelInteractionCallback|undefined;
    onDragStart?:ADragInteractionCallback|undefined;
    onDragMove?:ADragInteractionCallback|undefined;
    onDragEnd?:ADragInteractionCallback|undefined;
    onClick?:CallbackType|undefined;
    onRightClick?:CallbackType|undefined;
    afterActivate?:CallbackType|undefined;
    afterDeactivate?:CallbackType|undefined;
    beforeActivate?:CallbackType|undefined;
    beforeDeactivate?:CallbackType|undefined;
    dispose?:CallbackType|undefined;
}

/**
 * Copies each callback defined in `interactionCallbacks` onto `owner` (callbacks that are missing or undefined
 * are left alone).
 * @param owner the object to receive the callbacks
 * @param interactionCallbacks the callbacks to copy
 * @param bind if true, each copied callback is bound so that `this` is `owner`
 */
export function SetInteractionCallbacks(owner:HasInteractionModeCallbacks, interactionCallbacks:HasInteractionModeCallbacks, bind:boolean){
    if ('onKeyDown' in interactionCallbacks && interactionCallbacks.onKeyDown) {
        owner.onKeyDown = interactionCallbacks.onKeyDown;
        if(bind) {
            owner.onKeyDown = owner.onKeyDown.bind(owner);
        }
    }
    if ('onKeyUp' in interactionCallbacks && interactionCallbacks.onKeyUp) {
        owner.onKeyUp = interactionCallbacks.onKeyUp;
        if(bind) {
            owner.onKeyUp = owner.onKeyUp.bind(owner);
        }
    }
    if ('onMouseMove' in interactionCallbacks && interactionCallbacks.onMouseMove) {
        owner.onMouseMove = interactionCallbacks.onMouseMove;
        if(bind) {
            owner.onMouseMove = owner.onMouseMove.bind(owner);
        }
    }
    if ('onWheelMove' in interactionCallbacks && interactionCallbacks.onWheelMove) {
        owner.onWheelMove = interactionCallbacks.onWheelMove;
        if(bind){
            owner.onWheelMove = owner.onWheelMove.bind(owner);
        }
    }
    if ('onDragStart' in interactionCallbacks && interactionCallbacks.onDragStart) {
        owner.onDragStart = interactionCallbacks.onDragStart;
        if(bind){
            owner.onDragStart = owner.onDragStart.bind(owner);
        }
    }
    if ('onDragMove' in interactionCallbacks && interactionCallbacks.onDragMove) {
        owner.onDragMove = interactionCallbacks.onDragMove;
        if(bind){
            owner.onDragMove = owner.onDragMove.bind(owner);
        }
    }
    if ('onDragEnd' in interactionCallbacks && interactionCallbacks.onDragEnd) {
        owner.onDragEnd = interactionCallbacks.onDragEnd;
        if(bind){
            owner.onDragEnd = owner.onDragEnd.bind(owner);
        }
    }

    if('onClick' in interactionCallbacks && interactionCallbacks.onClick){
        owner.onClick = interactionCallbacks.onClick;
        if(bind){
            owner.onClick = owner.onClick.bind(owner);
        }
    }

    if('onRightClick' in interactionCallbacks && interactionCallbacks.onRightClick){
        owner.onRightClick = interactionCallbacks.onRightClick;
        if(bind){
            owner.onRightClick = owner.onRightClick.bind(owner);
        }
    }


    if ('afterActivate' in interactionCallbacks && interactionCallbacks.afterActivate) {
        owner.afterActivate = interactionCallbacks.afterActivate;
        if(bind){
            owner.afterActivate = owner.afterActivate.bind(owner);
        }
    }
    if ('afterDeactivate' in interactionCallbacks && interactionCallbacks.afterDeactivate) {
        owner.afterDeactivate = interactionCallbacks.afterDeactivate;
        if(bind){
            owner.afterDeactivate = owner.afterDeactivate.bind(owner);
        }
    }

    if ('beforeActivate' in interactionCallbacks && interactionCallbacks.beforeActivate) {
        owner.beforeActivate = interactionCallbacks.beforeActivate;
        if(bind){
            owner.beforeActivate = owner.beforeActivate.bind(owner);
        }
    }

    if ('beforeDeactivate' in interactionCallbacks && interactionCallbacks.beforeDeactivate) {
        owner.beforeDeactivate = interactionCallbacks.beforeDeactivate;
        if(bind){
            owner.beforeDeactivate = owner.beforeDeactivate.bind(owner);
        }
    }

    if ('dispose' in interactionCallbacks && interactionCallbacks.dispose) {
        owner.dispose = interactionCallbacks.dispose;
        if(bind){
            owner.dispose = owner.dispose.bind(owner);
        }
    }

}

/**
 * A named set of interactions that are turned on and off together -- e.g. a "camera orbit" mode versus a
 * "select objects" mode. A controller keeps its modes in an {@link AInteractionModeMap} and activates one at a
 * time. Activating a mode activates all of its interactions; deactivating it deactivates them and clears
 * `modeState`.
 */
export class AInteractionMode{
    /** The mode's name (its key in the mode map). */
    public name!:string;
    public _owner!:HasInteractions;

    /** The controller (or other object) that owns this mode and its interactions. */
    get owner(){
        return this._owner;
    }


    protected interactions:AInteraction[]=[];

    /**
     * Optional callbacks run before/after activation and deactivation, for setup or teardown. They are called by
     * the public `beforeActivate`/`afterActivate`/... methods and can be set at run time with
     * `setBeforeActivateCallback` and friends.
     */
    protected _afterActivate!:(...args:any[])=>any;
    protected _afterDeactivate!:(...args:any[])=>any
    protected _beforeActivate!:(...args:any[])=>any;
    protected _beforeDeactivate!:(...args:any[])=>any

    /** A dictionary for arbitrary state associated with the mode. Cleared every time the mode is deactivated. */
    public modeState:{[name:string]:any}={};
    /** Sets `modeState[name]`. */
    setModeState(name:string, value:any){this.modeState[name]=value;}
    /** Returns `modeState[name]`. */
    getModeState(name:string){return this.modeState[name];}
    /** Empties `modeState`. */
    clearModeState(){this.modeState={};}

    /**
     * Lifecycle hooks called around `activate()`/`deactivate()`. By default each calls the matching callback
     * set with `setAfterActivateCallback` etc. (if any); subclasses can override them.
     */
    afterActivate(...args:any[]){if(this._afterActivate) {this._afterActivate(...args);}}
    afterDeactivate(...args:any[]){if(this._afterDeactivate) {this._afterDeactivate(...args);}}
    beforeActivate(...args:any[]){if(this._beforeActivate) {this._beforeActivate(...args);}}
    beforeDeactivate(...args:any[]){if(this._beforeDeactivate) {this._beforeDeactivate(...args);}}

    /** Binds the lifecycle hooks to this instance. Called by the constructor. */
    bindMethods(){
        this.afterActivate = this.afterActivate.bind(this);
        this.afterDeactivate = this.afterDeactivate.bind(this);
        this.beforeActivate = this.beforeActivate.bind(this);
        this.beforeDeactivate = this.beforeDeactivate.bind(this);
    }

    /** Whether the mode is currently active. */
    public active:boolean=false;

    /** Whether this mode should be offered as a choice in the control panel (see {@link AInteractionModeMap.getGUISelectableModesList}). */
    public isGUISelectable:boolean=true;

    /**
     * @param name the name of the mode
     * @param owner the controller that is using this mode
     */
    constructor(name?:string, owner?:HasInteractions, ...args:any[]){
        if(name) this.name = name;
        if(owner) this._owner = owner;
        this.bindMethods();
    }

    /** Returns the mode's keyboard interactions. */
    getKeyboardInteractions():AKeyboardInteraction[]{
        let keyboardInteractions:AKeyboardInteraction[]=[];
        for(let i of this.interactions){
            if(i instanceof AKeyboardInteraction){
                keyboardInteractions.push(i);
            }
        }
        return keyboardInteractions;
    }

    /**
     * Returns the key-down state of the mode's keyboard interaction (see {@link AKeyboardInteraction.keysDownState}),
     * or `{}` if it has none. If there are several keyboard interactions it warns and uses the first one, so use
     * just one per mode.
     */
    getKeyDownState():KeyDownStateMap{
        let keyboardInteractions = this.getKeyboardInteractions();
        if(keyboardInteractions.length===1){
            return keyboardInteractions[0].keysDownState;
        }else if(keyboardInteractions.length>1){
            console.warn("THERE WERE MULTIPLE KEYBOARD INTERACTIONS!")
            console.warn(keyboardInteractions);
            return keyboardInteractions[0].keysDownState;
        }else{
            return {};
        }
    }

    /**
     * Adds `interaction` to the mode, activating or deactivating it to match the mode, and sets its owner to the
     * mode's owner. Throws if the interaction already has an owner (an interaction belongs to one mode).
     */
    addInteraction(interaction:AInteraction){
        // if(this.active){
        //     throw new Error("Cannot add interactions to an active interaction mode!");
        // }
        // Check ownership first, so a rejected interaction is never registered or switched on/off.
        if(interaction.owner){
            throw new Error('interaction already has owner!');
        }
        this.interactions.push(interaction);
        if(this.active && !interaction.active){
            interaction.activate();
        }
        if(!this.active && interaction.active){
            interaction.deactivate();
        }
        interaction.owner = this.owner;
    }

    /** Deactivates the mode: runs `beforeDeactivate`, deactivates every interaction, clears `modeState`, then runs `afterDeactivate`. */
    deactivate(){
        this.beforeDeactivate();
        for (let interaction of this.interactions) {
            interaction.deactivate();
        }
        this.clearModeState();
        this.afterDeactivate();
        this.active=false;
    }

    /** Activates the mode: runs `beforeActivate`, activates every interaction, then runs `afterActivate`. */
    activate(){
        this.beforeActivate();
        for (let interaction of this.interactions) {
            interaction.activate();
        }
        this.afterActivate();
        this.active=true;
    }

    /** Sets the callback run after the mode is activated. */
    setAfterActivateCallback(callback:(...args:any[])=>any){
        this._afterActivate = callback;
    }

    /** Sets the callback run before the mode is activated. */
    setBeforeActivateCallback(callback:(...args:any[])=>any){
        this._beforeActivate = callback;
    }

    /** Sets the callback run after the mode is deactivated. */
    setAfterDeactivateCallback(callback:(...args:any[])=>any){
        this._afterDeactivate = callback;
    }

    /** Sets the callback run before the mode is deactivated. */
    setBeforeDeactivateCallback(callback:(...args:any[])=>any){
        this._beforeDeactivate = callback;
    }

    /**
     * Per-frame update hook; does nothing by default. Subclasses can override it for time-based behavior.
     * @param t the current time
     */
    timeUpdate(t:number, ...args:any[]){
    }
}


