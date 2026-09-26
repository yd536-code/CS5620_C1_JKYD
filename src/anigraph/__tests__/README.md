# __tests__

Jest specs for the engine as a whole (see [the engine README](../README.md)). Module-specific tests live in each module's own `__tests__/` folder.

## Contents:
- [./PublicExports.test.ts](./PublicExports.test.ts): Checks that the event enums, camera enums, `ATTRIBUTE_NAMES`, `AStateCallbackSwitch`, the `AAppState` helpers, the time interpolation classes and `AAssetManager` are exported from the top-level barrel.
