# __tests__

Jest specs for [cameracontrollers](../README.md).

`CameraControllers.test.ts` checks `FlyController3D`/`OrbitController3D` against reference copies of the fly/orbit math (the same "keep a reference implementation" pattern `RenderMatrix.test.ts`/`ACameraModel.test.ts` use). It covers each of the six WASD/RF keys individually and combined, wheel dolly, drag rotation (including doing nothing when `ndcCursor` is null), and orbiting about a non-zero `orbitCenter` (the camera's pose becomes `T(c) R T(-c) M`, so its distance to the center is unchanged). The reference-copy tests use the default `orbitCenter` (the origin).

`PanZoomController2D.test.ts` checks `PanZoomController2D` against the formulas its doc comment gives, re-derived independently in the test. The default (`pixelSpace: false`, Three.js) mode's tests cover wheel zoom's sign and clamp, a drag pan's `ndcToWorld`-delta math against a re-derived `ACamera.convertNDCToWorld2D`, and that two drags of the same relative motion pan by the same amount regardless of the camera's current position (because `ndcToWorld` -- `ACameraModel2D`'s own version, see `scene/camera/__tests__/ACameraModel.test.ts` -- is an affine map whose linear part doesn't depend on position). The `pixelSpace: true` (Two.js) mode's tests cover the same wheel-zoom formula plus its own pan delta: raw `cursorPosition` divided by the current zoom, checked at `zoom = 1` (delta unchanged) and `zoom = 2` (delta halved). The division keeps 1 screen pixel of drag equal to 1 screen pixel of visible pan at any zoom, matching `ATwoJSSceneView`'s `translation = -position * zoom`.

## Contents:
- [./CameraControllers.test.ts](./CameraControllers.test.ts): Tests `FlyController3D`/`OrbitController3D` against reference copies of the fly/orbit math, plus orbiting about a non-zero `orbitCenter`.
- [./PanZoomController2D.test.ts](./PanZoomController2D.test.ts): Tests `PanZoomController2D` against its documented formulas: both pan modes (`pixelSpace: false`/`true`), zoom, and guards.
