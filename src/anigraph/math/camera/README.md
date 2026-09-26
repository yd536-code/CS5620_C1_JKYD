# Camera

Defines the pure-math camera abstraction used underneath [../../scene/camera/](../../scene/camera/README.md)'s scene-graph camera model/view — this module has no scene-graph or rendering dependency itself, just projection and pose math. `ACameraClass<T extends TransformationInterface3D>` (an `AObject` subclass parameterized over a transformation type) is the abstract base holding a pose transform, a projection (perspective or orthographic), zoom, and canvas-size-dependent aspect ratio, with the logic to recompute view/projection matrices and interop with `THREE.Camera`. `ACamera extends ACameraClass<TransformationInterface3D>` is the general-purpose concrete camera actually held by `ACameraModel3D` in the scene module -- its pose type is fixed to 3D, which is why `ACameraModel2D` keeps its pose in its own 2D transform instead of in a wrapped `ACamera` the way `ACameraModel3D` does.

Each projection kind is an object (`CameraProjection.ts`'s `OrthographicProjection`/`PerspectiveProjection`) that does the math for that kind: `ACameraClass.updateProjection()` and `CreateThreeJSCamera()` call `this._projectionKind` (chosen by `this.projectionType`) instead of switching on the type themselves. The frustum settings (`lrbt`, `zNear`, `zFar`, `zoom`) live on `ACameraClass`, since other code such as `ACameraElement` reads them directly; only the projection-matrix and `THREE.Camera` math is in `CameraProjection.ts`.

## Contents:
- [./__tests__/](./__tests__/README.md): Tests for `ACamera`'s projection math.
- [./index.ts](./index.ts): Re-exports `ACamera`, `ACameraClass`, and the `CameraProjection` module.
- [./ACamera.ts](./ACamera.ts): Abstract and concrete camera classes supporting perspective and orthographic projections, pose/projection state, zoom, canvas resize, and Three.js interop.
- [./CameraProjection.ts](./CameraProjection.ts): `CameraProjectionKind` interface and its two implementations, `OrthographicProjection`/`PerspectiveProjection` — the projection-matrix and `THREE.Camera`-construction math `ACameraClass` delegates to.
