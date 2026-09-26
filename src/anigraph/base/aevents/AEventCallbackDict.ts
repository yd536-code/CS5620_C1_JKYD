import { v4 as uuidv4 } from "uuid";
import { ACallbackSwitch } from "./ACallbackSwitch";

/**
 * The callback switch for a callback (or list of callbacks) registered in an {@link AEventCallbackDict}.
 * Activating it puts it in the owner dictionary; deactivating removes it.
 */
export class AEventCallbackSwitch extends ACallbackSwitch {
  public callback: ((...args: any[]) => any) | ((...args: any[]) => any)[];
  public owner: AEventCallbackDict;
  constructor(
    owner: AEventCallbackDict,
    handle: string,
    callback: ((...args: any[]) => any) | ((...args: any[]) => any)[]
  ) {
    super(handle);
    this.callback = callback;
    this.owner = owner;
  }
  activate() {
    const previous = this.owner.callbacks[this.handle];
    if (previous !== undefined && previous !== this) {
      // Another switch with the same handle is being replaced, so it is no longer registered.
      previous.active = false;
    }
    this.owner.callbacks[this.handle] = this;
    this.active = true;
  }
  deactivate() {
    // Only remove the dictionary entry if it is this switch. If the handle was reused by a newer callback,
    // deactivating this (already replaced) switch must not remove the newer one.
    if (this.owner.callbacks[this.handle] === this) {
      this.owner.removeCallback(this.handle);
    }
    this.active = false;
  }
}

/**
 * The callback switches of an {@link AEventCallbackDict}, keyed by handle.
 * @internal
 */
export type CallbacksDictType = { [handle: string]: AEventCallbackSwitch };

/**
 * The callbacks registered for one named event. `addCallback` returns a switch: `switch.deactivate()` removes the
 * callback from the dictionary entirely (no reference is left behind), and `switch.activate()` puts it back.
 * `signalEvent` calls every registered callback. {@link AHandlesEvents} keeps one of these per event name.
 */
export class AEventCallbackDict {
  /** The event's name. */
  public name: string;
  /** Registered callback switches, keyed by handle. */
  public callbacks: CallbacksDictType = {};
  /**
   * @param name the event's name
   * @param callbacks optional initial callbacks, keyed by handle
   */
  constructor(name?: string, callbacks?: CallbacksDictType) {
    this.name = name ? name : "";
    if (callbacks !== undefined) {
      this.callbacks = callbacks;
    }
  }

  /**
   * Adds the callback (or list of callbacks) and returns its switch, already active. Call `deactivate()`/
   * `activate()` on the switch to disable/enable the callback.
   * @param callback a callback, or a list of callbacks registered together
   * @param handle optional unique identifier; a new uuid is used if omitted. Reusing a handle replaces the
   * earlier callback.
   * @returns the {@link AEventCallbackSwitch}
   */
  addCallback(
    callback: ((...args: any[]) => void)[] | ((...args: any[]) => void),
    handle?: string
  ) {
    if (handle === undefined) {
            handle = (uuidv4() as string);
    }
    const callbackSwitch = new AEventCallbackSwitch(this, handle, callback);
    callbackSwitch.activate();
    // // this.callbacks[handle] = callback;
    // const event = this;
    // const callbackSwitch = {
    //     callback:callback,
    //     handle: handle,
    //     active: false,
    //     deactivate: function(){
    //         event.removeCallback((handle as string));
    //         this.active = false; // the this variable here will refer the callbackSwitch
    //     },
    //     owner:event,
    //     activate: function(){
    //         event.callbacks[(handle as string)] = this;
    //         this.active = true;
    //     },
    // }
    // callbackSwitch.activate();
    return callbackSwitch;
  }

  /** Removes the callback with the given handle and marks its switch inactive. Does nothing if there is none. */
  removeCallback(handle: string) {
    const callbackSwitch = this.callbacks[handle];
    if (callbackSwitch !== undefined) {
      callbackSwitch.active = false;
      delete this.callbacks[handle];
    }
  }

  /** Returns the registered callback switches as an array. */
  getCallbackList() {
    const callbacks = this.callbacks;
        return Object.keys(callbacks).map(function(k){return callbacks[k]});
  }

  /** Calls every registered callback with `args`. */
  signalEvent(...args: any[]) {
    const callbackList = this.getCallbackList();
    for (let c of callbackList) {
            if(Array.isArray(c['callback'])){
                for(let cb of c['callback']){
          cb.call(null, ...args);
        }
      } else {
        c["callback"].call(null, ...args);
      }
    }
  }
}
