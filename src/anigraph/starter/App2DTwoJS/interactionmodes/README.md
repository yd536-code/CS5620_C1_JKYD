# interactionmodes

Interaction modes for the Two.js starter app, analogous to [../../interactionmodes/](../../interactionmodes/README.md) on the Three.js side.

## Contents:
- [./ATwoJSDebugInteractionMode.ts](./ATwoJSDebugInteractionMode.ts): 2D pan/zoom debug interaction mode. Hosts one `PanZoomController2D` (`pixelSpace: true`) -- the Two.js counterpart of `APanZoomInteractionMode2D`, which hosts the same class on the Three.js side. It moves the scene's camera model, and `ATwoJSSceneView` applies the camera to the drawing (see `rendering/twojs/README.md`).
