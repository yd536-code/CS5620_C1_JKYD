# __tests__

Jest specs for [scene](../README.md) (the starter scene base classes).

## Contents:
- [./SingleModeSceneController.test.ts](./SingleModeSceneController.test.ts): `SingleModeSceneController._beforeInitScene` runs the inherited `_beforeInitScene` (interaction-mode dropdown wiring) and still places the camera at `(0, 0, 10)`.
- [./ABasicSceneControllerFrame.test.ts](./ABasicSceneControllerFrame.test.ts): the default frame loop (used by the 3D starter) updates the model with `model.clock.currentTime`, then the controller, then renders.
