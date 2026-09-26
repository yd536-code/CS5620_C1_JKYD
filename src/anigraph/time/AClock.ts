import {AObject} from "../base/aobject/AObject";
import {AObjectState} from "../base/aobject/AObject";
import {ALabel} from "../base/aserial/ASerializable";
import {CallbackType} from "../basictypes";

import {BezierTween} from "../geometry/BezierTween";
import {v4 as uuidv4} from "uuid";
import type {ACallbackSwitch} from "../base/aevents/ACallbackSwitch";
// import {ADragInteraction} from "../ainteraction";
import { _ASystemTime } from "./ASystemTime";

/**
 * Something that can hold named subscriptions, such as any `AObject`. `AClock.addTimedActionTo` stores a timed
 * action's subscription on one of these.
 */
export interface HoldsSubscriptions {
  subscribe(callbackSwitch: ACallbackSwitch, name?: string): void;
  unsubscribe(name: string, errorIfAbsent?: boolean): void;
  hasSubscription(name: string): boolean;
}

/** Constants used by {@link AClock}. */
export enum AClockEnums {
  /** Milliseconds of real time per unit of clock time at rate 1 (so clock time is in seconds). */
  DEFAULT_PERIOD_IN_MILLISECONDS = 1000,
  /** Name of the clock's subscription to system time. */
  TIME_UPDATE_SUBSCRIPTION_HANDLE = "TimeUpdate",
}

/**
 * A clock that can be paused, played, and sped up or slowed down. Its `time` is in seconds at the default rate,
 * starts at 0, and only advances while playing. A new clock starts paused; call `play()`. All clocks are driven by
 * the shared {@link AClock.SystemTime}. `time` is reactive state, so you can listen to it
 * (`addTimeListener`), and `CreateTimedAction`/`addTimedActionTo` run animations on it.
 */
@ALabel("AClock")
export class AClock extends AObject {
  /** The shared system timer that updates every clock. */
  static SystemTime: _ASystemTime = new _ASystemTime();

  /**
   * The clock's time (seconds at the default rate) as of the last system-time tick. It is reactive state, so time
   * listeners fire when it changes. Between ticks it lags real time by up to one tick
   * ({@link _ASystemTime.TickIntervalMS}); for per-frame animation, read {@link AClock.currentTime} instead.
   */
  @AObjectState time!: number;

  /**
   * The clock's time right now, computed from the system clock when you read it, rather than the value stored at
   * the last system-time tick (`time`). While paused, it is the time at which the clock paused.
   *
   * Use this once per frame for animation: the starter controllers pass it to `model.timeUpdate`. Because the ticks
   * and the frames run on different schedules, `time` would sometimes not move between two frames and then jump by
   * two ticks, which makes smooth motion stutter.
   */
  get currentTime(): number {
    return this._paused ? this._offset : this._clockTimeAt(this._getNow());
  }

  //Whether the clock is paused
  protected _paused: boolean = true;

  // While playing, the clock's time is `_offset + (now - _refStart) / _periodInMilliseconds`.
  // `_refStart` is the system time (ms) when the current stretch of running at the current rate began: it is set
  // when the clock starts playing and whenever the rate changes while playing.
  protected _refStart: number = 0;

  // The time when the clock was last paused or unpaused
  protected _lastPauseStateChange: number = 0;

  // The time of the last update
  protected _lastUpdate: number = 0;

  // The current clock's value at the last update
  protected _lastClockTimeUpdated: number = 0;

  // Offset is the clock time "committed" before `_refStart`. Each time the clock pauses or its rate changes, the
  // time that has passed so far is added into `_offset`, because earlier milliseconds may have passed at a
  // different rate than the current one.
  protected _offset: number = 0;

  // This defines the current rate of the clock in terms of a period.
  // It can be changed over time to make the clock progress slower or faster.
  protected _periodInMilliseconds: number =
    AClockEnums.DEFAULT_PERIOD_IN_MILLISECONDS;

