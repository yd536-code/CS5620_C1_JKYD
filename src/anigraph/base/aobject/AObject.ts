import { proxy, ref, snapshot, subscribe } from "valtio/vanilla";
import { subscribeKey } from "valtio/utils";
import { v4 as uuidv4 } from "uuid";
import {
  ASerializable,
  GetASerializableFieldKeys,
  GetClassLabel,
  GetOwnDecoratorArray,
} from "../aserial";
import { ACallbackSwitch } from "../aevents";
import { GenericDict } from "../../basictypes";
import {AHandlesEvents} from "./AHandlesEvents";
import {AppStateValueChangeCallback} from "../../basictypes";
import {GetAAppState} from "../../appstate/AAppState";

/**
 * Restricts a whole-state listener to changes under some state keys, or to changes under every key except some.
 * A change counts as "under" a key when the first segment of its valtio op path is that key, so nested edits
 * (e.g. `_transform.position.x`) count as changes to `_transform`.
 */
export interface StateKeyFilter {
  /** The state keys the filter is about. */
  keys: string[];
  /** If true, fire only for changes under `keys`. If false, fire only for changes under any other key. */
  include: boolean;
}

/**
 * The switch returned by {@link AObject}'s state-listener methods. Its callback is called with the owner object
 * whenever the owner's state changes. With `state_name`, it only fires when that key is reassigned (valtio's
 * `subscribeKey`; nested edits don't count). With `keyFilter`, it fires for changes (nested ones included) under,
 * or not under, a set of keys. Otherwise it fires for any state change.
 */
export class AStateCallbackSwitch extends ACallbackSwitch {
  public callback: (...args: any[]) => any;
  public owner: AObject;
  public synchronous: boolean;
  public state_name: string | null;
  public keyFilter: StateKeyFilter | null;
  public _unsubscribe_proxy: any = null;
  constructor(
    owner: AObject,
    handle: string,
    callback: (...args: any[]) => any,
    synchronous: boolean = true,
    state_name: string | null = null,
    keyFilter: StateKeyFilter | null = null
  ) {
    super(handle);
    this.callback = callback;
    this.owner = owner;
    this.synchronous = synchronous;
    this.state_name = state_name;
    this.keyFilter = keyFilter;
  }

  /**
   * Whether a batch of valtio ops passes `keyFilter`: true if any op's first path segment is (or, for an exclude
   * filter, is not) one of the filter's keys. Always true without a filter.
   * @param ops The ops valtio passes to a `subscribe` callback: `[op, path, value, prevValue]` tuples.
   */
  _passesKeyFilter(ops: any[] | undefined): boolean {
    const filter = this.keyFilter;
    if (!filter) {
      return true;
    }
    if (!ops) {
      return true;
    }
    for (const op of ops) {
      const path = op[1] as (string | symbol)[] | undefined;
      const key = path && path.length > 0 ? String(path[0]) : undefined;
      const underKeys = key !== undefined && filter.keys.includes(key);
      if (underKeys === filter.include) {
        return true;
      }
    }
    return false;
  }

  activate() {
    if (this.active) {
      // Already subscribed; subscribing again would register the callback twice.
      return;
    }
    const listeners = this.owner._getListeners();
    const previous = listeners[this.handle];
    if (previous !== undefined && previous !== this) {
      // Reusing a handle replaces the listener that had it.
      previous.deactivate();
    }
    listeners[this.handle] = this;
    if (this.state_name) {
      this._unsubscribe_proxy = subscribeKey(
        this.owner.state,
        this.state_name,
        () => {
          return this.callback(this.owner);
        },
        this.synchronous
      );
    } else {
      this._unsubscribe_proxy = subscribe(
        this.owner.state,
        (ops: any[]) => {
          if (!this._passesKeyFilter(ops)) {
            return;
          }
          return this.callback(this.owner);
        },
        this.synchronous
      );
    }
    this.active = true;
  }
  deactivate() {
    // Only remove the owner's entry if it is this switch. It may already be gone (e.g. the owner was released),
    // or belong to a newer listener that reused the handle.
    if (this.owner._getListeners()[this.handle] === this) {
      this.owner.removeListener(this.handle);
    }
    this.active = false;
  }
}

