import {AInteraction, AInteractionEvent, AInteractionEventListener,} from "../AInteraction";
import {CallbackType} from "../../basictypes";

/** Callback for key-down/key-up events. */
export type AKeyboardInteractionCallback = (event: any, interaction: AKeyboardInteraction) => any;

/** Maps `KeyboardEvent.key` values to whether that key is currently held down. */
export type KeyDownStateMap = { [name: string]: boolean };

/** An object with `onKeyDown`/`onKeyUp` handlers. */
export interface HasKeyboardInteraction{
    onKeyDown(event:AInteractionEvent, interaction:AKeyboardInteraction):void;
    onKeyUp(event:AInteractionEvent, interaction:AKeyboardInteraction):void;
}

/**
 * Listens for `keydown`/`keyup` events (usually on `document`), keeps track of which keys are held in
 * `keysDownState`, and calls the key-down/key-up callbacks.
 */
export class AKeyboardInteraction extends AInteraction {
    /** Called as `(event, interaction)` on each `keydown`, after `keysDownState` is updated. */
    public keyDownCallback!: AKeyboardInteractionCallback;
    /** Called as `(event, interaction)` on each `keyup`, after `keysDownState` is updated. */
    public keyUpCallback!: AKeyboardInteractionCallback;
    public _keyDownEventListener!: AInteractionEventListener | undefined;
    public _keyUpEventListener!: AInteractionEventListener | undefined;
    /**
     * Which keys are currently down, keyed by `KeyboardEvent.key` (e.g. `"a"`, `"A"`, `"ArrowUp"`, `" "`). Keys
     * are case-sensitive, so holding Shift changes the key name for letters.
     */
    public keysDownState: { [name: string]: boolean } = {};
    /**
     * Options passed to the DOM `addEventListener` (only `once` and `capture` are used). See
     * https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
     */
    public eventListenerOptions: { [name: string]: any } = {}

    /** Forgets all key-down state. */
    clearKeyState() {
        this.keysDownState = {};
    }

    /** Sets `eventListenerOptions` (ignored if `options` is undefined). Takes effect the next time the listeners are rebuilt. */
    setEventListenerOptions(options?: { [name: string]: any }) {
        if (options) {
            this.eventListenerOptions = options;
        }
    }

    /** Sets the key-down callback; rebuilds the listeners if the interaction is active. */
    setKeyDownCallback(keyDownCallback: CallbackType) {
        this.keyDownCallback = keyDownCallback;
        if (this.active) {
            this.updateListeners();
        }
    }

    /** Sets the key-up callback; rebuilds the listeners if the interaction is active. */
    setKeyUpCallback(keyUpCallback: CallbackType) {
        this.keyUpCallback = keyUpCallback;
        if (this.active) {
            this.updateListeners();
        }
    }

    _processKeyDownEvent(event: AInteractionEvent) {
        this.keysDownState[(event.DOMEvent as KeyboardEvent).key] = true;
    }

    _processKeyUpEvent(event: AInteractionEvent) {
        this.keysDownState[(event.DOMEvent as KeyboardEvent).key] = false;
    }

    /** Removes and re-creates the `keydown`/`keyup` listeners for whichever callbacks are set. */
    updateListeners() {
        this._removeKeyListeners();
        const interaction = this;

        function keyDownCallback(event: AInteractionEvent) {
            // event.preventDefault();
            interaction._processKeyDownEvent(event);
            interaction.keyDownCallback(event, interaction);
        }

        function keyUpCallback(event: AInteractionEvent) {
            // event.preventDefault();
            interaction._processKeyUpEvent(event);
            interaction.keyUpCallback(event, interaction);
        }

        // @ts-ignore
        if (interaction.keyDownCallback) {
            interaction._keyDownEventListener = interaction.addDOMEventListener('keydown', keyDownCallback, this.eventListenerOptions);
        }
        // @ts-ignore
        if (interaction.keyUpCallback) {
            interaction._keyUpEventListener = interaction.addDOMEventListener('keyup', keyUpCallback, this.eventListenerOptions);
        }
    }

    _removeKeyListeners() {
        this._keyDownEventListener = undefined;
        this._keyUpEventListener = undefined;
        this.clearEventListeners();
    }

    /** Rebuilds and attaches the key listeners. */
    activate() {
        this.updateListeners();
        this._keyDownEventListener?.addListener();
        this._keyUpEventListener?.addListener();
        this.active = true;
    }

    /**
     * Creates a keyboard interaction.
     * @param element what to listen on, usually `document` (e.g. `canvas.ownerDocument`) so keys work without focusing the canvas
     * @param keyDownCallback called as `(event, interaction)` on key down
     * @param keyUpCallback called as `(event, interaction)` on key up
     * @param options DOM listener options (`once`, `capture`)
     * @param handle optional name for the interaction
     */
    static Create(element: any, keyDownCallback?: CallbackType, keyUpCallback?: CallbackType, options?: { [name: string]: any }, handle?: string, ...args: any[]) {
        let host = element;
        // if(element.ownerDocument){
        //     host = element.ownerDocument;
        // }
        const interaction = new this(host, undefined, handle);
        interaction.setEventListenerOptions(options);
        if (keyDownCallback) {
            interaction.setKeyDownCallback(keyDownCallback);
        }
        if (keyUpCallback) {
            interaction.setKeyUpCallback(keyUpCallback);
        }

        interaction.bindMethods();
        //Finally, return the interaction
        return interaction;
    }
}
