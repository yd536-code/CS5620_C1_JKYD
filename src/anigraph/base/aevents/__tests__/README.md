# __tests__

Jest specs for the [aevents](../README.md) module.

## Contents:
- [./CallbackSwitchActive.test.ts](./CallbackSwitchActive.test.ts): Checks that a callback switch's `active` flag stays correct after `removeCallback`, `removeEventListener`, one-time listeners, and handle reuse, and that `AGroupCallbackSwitch.active` is the OR of its children's flags.
