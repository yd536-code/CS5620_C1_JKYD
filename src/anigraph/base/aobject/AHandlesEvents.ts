import {ACallbackSwitch, AEventCallbackDict} from "../aevents";
import {v4 as uuidv4} from "uuid";

/**
 * Base class that gives an object two things:
 * - **Events:** named events that other code can listen to (`addEventListener`) and that the object fires with
 *   `signalEvent`.
 * - **Subscriptions:** a named collection of callback switches this object holds on to (`subscribe`), typically
 *   listeners it has added to *other* objects. They can be turned off and on by name, and are all removed by
 *   `clearSubscriptions` (which {@link AObject.release} calls).
 */
export class AHandlesEvents {
    protected _eventCallbackDicts: { [name: string]: AEventCallbackDict } = {};

    /** Returns the callback dictionary for `eventName`, or `undefined` if nothing has used that event yet. */
    _getEventCallbackDict(eventName: string) {
        return this._eventCallbackDicts[eventName];
    }

    /**
     * Adds a callback for the event `eventName`. It is called with whatever arguments are passed to `signalEvent`.
     * @param eventName the event to listen to
     * @param callback called each time the event is signaled
     * @param handle optional unique identifier; a new one is generated if omitted. Reusing a handle replaces the
     * earlier callback.
     * @returns an already-active callback switch; call `deactivate()` on it to remove the callback
     */
    addEventListener(eventName: string, callback: (...args: any[]) => void, handle?: string) {
        if (this._eventCallbackDicts[eventName] === undefined) {
            this._eventCallbackDicts[eventName] = new AEventCallbackDict(eventName);
        }
        return this._eventCallbackDicts[eventName].addCallback(callback, handle);
    }

    /** Like `addEventListener`, but adds a list of callbacks under one handle (and one switch). */
    addEventListeners(eventName: string, callbacks: ((...args: any[]) => void)[], handle?: string) {
        if (this._eventCallbackDicts[eventName] === undefined) {
            this._eventCallbackDicts[eventName] = new AEventCallbackDict(eventName);
        }
        return this._eventCallbackDicts[eventName].addCallback(callbacks, handle);
    }

    /** Like `addEventListener`, but the callback removes itself after it runs once. */
    addOneTimeEventListener(eventName: string, callback: (...args: any[]) => void, handle?: string) {
        if (this._eventCallbackDicts[eventName] === undefined) {
            this._eventCallbackDicts[eventName] = new AEventCallbackDict(eventName);
        }
        const self = this;
        handle = handle ? handle : (uuidv4() as string);

        function wrapped(...args: []) {
            callback(...args);
            self.removeEventListener(eventName, handle as string);
        }

        return this._eventCallbackDicts[eventName].addCallback(wrapped, handle);
    }

    /**
     * Removes the callback with the given handle from the event, and marks its switch inactive (so it can be
     * turned back on with `activate()`). Does nothing if there is no such callback.
     */
    removeEventListener(eventName: string, handle: string) {
        if (this._eventCallbackDicts[eventName] === undefined) {
            return;
        }
        return this._eventCallbackDicts[eventName].removeCallback(handle);
    }

    /** Fires the event `eventName`, calling each of its callbacks with `args`. */
    signalEvent(eventName: string, ...args: any[]) {
        if (this._eventCallbackDicts[eventName] === undefined) {
            this._eventCallbackDicts[eventName] = new AEventCallbackDict(eventName);
        }
        this._getEventCallbackDict(eventName).signalEvent(...args);
    }

    //</editor-fold>
    //##################\\--ASignalsEvents--//##################

    //##################//--ASubscribesToEvents--\\##################
    //<editor-fold desc="ASubscribesToEvents">
    protected _subscriptions: { [name: string]: ACallbackSwitch } = {};

    /**
     * Stores `callbackSwitch` as a subscription of this object under `name`, so it can be deactivated,
     * reactivated, or removed by name, and is removed when this object is released. If an active subscription
     * already has that name, it is deactivated and replaced (with a console warning).
     * @param callbackSwitch the switch to hold, e.g. one returned by another object's `addEventListener` or
     * `addStateKeyListener`
     * @param name optional name; a new uuid is used if omitted
     */
    public subscribe(callbackSwitch: ACallbackSwitch, name?: string) {
        name = name ? name : uuidv4();
        if (name in this._subscriptions) {
            if (this._subscriptions[name].active) {
                this._subscriptions[name].deactivate();
                console.warn(`Re-Subscribing to "${name}", which already has a subscription!`);
            }
        }
        this._subscriptions[name] = callbackSwitch;
    }

    /** Whether this object holds a subscription named `name` (active or not). */
    public hasSubscription(name:string){
        return name in this._subscriptions;
    }

    /**
     * Deactivates and removes the subscription named `name`.
     * @param name the subscription's name
     * @param errorIfAbsent if true (the default), throws when there is no such subscription
     */
    public unsubscribe(name: string, errorIfAbsent: boolean = true) {
        if (name in this._subscriptions) {
            if (this._subscriptions[name].active) {
                this._subscriptions[name].deactivate();
            }
            delete this._subscriptions[name];
        } else if (errorIfAbsent) {
            // select both, drag on one, and release with shift then click again
            throw new Error(`tried to remove subscription "${name}", but no such subscription found in ${this}`);
        }
    }

    /** Deactivates and removes all of this object's subscriptions. */
    clearSubscriptions() {
        for (let name in this._subscriptions) {
            this.unsubscribe(name);
        }
    }

    /** Deactivates the subscription named `name` but keeps it, so it can be reactivated. Throws if there is none. */
    deactivateSubscription(name: string) {
        if (name in this._subscriptions) {
            if (this._subscriptions[name].active) {
                this._subscriptions[name].deactivate();
            }
        } else {
            throw new Error(`tried to deactivate subscription "${name}", but no such subscription found in ${this}`);
        }
    }

    /** Reactivates the subscription named `name`. Throws if there is none. */
    activateSubscription(name: string) {
        if (name in this._subscriptions) {
            if (!this._subscriptions[name].active) {
                this._subscriptions[name].activate();
            }
        } else {
            throw new Error(`tried to activate subscription "${name}", but no such subscription found in ${this}`);
        }
    }

    //</editor-fold>
    //##################\\--ASubscribesToEvents--//##################

}
