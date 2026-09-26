# __tests__

Jest specs for the [camera](../README.md) module.

## Contents:
- [./ACameraModel.test.ts](./ACameraModel.test.ts): Tests `ACameraModel3D`'s pose, projection and listeners, and
  `ndcToWorld` against a reference copy of the NDC-to-world formula; `ACameraModel2D` (its pose is its own 2D
  transform, and `ndcToWorld` follows pan and zoom); that `addCameraChangeListener` fires on an in-place pose edit;
  parented cameras (`getWorldRenderMatrix`, world-aware `ndcToWorld`, and a pose set directly on the wrapped
  `ACamera` reaching the model, as a scene's `initCamera` might do); `new ACameraModel3D()` with no argument;
  projection listeners on both camera classes (`addCameraProjectionListener` and `signalCameraProjectionUpdate` use
  the same event source, and the returned switch unsubscribes); and `ACameraView` rendering a 2D camera, removing its
  listener on release, and detaching on `dispose()`.