/**
 * # AObjectState Decorator
 * The `@AObjectState` decorator declares a state variable on a class that extends {@link AObject}. State variables
 * are stored in the object's `state` (a [valtio proxy](https://github.com/pmndrs/valtio)) instead of on the object
 * itself, so other code can listen for changes to them with {@link AObject.addStateKeyListener},
 * {@link AObject.addStateKeysListener}, {@link AObject.addStateListener}, etc. For example, a view can listen to its
 * model's state and redraw whenever that state changes.
 *
 * ```typescript
 * class MyModel extends AObject {
 *   @AObjectState color!: Color;
 *   constructor() {
 *     super();
 *     this.color = Color.Random();
 *   }
 * }
 * ```
 *
 * ### Limitations:
 * - It can't be used on templated (generic) members.
 * - Inline initialization (`@AObjectState x: number = 1;`) doesn't work; initialize in the constructor and declare
 *   the field with `!`.
 * - Objects assigned to a state variable are deep-proxied by valtio, so edits nested inside them also count as
 *   state changes. Use {@link AObjectStateRef} to store an object without that.
 */
export function AObjectState(target: any, propertyKey: any) {
  // if (target.constructor.AObjectStateKeys.includes(propertyKey)) {
  //     throw new Error(`class ${target.constructor.name} already contains AObjectState with key ${propertyKey}`);
  // }
  GetOwnDecoratorArray(target.constructor, "AObjectStateKeys").push(
    propertyKey
  );
  Object.defineProperty(target, propertyKey, {
    get: function () {
      return this.state[propertyKey];
      // return valuesByInstance.get(this);
    },
    set: function (value) {
      this.state[propertyKey] = value;
      // valuesByInstance.set(this, value);
    },
  });
  return target;
}

/**
 * Like {@link AObjectState}, but each assigned value is wrapped in valtio's `ref()`, so it is stored as-is instead
 * of being deep-proxied. Listeners hear about reassigning the variable, but not about edits made inside the stored
 * object. Use it for large or complex objects (e.g. render objects or other class instances) that shouldn't be
 * tracked field by field.
 */
export function AObjectStateRef(target: any, propertyKey: any) {
  GetOwnDecoratorArray(target.constructor, "AObjectStateKeys").push(
    propertyKey
  );

  Object.defineProperty(target, propertyKey, {
    get: function () {
      return this.state[propertyKey];
      // return valuesByInstance.get(this);
    },
    set: function (value) {
      this.state[propertyKey] = ref(value);
      // valuesByInstance.set(this, value);
    },
  });
  return target;
}

/**
 * Base class for most AniGraph objects. An `AObject` has:
 * - a unique `uid` (a new uuid unless one is passed to the constructor),
 * - reactive `state` (the fields declared with {@link AObjectState}), which you can listen to with
 *   {@link AObject.addStateKeyListener}, {@link AObject.addStateKeysListener}, {@link AObject.addStateListener},
 *   and {@link AObject.addStateListenerExcept},
 * - named events and subscriptions, inherited from {@link AHandlesEvents},
 * - default serialization (`toJSON`/`fromJSON`).
 */
@ASerializable("AObject")
export class AObject extends AHandlesEvents{
  /** This class's own label (see `GetClassLabel`); never an ancestor's. */
  static SerializationLabel(): string {
    return GetClassLabel(this);
  }
  /** Names of the fields declared with `@AObjectState`/`@AObjectStateRef` on this class and its ancestors. */
  static AObjectStateKeys: string[] = [];
  /**
   * Version number of this class's saved format. {@link GetIndexedCopy} saves it as `_aserial_version`. When
   * loading, if the saved version is older than this and the class has a static `migrate(oldVersion, data)`,
   * {@link ASerializableFromJSON} calls `migrate` to update the data before passing it to `fromJSON`. A subclass
   * that changes the shape of its saved fields should declare its own higher value (`static AObjectVersion = 2;`).
   */
  static AObjectVersion: number = 1;
  /** The object's reactive state (a valtio proxy). `@AObjectState` fields are stored here. */
  public state: { [name: string]: any } = {};
  // public tempState:{[name:string]:any}={};
  private listeners: { [handle: string]: AStateCallbackSwitch } = {};
  /** Unique id for this object. */
  @AObjectState uid!: string;

  /** Arbitrary non-reactive extra info, read and written with `getInfo`/`setInfo`. Not saved by `toJSON`. */
  _aobjectInfo: GenericDict = {};
  /** Returns the extra info stored under `name` with `setInfo`. */
  getInfo(name: string) {
    return this._aobjectInfo[name];
  }
  /** Stores extra, non-reactive info under `name`. */
  setInfo(name: string, value: any) {
    this._aobjectInfo[name] = value;
  }

