# Camera Controllers

`ACameraController` is an interface for an object that attaches to one camera model and responds to the same raw events an interaction mode does (key, drag, wheel) plus a per-frame update, so an interaction mode can host camera controllers instead of doing the camera math itself. Every method is optional -- a controller that only cares about dragging (`OrbitController3D`) simply does not define `onKeyDown`/`onWheelMove`/etc.

`FlyController3D` (WASD/RF movement, wheel dolly) and `OrbitController3D` (drag to orbit) make up `../ADebugInteractionMode.ts`'s "fly plus orbit"; `ADebugInteractionMode` hosts one of each and forwards its own callbacks with `forwardToControllers`. `OrbitController3D` orbits about `orbitCenter` (the world origin by default), keeping the camera's distance to that point the same.

`PanZoomController2D` drives an `ACameraModel2D` on both backends: drag pans the camera model's own 2D node transform (not the wrapped `ACamera`'s pose, which a 2D camera never renders from), and wheel changes the wrapped `ACamera`'s `zoom` (higher `zoom` means more magnified on both backends). `../APanZoomInteractionMode2D.ts` (Three.js, `pixelSpace: false`) and `../../App2DTwoJS/interactionmodes/ATwoJSDebugInteractionMode.ts` (Two.js, `pixelSpace: true`) both host it, and each is its backend starter's default interaction mode.

**The `pixelSpace` constructor flag** is the one place pan differs between backends. `pixelSpace: false` (default) computes the pan delta with `cameraModel.ndcToWorld(ndc)`, the NDC convention `ACameraView` renders through. `pixelSpace: true` computes it from raw `event.cursorPosition`, divided by the camera's current `zoom`, which matches `ATwoJSSceneView`'s `translation = -position * zoom` (Two.js scenes place objects in raw canvas pixels, so they can't use the NDC-centered mapping; see `rendering/twojs/README.md`). After the delta is computed, both modes update the position the same way.

There is no pointer-lock (mouse-look) camera controller; `AScenePointerLockInteractionMode` leaves `onMouseMove` for subclasses to fill in.

## Contents:
- [./__tests__/](./__tests__/README.md): Tests for the fly and orbit controllers (against reference copies of the math), and for `PanZoomController2D` (both pan modes).
- [./ACameraController.ts](./ACameraController.ts): The controller interface, plus `forwardToControllers`, a small helper that calls one named callback on every controller in a list that implements it.
- [./FlyController3D.ts](./FlyController3D.ts): WASD/RF fly movement and mouse-wheel dolly.
- [./OrbitController3D.ts](./OrbitController3D.ts): Mouse-drag orbit rotation about `orbitCenter` (the world origin by default); the camera's distance to the center stays the same.
- [./PanZoomController2D.ts](./PanZoomController2D.ts): Drag-to-pan (`ndcToWorld` deltas on AGL, raw-pixel-over-zoom deltas on Two.js via `pixelSpace: true`) and wheel-to-zoom for an `ACameraModel2D`, on either backend.
