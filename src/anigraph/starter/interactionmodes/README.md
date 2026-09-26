# Interaction Modes

Pre-built interaction mode classes for scene controllers. The base `ASceneInteractionMode` lives in [../../scene/interactionmodes/](../../scene/interactionmodes/README.md) so Two.js scenes can use it too; this module's `index.ts` also re-exports it.

`ADebugInteractionMode` hosts one `FlyController3D` and one `OrbitController3D` from [./cameracontrollers/](./cameracontrollers/README.md) and forwards each raw event to whichever of them handles it. `APanZoomInteractionMode2D` is its 2D counterpart, hosting one `PanZoomController2D`; it is `ASceneController2D`'s default interaction mode (see [../Scene2D/](../Scene2D/README.md)) instead of `ADebugInteractionMode`, whose fly/orbit moves the wrapped `ACamera`'s 3D pose, which a 2D camera (`ACameraModel2D`) doesn't render from.

## Contents:
- [./__tests__/](./__tests__/README.md): Jest specs for the interaction modes (following a replaced camera model).
- [./cameracontrollers/](./cameracontrollers/README.md): The `ACameraController` interface and its implementations (fly, orbit, 2D pan/zoom).
- [./ADebugInteractionMode.ts](./ADebugInteractionMode.ts): "Fly plus orbit" debug camera interaction mode -- WASD/RF movement and mouse-wheel dolly (`FlyController3D`) plus mouse-drag orbital rotation (`OrbitController3D`). Exposes `cameraMovementSpeed`/`cameraOrbitSpeed`/`cameraOrbitCenter` as pass-through properties onto the two controllers.
- [./APanZoomInteractionMode2D.ts](./APanZoomInteractionMode2D.ts): Drag-to-pan, wheel-to-zoom interaction mode for a 2D scene's camera. Hosts one `PanZoomController2D`; exposes `zoomSpeed`/`minZoom` as pass-through properties onto it. `ASceneController2D`'s default.
- [./AScenePointerLockInteractionMode.ts](./AScenePointerLockInteractionMode.ts): Interaction mode variant that uses the browser Pointer Lock API for first-person style navigation where the cursor is captured by the canvas.
- [./ControlPanelInteractionModeWiring.ts](./ControlPanelInteractionModeWiring.ts): Shared free functions wiring a scene controller's current interaction mode to the control panel's dropdown (used by both the Three.js and Two.js starter controllers, which can't share this logic via `super` calls).
- [./index.ts](./index.ts): Barrel export for the interactionmodes module (including the `ASceneInteractionMode` re-export).