  /** This object's class (its constructor), typed as `typeof AObject` so its static members can be used. */
  get ClassConstructor() {
    return this.constructor as typeof AObject;
  }

  /** This instance's class's own label (see `GetClassLabel`); never an ancestor's. */
  get serializationLabel(): string {
    return GetClassLabel(this.constructor);
  }

  /** A frozen, non-reactive snapshot of `state`. */
  get stateSnapshot() {
    return snapshot(this.state);
  }

  /**
   * Misspelled old name of {@link AObject.stateSnapshot}.
   * @deprecated Use `stateSnapshot` instead.
   */
  get stateSnapshop() {
    return this.stateSnapshot;
  }

  // get useSnapshot(){
  //
  // }

  /**
   * @param uid optional uid to use (e.g. when restoring a saved object); a new uuid is generated if omitted.
   */
  constructor();
  constructor(uid:string);
  constructor(...args: Array<any>){
    super();
    this.state = proxy({});
    if(args.length>0){
      this.uid = args[0];
    }else{
      this.uid = uuidv4();
    }
  }

    /**
     * Releases this object: removes (and deactivates) all of its subscriptions, and removes every state listener
     * added to this object (their switches become inactive, so no state callbacks run after this). Subclasses
     * extend this to tear down more.
     */
    release(){
        this.clearSubscriptions();
        // Copy the list first: deactivating a listener deletes it from `listeners`.
        for (const listener of Object.values(this.listeners)) {
            listener.deactivate();
        }
        // if(Object.keys(this._eventCallbackDicts).length>0) {
        //     for (let k in this._eventCallbackDicts) {
        //         // console.log(this._eventCallbackDicts[k]);
        //         this._eventCallbackDicts[k]
        //     }
        //     // console.warn(`disposing object ${this} with the above event listeners still listening...`)
        // }
    };

  /**
   * Creates a new instance with `new this()` (no arguments), then assigns each entry of `state` as a property
   * (so `@AObjectState` keys go into `state`). Used by the default `fromJSON`.
   */
  static CreateWithState(state: { [name: string]: any }) {
    let newObj = new this();
    for (let key in state) {
      // @ts-ignore
      newObj[key] = state[key];
    }
    return newObj;
  }

  /**
   * Removes the state listener with the given handle and marks its switch inactive. Usually you call
   * `deactivate()` on the listener's switch instead, which calls this. Logs a warning and does nothing if no
   * listener has that handle.
   */
  removeListener(handle: string) {
    const listener = this.listeners[handle];
    if (listener === undefined) {
      console.warn(`removeListener: no state listener with handle "${handle}" on ${this}`);
      return;
    }
    listener._unsubscribe_proxy();
    listener._unsubscribe_proxy = null;
    listener.active = false;
    delete this.listeners[handle];
  }

  /** The active state listeners, keyed by handle. */
  _getListeners() {
    return this.listeners;
  }

  /**
   * Returns the data to save for this object: a snapshot of `state` (every `@AObjectState`/`@AObjectStateRef`
   * field) plus the current value of every {@link ASerializableField}-tagged field. With no tagged fields, the
   * result is valtio's frozen snapshot; otherwise it is a shallow copy of it. Tagged field values are not copied,
   * so {@link GetIndexedCopy} can still recognize serializable class instances inside them.
   */
  toJSON() {
    const fieldKeys = GetASerializableFieldKeys(this);
    if (fieldKeys.length === 0) {
      return snapshot(this.state);
    }
    const result: { [name: string]: any } = { ...snapshot(this.state) };
    for (const key of fieldKeys) {
      result[key] = (this as any)[key];
    }
    return result;
  }

  /** Rebuilds an instance from data saved by `toJSON` (see `CreateWithState`). */
  static fromJSON(state_dict: { [name: string]: any }) {
    return this.CreateWithState(state_dict);
  }

  // ASerialize(ref_map?:{[id:string]:ASerializableClass}){
  //     var rstate:{[name:string]:any} = {};
  //     for (let key in this.state){
  //         rstate[key]=GetIndexedCopy(this.state[key], ref_map);
  //     }
  // }

