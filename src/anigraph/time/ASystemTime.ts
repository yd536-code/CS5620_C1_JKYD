// import { AObject
//   , AObjectState, ASerializable } from "../base";
import {AObject} from "../base/aobject/AObject";
import {AObjectState} from "../base/aobject/AObject";
import {ALabel} from "../base/aserial/ASerializable";

/**
 * The system timer behind every {@link AClock} (there is one shared instance, `AClock.SystemTime`). While
 * unpaused, it sets `time` to `Date.now()` (milliseconds) every {@link _ASystemTime.TickIntervalMS} milliseconds,
 * using `setInterval`. It starts running as soon as it is created.
 */
@ALabel("_ASystemTime")
export class _ASystemTime extends AObject {
  /**
   * How often, in milliseconds, the timer updates `time`. The default, 16 ms, is about 60 updates per second,
   * which matches a typical display. The value is read when the timer starts, so after changing it, call
   * `pause()` and then `unpause()` on a running timer (e.g. `AClock.SystemTime`) for it to take effect.
   */
  static TickIntervalMS: number = 16;

  /** Whether the timer is stopped. */
  @AObjectState paused!: boolean;
  /** The latest system time, in milliseconds. */
  @AObjectState time!: number;
  protected timer!: NodeJS.Timer;

  constructor() {
    super();
    this.paused = true;
    this.time = Date.now();
    this.unpause();
  }
  /** Stops the timer. */
  pause() {
    if (!this.paused) {
      this.paused = true;
      clearInterval(this.timer);
    }
  }
  /** Starts the timer, ticking every {@link _ASystemTime.TickIntervalMS} ms (does nothing if it is already running). */
  unpause() {
    if (this.paused) {
      const self = this;
      this.paused = false;
      this.timer = setInterval(() => {
        if (!self.paused) {
          self.time = Date.now();
        }
      }, _ASystemTime.TickIntervalMS);
    }
  }
  /** Pauses the timer if it is running, or starts it if it is paused. */
  togglePause() {
    if (this.paused) {
      this.unpause();
    } else {
      this.pause();
    }
  }

  /**
   * Adds a listener called with the system time (milliseconds) whenever it changes.
   * @returns the listener's callback switch
   */
  addListener(callback: (t: number) => any) {
    const self = this;
    return this.addStateKeyListener("time", () => {
      callback(self.time);
    });
  }
}
