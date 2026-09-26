# __tests__

Jest specs for [twojs](../README.md).

`ATwoJSSceneView.test.ts` pins the camera-to-viewport mapping `_syncTwoGroupToCamera` implements: constructs `ATwoJSSceneView` directly against a minimal fake controller (`{model: {cameraModel}}`), then checks that the default camera (identity pose, `zoom = 1`) renders as a true identity (`translation = (0,0)`, `scale = 1`), that panning/zooming the camera model updates `twoGroup.translation`/`.scale` live (not just once at construction), and that a scene with no camera model at all does not throw.

## Contents:
- [./ATwoJSSceneView.test.ts](./ATwoJSSceneView.test.ts): Camera-to-viewport sync tests for `ATwoJSSceneView`.
- [./ATwoJSMatrix.test.ts](./ATwoJSMatrix.test.ts): Checks that Two.js views read AniGraph's row-major `Mat4` (translation and rotation kept) and that `ATwoJSDisplayObject.getMatrix` round-trips.
- [./ATwoJSStyleAndViews.test.ts](./ATwoJSStyleAndViews.test.ts): Checks `setWireframe` (true = stroke only, false = stroke and fill) and `setStrokeEnabled`, that text keeps its stroke off after `setColor`, that `ATwoJSSceneView.onModelNodeAdded` reports view errors with `console.error` but skips models with no view class silently, and that `ATwoJSPolygonGraphic.setVerts` with no vertices clears `twoShape`.