  /**
   * Whether the clock is paused. Setting it to `true` is the same as calling `pause()`, and setting it to `false`
   * is the same as calling `play()`.
   */
  set paused(value: boolean) {
    if (value) {
      this.pause();
    } else {
      this.play();
    }
  }
  get paused() {
    return this._paused;
  }

  /** The clock's time at its last update. */
  get lastTimeUpdated() {
    return this._lastClockTimeUpdated;
  }

  /**
   * How fast the clock runs relative to real time (1 = normal speed, 2 = twice as fast, 0 = frozen). Changing it
   * keeps the current `time` and applies the new rate from now on. If the clock is paused, the new rate is used
   * once it plays again, and `time` does not jump.
   */
  get rate() {
    return (
      AClockEnums.DEFAULT_PERIOD_IN_MILLISECONDS / this._periodInMilliseconds
    );
  }
  set rate(v: number) {
    if (!this._paused) {
      // Commit the time that passed at the old rate, then start measuring again from now at the new rate.
      const now = this._getNow();
      this._offset = this._clockTimeAt(now);
      this._refStart = now;
    }
    // While paused, `_offset` already holds the time at the moment the clock paused (see `pause()`), so only the
    // rate needs to change. `play()` starts measuring from the moment it is called.
    this._periodInMilliseconds = AClockEnums.DEFAULT_PERIOD_IN_MILLISECONDS / v;
  }

  /**
   * The clock time at system time `t` (milliseconds), assuming the clock has been playing at its current rate
   * since `_refStart`. Only meaningful while the clock is playing.
   */
  protected _clockTimeAt(t: number) {
    return this._offset + (t - this._refStart) / this._periodInMilliseconds;
  }

  /**
   * Adds a listener called with the clock's time whenever it changes. The listener is not synchronous: valtio
   * batches the calls, so it may run once for several updates.
   * @param callback called with the new time
   * @param handle optional identifier for the listener
   * @returns the listener's callback switch
   */
  addTimeListener(callback: (t: number) => any, handle?: string) {
    const self = this;
    return this.addStateKeyListener(
      "time",
      () => {
        callback(self.time);
      },
      handle,
      false
    );
  }

  constructor() {
    super();
    this.reset(0);
    this.initClockSubscription();
  }

  /** Subscribes this clock to {@link AClock.SystemTime}, so it updates on each system-time tick. */
  initClockSubscription() {
    const self = this;
    this.subscribe(
      AClock.SystemTime.addListener((t) => {
        self.update(t);
      }),
      AClockEnums.TIME_UPDATE_SUBSCRIPTION_HANDLE
    );
  }

  /**
   * Sets the time to `t0`, resets the rate to 1, and pauses the clock (without deactivating its system-time
   * subscription). After `play()`, time counts up from `t0`.
   */
  reset(t0: number = 0) {
    // Note: the constructor calls this before the system-time subscription exists, so it must not call `pause()`.
    const now = this._getNow();
    this.time = t0;
    this._offset = t0;
    this._refStart = now;
    this._lastPauseStateChange = now;
    this._lastUpdate = now;
    this._lastClockTimeUpdated = t0;
    this._periodInMilliseconds = AClockEnums.DEFAULT_PERIOD_IN_MILLISECONDS;
    this._paused = true;
  }

  /**
   * Updates `time` from the system time `t` (in milliseconds, from `Date.now()`). Does nothing while paused.
   */
  update(t: number) {
    if (this._paused) {
      return;
    }
    this.time = this._clockTimeAt(t);
    this._lastUpdate = t;
    this._lastClockTimeUpdated = this.time;
  }

  /** The current system time in milliseconds. */
  _getNow() {
    return Date.now();
  }

  /** Starts (or resumes) the clock. Time spent paused is skipped, so `time` continues from where it stopped. */
  play() {
    if (!this._paused) {
      return;
    }
    const now = this._getNow();
    // `_offset` holds the time at the moment the clock paused, so measure from now.
    this._refStart = now;
    this._paused = false;
    this._lastPauseStateChange = now;
    this.activateSubscription(AClockEnums.TIME_UPDATE_SUBSCRIPTION_HANDLE);
  }

