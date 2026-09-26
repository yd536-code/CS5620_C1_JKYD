import {
    ADragInteraction,
    AKeyboardInteraction,
    SetInteractionCallbacks,
    AInteractionEvent,
    AInteractionMode,
    ADOMPointerMoveInteraction, AClickInteraction
} from "../../interaction";
import {ACamera} from "../../math";
import {ACameraModel3D} from "../../scene/camera";
import {ALabel} from "../../base";
import {Vec2, V2} from "../../math";
import {AWheelInteraction, AWheelInteractionCallback} from "../../interaction/AWheelInteraction";
import {ASceneController} from "../../scene/ASceneController";
import type {HasInteractionModeCallbacks} from "../../interaction";
import {ASceneInteractionMode} from "../../scene/interactionmodes/ASceneInteractionMode";
import {CallbackType} from "../../basictypes";

/** Events the owning controller signals when the pointer is locked or unlocked. */
export enum PointerLockEvents{
    Lock="PointerLock_Lock",
    Unlock="PointerLock_Unlock",
}

/**
 * Base for first-person style "player controls" that use the browser's Pointer Lock API: clicking the canvas locks
 * the pointer (hides the cursor and reports relative mouse motion), and the owning controller signals
 * `PointerLockEvents.Lock`/`Unlock` as the lock changes. Subclass it and override `onMouseMove` (for mouse look),
 * `onKeyDown`, and `onKeyUp`. The default `onMouseMove` reads the mouse movement while locked but does nothing
 * with it.
 */
@ALabel("AScenePointerLockInteractionMode")
export class AScenePointerLockInteractionMode extends ASceneInteractionMode implements HasInteractionModeCallbacks {
    /** True while this mode's element holds the pointer lock. */
    isLocked: boolean=false;
    static LockEvents=PointerLockEvents;
    _onLock!:CallbackType;
    _onUnlock!:CallbackType;
    /** Runs the optional `_onLock` callback. Called by `lockPointer()`. */
    onLock(...args:any[]){if(this._onLock){this._onLock(...args);}}
    /** Runs the optional `_onUnlock` callback. Called by `unlockPointer()` and when the mode is deactivated. */
    onUnlock(...args:any[]){if(this._onUnlock){this._onUnlock(...args);}}


    init(owner: ASceneController, ...args: any[]){
        super.init(owner, ...args);
        this._initPointerLock();
        this.onPointerlockChange = this.onPointerlockChange.bind(this);
        this.onPointerlockError = this.onPointerlockError.bind(this);
    }

    /** Adds a click interaction that requests the pointer lock. */
    _initPointerLock(){
        const self = this;
        this.addInteraction(AClickInteraction.Create(this.domElement, ()=>{
            self.lockPointer();
        }))
    }

    /** Starts listening for pointer-lock changes when the mode becomes active. */
    beforeActivate(...args:any[]) {
        this.connect();
    }
    /** Calls `onUnlock()` and stops listening for pointer-lock changes when the mode is deactivated. */
    beforeDeactivate(...args:any[]) {
        this.onUnlock();
        this.disconnect();
    }

    /** Adds the document's `pointerlockchange`/`pointerlockerror` listeners. */
    connect(){
        const self = this;
        // self.domElement.ownerDocument.addEventListener( 'mousemove', self.onMouseMove );
        self.domElement.ownerDocument.addEventListener( 'pointerlockchange', self.onPointerlockChange );
        self.domElement.ownerDocument.addEventListener( 'pointerlockerror', self.onPointerlockError );
    }

    /** Removes the listeners added by `connect()`. */
    disconnect(){
        const self = this;
        // self.domElement.ownerDocument.removeEventListener( 'mousemove', self.onMouseMove );
        self.domElement.ownerDocument.removeEventListener( 'pointerlockchange', self.onPointerlockChange );
        self.domElement.ownerDocument.removeEventListener( 'pointerlockerror', self.onPointerlockError );

    }
    /** Requests the pointer lock for this mode's element and calls `onLock()`. */
    lockPointer(){
        this.domElement.requestPointerLock();
        this.onLock();
    }

    /** Releases the pointer lock and calls `onUnlock()`. */
    unlockPointer(){
        this.domElement.ownerDocument.exitPointerLock();
        this.onUnlock();
    }

    dispose(){
        this.disconnect();
    };


    /** Updates `isLocked` and signals `PointerLockEvents.Lock` or `Unlock` on the owner. */
    onPointerlockChange() {
        const self = this;
        if ( self.domElement.ownerDocument.pointerLockElement === self.domElement ) {
            self.owner.signalEvent(AScenePointerLockInteractionMode.LockEvents.Lock);
            self.isLocked = true;
        } else {
            self.owner.signalEvent(AScenePointerLockInteractionMode.LockEvents.Unlock);
            self.isLocked = false;
        }
    }

    onPointerlockError(){
        console.error( 'Unable to use Pointer Lock API' );
    }

    onMouseMove(event:AInteractionEvent, interaction:ADOMPointerMoveInteraction ) {
        // console.log(event);
        if ( this.isLocked === false ) return;

        let webEvent = (event.DOMEvent as MouseEvent);
        // @ts-ignore
        const movementX = webEvent.movementX || webEvent.mozMovementX || webEvent.webkitMovementX || 0;
        // @ts-ignore
        const movementY = webEvent.movementY || webEvent.mozMovementY || webEvent.webkitMovementY || 0;
    }
}