  /**
   * Adds a callback that runs whenever the state key `state_key` is reassigned. Edits nested inside the key's
   * value (e.g. `_transform.position.x = 1` for `_transform`) do **not** count; use
   * {@link AObject.addStateKeysListener} for those.
   *
   * The returned callback switch is already active. Call `deactivate()` on it to stop listening (and `activate()`
   * to resume).
   * Example Usage:
   * ```typescript
   * const callbackSwitch = model.addStateKeyListener('name', ()=>{
   *      nNameChanges = nNameChanges+1;
   * });
   * ```
   * @param state_key - the name of the state to listen to
   * @param callback - called with this object when the state changes
   * @param handle - optional unique identifier for the listener; a new one is generated if omitted
   * @param synchronous - whether callbacks run synchronously (true) or are batched by valtio
   * @returns the callback switch
   */
  addStateKeyListener(
    state_key: string,
    callback: (self: AObject) => void,
    handle?: string,
    synchronous: boolean = true
  ) {
    var h: string = handle ? handle : (uuidv4() as string);
    const object = this;
    const callbackSwitch = new AStateCallbackSwitch(
      object,
      h,
      callback,
      synchronous,
      state_key
    );
    callbackSwitch.activate();
    return callbackSwitch;
  }

  /**
   * Adds a callback that runs whenever *any* of the object's state changes, including nested edits. To listen to
   * only some keys, use {@link AObject.addStateKeysListener} or {@link AObject.addStateKeyListener}.
   * @param callback Called with this object.
   * @param handle Optional identifier for the callback; a unique one is generated if omitted.
   * @param synchronous Whether callbacks run synchronously (true) or are batched by valtio.
   * @returns The (already active) callback switch.
   */
  addStateListener(
    callback: (self: AObject) => void,
    handle?: string,
    synchronous: boolean = true
  ) {
    var h: string = handle ? handle : (uuidv4() as string);
    const object = this;
    const callbackSwitch = new AStateCallbackSwitch(
      object,
      h,
      callback,
      synchronous
    );
    callbackSwitch.activate();
    return callbackSwitch;
  }

  /**
   * Adds a callback that runs whenever state under any of `state_keys` changes, including nested edits (e.g.
   * `_transform.position.x` counts as a change to `_transform`). Compare `addStateKeyListener`, which only fires when
   * the key itself is reassigned.
   * @param state_keys The state keys to listen to.
   * @param callback Called with this object.
   * @param handle Optional identifier for the callback; a unique one is generated if omitted.
   * @param synchronous Whether callbacks run synchronously (true) or are batched by valtio.
   * @returns The callback switch.
   */
  addStateKeysListener(
    state_keys: string[],
    callback: (self: AObject) => void,
    handle?: string,
    synchronous: boolean = true
  ) {
    var h: string = handle ? handle : (uuidv4() as string);
    const callbackSwitch = new AStateCallbackSwitch(
      this,
      h,
      callback,
      synchronous,
      null,
      {keys: [...state_keys], include: true}
    );
    callbackSwitch.activate();
    return callbackSwitch;
  }

  /**
   * Adds a callback that runs whenever any state changes *except* state under `excluded_keys` (nested edits
   * included). A batch of changes that touches both excluded and other keys still fires.
   * @param excluded_keys The state keys to ignore.
   * @param callback Called with this object.
   * @param handle Optional identifier for the callback; a unique one is generated if omitted.
   * @param synchronous Whether callbacks run synchronously (true) or are batched by valtio.
   * @returns The callback switch.
   */
  addStateListenerExcept(
    excluded_keys: string[],
    callback: (self: AObject) => void,
    handle?: string,
    synchronous: boolean = true
  ) {
    var h: string = handle ? handle : (uuidv4() as string);
    const callbackSwitch = new AStateCallbackSwitch(
      this,
      h,
      callback,
      synchronous,
      null,
      {keys: [...excluded_keys], include: false}
    );
    callbackSwitch.activate();
    return callbackSwitch;
  }

  /**
   * Calls `callback(value)` whenever the app state value `key` changes (see `AAppState.addStateValueListener`).
   * The listener is stored as a subscription on this object, so it is removed when this object is released.
   * @param key the app state value to watch (e.g. the name of a control panel control)
   * @param callback called with the new value
   * @param subscriptionKey optional name for the subscription (so you can `unsubscribe` it later)
   */
  subscribeToAppState(key:string, callback:AppStateValueChangeCallback, subscriptionKey?:string) {
    let appState = GetAAppState();
    this.subscribe(
        appState.addStateValueListener(key, callback), subscriptionKey
    )
  }

