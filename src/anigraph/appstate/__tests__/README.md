# __tests__

Jest specs for the [app state](../README.md).

## Contents:
- [./bindStateValueToProperty.test.ts](./bindStateValueToProperty.test.ts): Tests `AAppState.bindStateValueToProperty`: a control value is assigned to the target property, then the optional `signal` runs, and `transform` maps the value first.
- [./CreateAppState.test.ts](./CreateAppState.test.ts): Checks that calling `CreateAppState` a second time returns the existing app state (with one warning) instead of throwing.
- [./AppStateInit.test.ts](./AppStateInit.test.ts): Checks that `AppState.init()` runs once, even though both `SetAppState` and `confirmInitialized` ask for it.
- [./ControlPanelValues.test.ts](./ControlPanelValues.test.ts): Checks that `setControlPanelStateValue`/`updateControlPanelValue` push a `Color` into the panel store as `RGBuintAfloat`, and that `addControlPanelListener` callbacks receive the app state.
