# __tests__

Jest specs for the [time](../README.md) module.

## Contents:
- [./AClock.test.ts](./AClock.test.ts): `AClock` bookkeeping with a mocked `Date.now`: `reset(t0)` continues from `t0`, changing `rate` while paused doesn't make time jump, the `paused` setter starts/stops the clock, and pausing twice doesn't count the time in between; `currentTime` gives the exact time between system-time ticks.
- [./ASystemTime.test.ts](./ASystemTime.test.ts): `_ASystemTime` starts `setInterval` with the delay `_ASystemTime.TickIntervalMS` (default 16 ms), using fake timers.
- [./ATimeFilter.test.ts](./ATimeFilter.test.ts): `ATimeFilter`'s constructor sets `latency`.