  //##################//--ASignalsEvents--\\##################
  //<editor-fold desc="ASignalsEvents">
  // protected _eventCallbackDicts: { [name: string]: AEventCallbackDict } = {};
  //
  // _getEventCallbackDict(eventName: string) {
  //   return this._eventCallbackDicts[eventName];
  // }
  //
  // addEventListener(
  //   eventName: string,
  //   callback: (...args: any[]) => void,
  //   handle?: string
  // ) {
  //   if (this._eventCallbackDicts[eventName] === undefined) {
  //     this._eventCallbackDicts[eventName] = new AEventCallbackDict(eventName);
  //   }
  //   return this._eventCallbackDicts[eventName].addCallback(callback, handle);
  // }
  //
  // addEventListeners(
  //   eventName: string,
  //   callbacks: ((...args: any[]) => void)[],
  //   handle?: string
  // ) {
  //   if (this._eventCallbackDicts[eventName] === undefined) {
  //     this._eventCallbackDicts[eventName] = new AEventCallbackDict(eventName);
  //   }
  //   return this._eventCallbackDicts[eventName].addCallback(callbacks, handle);
  // }
  //
  // addOneTimeEventListener(
  //   eventName: string,
  //   callback: (...args: any[]) => void,
  //   handle?: string
  // ) {
  //   if (this._eventCallbackDicts[eventName] === undefined) {
  //     this._eventCallbackDicts[eventName] = new AEventCallbackDict(eventName);
  //   }
  //   const self = this;
  //   handle = handle ? handle : (uuidv4() as string);
  //   function wrapped(...args: []) {
  //     callback(...args);
  //     self.removeEventListener(eventName, handle as string);
  //   }
  //   return this._eventCallbackDicts[eventName].addCallback(wrapped, handle);
  // }
  //
  // removeEventListener(eventName: string, handle: string) {
  //   if (this._eventCallbackDicts[eventName] === undefined) {
  //     return;
  //   }
  //   return this._eventCallbackDicts[eventName].removeCallback(handle);
  // }
  //
  // signalEvent(eventName: string, ...args: any[]) {
  //   if (this._eventCallbackDicts[eventName] === undefined) {
  //     this._eventCallbackDicts[eventName] = new AEventCallbackDict(eventName);
  //   }
  //   this._getEventCallbackDict(eventName).signalEvent(...args);
  // }
  // //</editor-fold>
  // //##################\\--ASignalsEvents--//##################
  //
  // //##################//--ASubscribesToEvents--\\##################
  // //<editor-fold desc="ASubscribesToEvents">
  // protected _subscriptions: { [name: string]: ACallbackSwitch } = {};
  // public subscribe(callbackSwitch: ACallbackSwitch, name?: string) {
  //   name = name ? name : uuidv4();
  //   if (name in this._subscriptions) {
  //     if (this._subscriptions[name].active) {
  //       this._subscriptions[name].deactivate();
  //       console.warn(
  //         `Re-Subscribing to "${name}", which already has a subscription!`
  //       );
  //     }
  //   }
  //   this._subscriptions[name] = callbackSwitch;
  // }
  //
  // public unsubscribe(name: string, errorIfAbsent: boolean = true) {
  //   if (name in this._subscriptions) {
  //     if (this._subscriptions[name].active) {
  //       this._subscriptions[name].deactivate();
  //     }
  //     delete this._subscriptions[name];
  //   } else if (errorIfAbsent) {
  //     // select both, drag on one, and release with shift then click again
  //     throw new Error(
  //       `tried to remove subscription "${name}", but no such subscription found in ${this}`
  //     );
  //   }
  // }
  //
  // clearSubscriptions() {
  //   for (let name in this._subscriptions) {
  //     this.unsubscribe(name);
  //   }
  // }
  //
  // deactivateSubscription(name: string) {
  //   if (name in this._subscriptions) {
  //     if (this._subscriptions[name].active) {
  //       this._subscriptions[name].deactivate();
  //     }
  //   } else {
  //     throw new Error(
  //       `tried to deactivate subscription "${name}", but no such subscription found in ${this}`
  //     );
  //   }
  // }
  //
  // activateSubscription(name: string) {
  //   if (name in this._subscriptions) {
  //     if (!this._subscriptions[name].active) {
  //       this._subscriptions[name].activate();
  //     }
  //   } else {
  //     throw new Error(
  //       `tried to activate subscription "${name}", but no such subscription found in ${this}`
  //     );
  //   }
  // }
  //</editor-fold>
  //##################\\--ASubscribesToEvents--//##################
}
