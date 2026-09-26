# App2D tests

Jest tests for the 2D (Three.js) starter scene classes.

## Contents:
- [./AppSceneController2DFrame.test.ts](./AppSceneController2DFrame.test.ts): The default frame loop of `AppSceneController2D` calls `model.timeUpdate(model.clock.currentTime)` once per frame, before updating the controller and rendering.
