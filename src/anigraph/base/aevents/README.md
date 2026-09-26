# AEvents

This is the low-level plumbing behind AniGraph's named-event system, used by [../aobject/AHandlesEvents.ts](../aobject/README.md) to give any object the ability to fire and listen for events by string name. `ACallbackSwitch` is the base abstraction: a handle-identified on/off switch with `activate()`/`deactivate()`, so a caller can later disable a callback without needing to hold a reference to it beyond its handle (`AGroupCallbackSwitch` composes several switches so they can all be toggled together). `AEventCallbackDict` is a per-event-name registry of these switches — `addCallback` wraps a function in an `AEventCallbackSwitch`, activates it (registering it in the dict), and hands the switch back to the caller; `signalEvent` then calls every currently-active callback in the dict. Deactivating a switch removes its entry from the dictionary entirely, so there's no dangling reference left behind once a listener is torn down.

## Contents:
- [./__tests__/](./__tests__/README.md): Jest tests for callback switch `active` flags.
- [./ACallbackSwitch.ts](./ACallbackSwitch.ts): Abstract `ACallbackSwitch` base class with `activate()`/`deactivate()` lifecycle, plus `AGroupCallbackSwitch` for managing collections of switches together.
- [./AEventCallbackDict.ts](./AEventCallbackDict.ts): `AEventCallbackDict` maps string handles to `AEventCallbackSwitch` instances. Adding a callback returns a switch; deactivating it removes the callback from the dictionary with no lingering references.
- [./index.ts](./index.ts): Barrel export for the aevents module.