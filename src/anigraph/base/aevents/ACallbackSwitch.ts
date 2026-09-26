import { v4 as uuidv4 } from "uuid";

/**
 * A handle to a registered callback (an event listener or state listener) that lets you turn it off
 * (`deactivate()`) and back on (`activate()`). Listener methods like `addEventListener` and `addStateKeyListener`
 * return one, already active. Objects usually keep these as subscriptions (see `AHandlesEvents.subscribe`).
 */
export abstract class ACallbackSwitch {
  // public callback:(...args:any[])=>any;
  /** Unique identifier of the callback. */
  public handle: string;
  /** Storage for `active`. */
  protected _active: boolean = false;
  /**
   * Whether the callback is currently registered. It becomes false however the callback is removed: through
   * `deactivate()`, or by the object the callback is registered on (for example `removeEventListener`, a one-time
   * listener firing, or the object being released).
   */
  get active(): boolean {
    return this._active;
  }
  set active(value: boolean) {
    this._active = value;
  }
  /** Registers the callback. */
  abstract activate(): void;
  /** Unregisters the callback. */
  abstract deactivate(): void;

  /**
   * @param handle unique identifier; a new uuid is generated if omitted. The switch starts inactive.
   */
  constructor(handle?: string) {
    if (handle === undefined) {
      handle = uuidv4() as string;
    }
    this.handle = handle;
    this.active = false;
  }
}

/**
 * Groups several callback switches into one: `activate()`/`deactivate()` apply to all of them. The group is
 * `active` while at least one of its switches is active.
 */
export class AGroupCallbackSwitch extends ACallbackSwitch {
  public switches:ACallbackSwitch[] = [];

  /** True if any switch in the group is active (the logical OR of their `active` flags). */
  get active(): boolean {
    // The base constructor reads/writes `active` before `switches` is assigned, so guard against undefined.
    return (this.switches ?? []).some((s) => s.active);
  }
  /** Ignored: a group's `active` is always computed from its switches. Use `activate()`/`deactivate()`. */
  set active(_value: boolean) {}

  activate(){
    for(let s in this.switches){
      this.switches[s].activate();
    }
  }
  deactivate() {
    for(let s in this.switches){
      this.switches[s].deactivate();
    }
  }

  constructor(switches:ACallbackSwitch[], handle?:string) {
    super(handle);
    this.switches=switches;
  }
}
