# __tests__

Tests for `ACamera`'s projection math (`../ACamera.ts`, with the projection kinds in `../CameraProjection.ts`). They check exact matrices and pin three details that are easy to get wrong: `CreatePerspectiveFOV` works out `lrbt`/`zNear`/`zFar` from the inverse of the FOV-built matrix; `onCanvasResize` rescales the current `lrbt` by the change in aspect ratio, so a resize builds on the previous one rather than starting from the original FOV; and `zoom` changes the orthographic projection matrix but not the perspective one. They also check the `getProjectedPoint`/`getWorldToNDC`/`convertNDCToWorld2D` round trips.

## Contents:
- [./ACamera.test.ts](./ACamera.test.ts): Golden-matrix and round-trip tests for `ACamera`'s three creation paths (`CreatePerspectiveFOV`, `CreatePerspectiveNearPlane`, `CreateOrthographic`), canvas resize, zoom, NDC/world conversion, and `CopyOf` giving the copy its own pose.
