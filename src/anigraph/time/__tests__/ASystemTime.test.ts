/**
 * Tests that {@link _ASystemTime} starts its `setInterval` with an explicit delay, `_ASystemTime.TickIntervalMS`.
 */
// Load a higher-level module first; the engine has a circular import that only resolves in this order.
import {AMeshModel2D, _ASystemTime} from "../../index";

new AMeshModel2D();

describe("_ASystemTime tick interval", () => {
  let intervalSpy: jest.SpyInstance;
  const originalInterval = _ASystemTime.TickIntervalMS;
  beforeEach(() => {
    jest.useFakeTimers();
    intervalSpy = jest.spyOn(global, "setInterval");
  });
  afterEach(() => {
    intervalSpy.mockRestore();
    jest.useRealTimers();
    _ASystemTime.TickIntervalMS = originalInterval;
  });

  test("the default delay is about 16 ms", () => {
    expect(_ASystemTime.TickIntervalMS).toBe(16);
    const st = new _ASystemTime();
    expect(intervalSpy).toHaveBeenCalledTimes(1);
    expect(intervalSpy.mock.calls[0][1]).toBe(16);
    st.pause();
  });

  test("the timer uses the configured delay and updates time on each tick", () => {
    _ASystemTime.TickIntervalMS = 40;
    const st = new _ASystemTime();
    expect(intervalSpy.mock.calls[0][1]).toBe(40);
    const nowSpy = jest.spyOn(Date, "now").mockImplementation(() => 123456);
    jest.advanceTimersByTime(40);
    expect(st.time).toBe(123456);
    nowSpy.mockRestore();
    st.pause();
  });

  test("a new delay is used the next time the timer is started", () => {
    const st = new _ASystemTime();
    _ASystemTime.TickIntervalMS = 25;
    st.pause();
    st.unpause();
    expect(intervalSpy.mock.calls[intervalSpy.mock.calls.length - 1][1]).toBe(25);
    st.pause();
  });
});
