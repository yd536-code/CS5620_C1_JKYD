/**
 * Tests for {@link AClock}'s bookkeeping: `reset(t0)`, changing `rate` while paused, and the `paused` setter.
 *
 * `Date.now` is mocked so "real time" only moves when a test sets `now`. Each test calls `clock.update(now)`
 * itself, the same call the shared system timer makes on every tick.
 */
// Load a higher-level module first; the engine has a circular import that only resolves in this order.
import {AMeshModel2D, AClock} from "../../index";

new AMeshModel2D();

describe("AClock", () => {
  let now = 0;
  let nowSpy: jest.SpyInstance;
  beforeEach(() => {
    now = 1000;
    nowSpy = jest.spyOn(Date, "now").mockImplementation(() => now);
  });
  afterEach(() => {
    nowSpy.mockRestore();
  });

  test("reset(t0) then play() continues from t0", () => {
    const clock = new AClock();
    clock.reset(5);
    clock.play();
    clock.update(now);
    expect(clock.time).toBeCloseTo(5);
    now += 2000;
    clock.update(now);
    expect(clock.time).toBeCloseTo(7);
  });

  test("reset(t0) on a clock that has already played continues from t0", () => {
    const clock = new AClock();
    clock.play();
    now += 3000;
    clock.update(now);
    clock.pause();
    clock.reset(10);
    now += 500;
    clock.play();
    now += 1000;
    clock.update(now);
    expect(clock.time).toBeCloseTo(11);
  });

  test("changing rate while paused does not make time jump when play resumes", () => {
    const clock = new AClock();
    clock.play();
    now += 2000;
    clock.update(now);
    expect(clock.time).toBeCloseTo(2);
    clock.pause();
    now += 2000;
    clock.rate = 2;
    now += 1000;
    clock.play();
    clock.update(now);
    expect(clock.time).toBeCloseTo(2);
    now += 1000;
    clock.update(now);
    expect(clock.time).toBeCloseTo(4);
  });

  test("changing rate while playing keeps the current time", () => {
    const clock = new AClock();
    clock.play();
    now += 2000;
    clock.update(now);
    clock.rate = 0.5;
    clock.update(now);
    expect(clock.time).toBeCloseTo(2);
    now += 2000;
    clock.update(now);
    expect(clock.time).toBeCloseTo(3);
    expect(clock.rate).toBeCloseTo(0.5);
  });

  test("setting paused=false starts the clock and paused=true stops it", () => {
    const clock = new AClock();
    clock.paused = false;
    expect(clock.paused).toBe(false);
    now += 2000;
    clock.update(now);
    expect(clock.time).toBeCloseTo(2);
    clock.paused = true;
    now += 5000;
    clock.update(now);
    expect(clock.time).toBeCloseTo(2);
    clock.paused = false;
    now += 1000;
    clock.update(now);
    expect(clock.time).toBeCloseTo(3);
  });

  test("calling pause() twice does not count the time in between as running", () => {
    const clock = new AClock();
    clock.play();
    now += 1000;
    clock.pause();
    now += 3000;
    clock.pause();
    now += 1000;
    clock.play();
    clock.update(now);
    expect(clock.time).toBeCloseTo(1);
  });

  describe("currentTime (computed when read)", () => {
    test("while playing, it is the exact time now, even between system-time ticks", () => {
      const clock = new AClock();
      clock.play();
      clock.update(now);
      now += 10; // 10 ms pass, but no tick arrives
      expect(clock.time).toBeCloseTo(0);          // the stored value waits for the next tick
      expect(clock.currentTime).toBeCloseTo(0.01); // the live value doesn't
    });

    test("while paused, it stays at the paused time", () => {
      const clock = new AClock();
      clock.play();
      now += 2000;
      clock.pause();
      now += 5000;
      expect(clock.currentTime).toBeCloseTo(2);
    });

    test("follows rate changes", () => {
      const clock = new AClock();
      clock.play();
      now += 1000;
      clock.rate = 2;
      now += 1000;
      expect(clock.currentTime).toBeCloseTo(3);
    });
  });
});
