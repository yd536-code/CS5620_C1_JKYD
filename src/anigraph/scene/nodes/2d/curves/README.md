# 2D Curves

`CurveModel2D` (extends `ANodeModel2D`) is a 2D scene node whose vertex array (via `ANodeModel2D`'s `verts`) holds spline control points rather than a fixed mesh; a reactive `interpolationMode` — `Linear` or `CubicBezier`, from the `CurveInterpolationModes` enum — determines how those control points should be interpreted as a curve, and toggling it calls `signalGeometryUpdate()` so any listening view knows to re-tessellate. It has no view of its own defined here; `lineWidth` plus the `getStrokeMaterial`/`getFrameMaterial` helpers (both backed by `ALineMaterialModel` from [../../../../rendering/](../../../../rendering/README.md)) exist so a line-rendering view can draw the resulting curve with a consistent stroke.

## Contents:
- [./CurveModel2D.ts](./CurveModel2D.ts): 2D curve node model supporting `Linear` and `CubicBezier` interpolation modes. Stores control points in a `VertexArray2D` and exposes line width.
- [./index.ts](./index.ts): Barrel export for the 2D curves module.