  /**
   * Pauses the clock; `time` stops advancing until `play()` is called. Calling it on a paused clock does nothing
   * except make sure the system-time subscription is off.
   */
  pause() {
    if (!this._paused) {
      const now = this._getNow();
      // Commit the time that has passed, so `play()` can continue from exactly this value.
      this._offset = this._clockTimeAt(now);
      this._refStart = now;
      this._paused = true;
      this._lastPauseStateChange = now;
    }
    this.deactivateSubscription(AClockEnums.TIME_UPDATE_SUBSCRIPTION_HANDLE);
  }

  /**
   * Creates a listener that calls `callback(progress)` on every tick of this clock for `duration` units of clock
   * time, with `progress` going from 0 to 1 (reshaped by `tween`, if one is given). On the first tick after the
   * duration has passed it calls `callback` one last time with the final progress (1, or `tween.eval(1)`), so the
   * animation lands exactly on its end state, and then calls `actionOverCallback`. Later ticks do nothing.
   *
   * IMPORTANT! The listener stays registered until you remove it, which you should do in `actionOverCallback`.
   * Most code should use `addTimedActionTo` (or the `addTimedAction` methods of scene models, controllers and node
   * models, which call it) instead, because it handles this for you.
   * @param callback called with the action's progress on every tick
   * @param duration how long the action lasts, in units of clock time (seconds, at the default rate)
   * @param actionOverCallback called once, after the final call to `callback`
   * @param tween an optional easing curve applied to the progress
   * @returns the listener's callback switch; call `deactivate()` on it to remove the listener
   */
  CreateTimedAction(
    callback: (actionProgress: number) => any,
    duration: number,
    actionOverCallback: CallbackType,
    tween?: BezierTween
  ) {
    const startTime = this.time;
    let finished = false;
    return this.addTimeListener((t: number) => {
      if (finished) {
        return;
      }
      //calculate how much time has passed
      let timePassed = t - startTime;
      // Check to see if the duration has passed
      if (timePassed >= duration) {
        finished = true;
        callback(tween ? tween.eval(1) : 1);
        if (actionOverCallback) {
          actionOverCallback();
        }
        return;
      }
      let normalizedTime: number = timePassed / duration;
      if (tween) {
        normalizedTime = tween.eval(normalizedTime);
      }
      callback(normalizedTime);
    });
  }

  /**
   * Runs a timed action on this clock and stores its subscription on `owner`, so the action stops when it finishes,
   * when `owner.unsubscribe(handle)` is called, or when `owner` is released. This is the shared implementation of
   * `ASceneModel.addTimedAction`, `AController.addTimedAction` and `ANodeModel.addTimedAction`.
   *
   * If you provide a handle, the action is not started while `owner` already has a subscription with that handle.
   * This means you won't start a second copy of an action before the first has finished.
   * @param owner the object that holds the action's subscription
   * @param callback called with the action's progress, from 0 to 1, on every tick
   * @param duration how long the action lasts, in units of clock time
   * @param actionOverCallback called once when the action finishes (not when it is canceled)
   * @param tween an optional easing curve applied to the progress
   * @param handle an optional name for the action's subscription on `owner`
   * @returns the action's handle (a new uuid if none was given), or `undefined` if an action with `handle` is
   * already running
   */
  addTimedActionTo(
    owner: HoldsSubscriptions,
    callback: (actionProgress: number) => any,
    duration: number,
    actionOverCallback?: CallbackType,
    tween?: BezierTween,
    handle?: string
  ): string | undefined {
    if (handle && owner.hasSubscription(handle)) {
      return undefined;
    }
    const subscriptionHandle = handle ?? uuidv4();
    owner.subscribe(
      this.CreateTimedAction(
        callback,
        duration,
        () => {
          owner.unsubscribe(subscriptionHandle, false);
          if (actionOverCallback) {
            actionOverCallback();
          }
        },
        tween
      ),
      subscriptionHandle
    );
    return subscriptionHandle;
  }
}
