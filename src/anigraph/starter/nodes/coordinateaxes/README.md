# Coordinate Axes

A debugging/teaching node that draws the standard red/green/blue X/Y/Z gizmo at a node's local origin, handy for visualizing where a transform actually is in a scene. `CoordinateAxesModel3D` (extends `ANodeModel3D`) is mostly configuration: reactive `axesScale` and `lineWidth` properties (declared with `@AObjectState` so the view can react to changes) and a line material pulled from `AssetManager.DEFAULT_MATERIALS.LineMaterial`. `CoordinateAxesView3D` does the actual drawing — it creates an `ACoordinateAxesGraphic3D` (from [../../../rendering/graphicelements/](../../../rendering/graphicelements/README.md)) on init, and on every update applies the model's own transform times a uniform scale by `model.axesScale` (so the axes follow the node) and pushes the current `lineWidth` into the graphic, so resizing the axes is just a matter of setting one model property.

## Contents:
- [./__tests__](./__tests__/README.md): Jest specs for the axes view's transform.
- [./CoordinateAxesModel3D.ts](./CoordinateAxesModel3D.ts): 3D node model with reactive `axesScale` and `lineWidth` properties. Uses the default line material from `AssetManager`.
- [./CoordinateAxesView3D.ts](./CoordinateAxesView3D.ts): View that creates an `ACoordinateAxesGraphic3D` and, on each update, applies the model's transform times `Scale3D(model.axesScale)` and the line width.
- [./index.ts](./index.ts): Barrel export for the coordinateaxes module.