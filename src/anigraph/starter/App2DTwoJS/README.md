# App2DTwoJS

Starter classes for building 2D AniGraph applications on the Two.js (SVG/canvas) backend. (The C1 example scenes use the Three.js starter in [../Scene2D/](../Scene2D/README.md) instead.)

## Contents:
- [./interactionmodes/](./interactionmodes/README.md): The Two.js pan/zoom debug interaction mode.
- [./ATwoJSAppSceneController.ts](./ATwoJSAppSceneController.ts): Abstract Two.js scene controller starter. Sets a white background and registers a default `AGroupNodeModel2D → ATwoJSGroupNodeView` spec (call `super.initModelViewSpecs()` from subclasses to keep it).
- [./ATwoJSAppSceneModel.ts](./ATwoJSAppSceneModel.ts): Abstract Two.js scene model starter. Provides a default orthographic camera, which `ATwoJSSceneView` applies to the drawing (position as a pixel offset, `zoom` as a scale; see `rendering/twojs/README.md`); subclasses implement `initScene`, `timeUpdate`, and `initAppState`. Extends [../Scene2D/ASceneModel2D.ts](../Scene2D/README.md), which provides the orthographic setup this class's `initCamera` calls.
- [./index.ts](./index.ts): Barrel export for the App2DTwoJS module.
