# Two.js Backend

The Two.js (SVG/canvas) rendering backend. These classes implement AniGraph's backend-agnostic view and graphic interfaces (`ANodeView`, `ASceneView`, `AGraphicObject`, `ADisplayObject`) on top of [Two.js](https://two.js.org/), so 2D scenes can render to SVG or canvas instead of WebGL.

Ownership chain for a rendered node:
```
ATwoJSSceneView (root TwoGroup, attached to the Two.js scene)
  └── ATwoJSNodeView._twoGroup           (one per node model; carries the transform)
        └── ATwoJSGraphicObject.displayObject.nativeGroup  (TwoGroup)
              └── Two.js shape (Circle, Path, Line, ...)
```

**Camera sync.** `ATwoJSSceneView` applies the scene's `cameraModel` (position, zoom) to its own root `TwoGroup`'s `translation`/`scale`, keeping them in sync on every pose/projection change. This is deliberately *not* the same convention `ACameraView` uses for AGL (center-origin, y-up, orthographic-frustum-scaled) -- every existing Two.js scene stores object positions directly in raw canvas pixels, so the *default* camera (identity pose, `zoom = 1`) has to render as a true no-op. `camera.position` is read as a direct pixel offset and `camera.zoom` as a direct scale multiplier instead: `translation = -position * zoom`, `scale = zoom`. **Known limitation:** zoom pivots on the world point at the camera's own `position` (the canvas corner), not the canvas center or the cursor -- see `ATwoJSSceneView.ts`'s file header, and `starter/interactionmodes/cameracontrollers/README.md` for `PanZoomController2D`'s matching `pixelSpace` pan mode.

## Contents:
- [./__tests__/](./__tests__/README.md): Tests for `ATwoJSSceneView`'s camera sync.
- [./graphicelements/](./graphicelements/README.md): Concrete Two.js drawable primitives (circle, line, path, polygon, group).
- [./ATwoJSDisplayObject.ts](./ATwoJSDisplayObject.ts): Adapts a Two.js `Group` to the `ADisplayObject` interface. Applies matrices by decomposing them into Two.js translation/rotation/scale properties.
- [./ATwoJSGraphicObject.ts](./ATwoJSGraphicObject.ts): Abstract base for all Two.js drawable primitives. Each subclass wraps its shapes in a `TwoGroup` packaged as an `ATwoJSDisplayObject`. Exposes `setColor`/`setStroke`/`setWireframe`/`setStrokeEnabled`/`setDashes` for styling.
- [./ATwoJSGroupNodeView.ts](./ATwoJSGroupNodeView.ts): Two.js view for group node models (no geometry; propagates transforms to children). Counterpart of the Three.js `AGroupNodeView`.
- [./ATwoJSMaterial.ts](./ATwoJSMaterial.ts): Thin wrapper around a Two.js shape's visual style (fill, stroke, linewidth, opacity, dashes), applied via `applyToShape`. `setDashes` sets a stroke dash pattern (`[]` for solid); it is a no-op (guarded in `applyToShape`) on shapes without a `dashes` property, such as a bare `Two.Group`.
- [./ATwoJSNodeView.ts](./ATwoJSNodeView.ts): Abstract base for Two.js node views. Owns one `Two.Group`, registers graphics into it, and applies 2D transforms by decomposition. Its `onTransformUpdate()` (called on the model's `TRANSFORM_UPDATE` events) is `updateTransform()`, so transform changes don't call `update()`.
- [./ATwoJSSceneView.ts](./ATwoJSSceneView.ts): Two.js counterpart of `ASceneView`. Creates node views from the class map as model nodes are added, attaching each view's group to its parent view's group or to the root. Applies the scene's camera model to the root group's transform (see above).
- [./TwoJSImport.ts](./TwoJSImport.ts): Runtime import shim for Two.js that normalizes CJS/ESM interop between webpack (browser) and Node (tests), plus loose typings for Two.js shapes and groups.
- [./index.ts](./index.ts): Barrel export for the twojs module.
