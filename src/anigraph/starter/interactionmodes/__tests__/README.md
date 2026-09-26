# __tests__

Jest specs for [interactionmodes](../README.md). The camera controllers' own tests are in
[../cameracontrollers/__tests__/](../cameracontrollers/__tests__/README.md).

## Contents:
- [./CameraSwap.test.ts](./CameraSwap.test.ts): `ADebugInteractionMode`, `APanZoomInteractionMode2D` and `ATwoJSDebugInteractionMode` move the scene's current camera model after it is replaced, not the first one their controllers saw.
