# Scene2D tests

Jest tests for the 2D (Three.js) starter scene classes.

## Contents:
- [./ASceneModel2DCamera.test.ts](./ASceneModel2DCamera.test.ts): `ASceneModel2D.cameraModel` is typed as `ACameraModel2D` (so `this.cameraModel.prsa` compiles without a cast) and shares its storage with the base `ASceneModel.cameraModel` accessor, in both directions.
- [./ASceneController2DFrame.test.ts](./ASceneController2DFrame.test.ts): The default frame loop of `ASceneController2D` calls `model.timeUpdate(model.clock.currentTime)` once per frame, before updating the controller and rendering.
