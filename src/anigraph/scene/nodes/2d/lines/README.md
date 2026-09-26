# 2D Lines

Three related 2D node types, each an `ANodeModel2D` subclass paired with a matching view, share the pattern of storing their points in the model's `verts` vertex array and a `lineWidth` for stroke thickness. `LineModel2D`/`LineView2D` draw a single connected polyline (`addVertices` appends points with per-vertex colors) rendered via `ALineGraphic`. `LineSegmentsModel2D`/`LineSegmentsView2D` are the disconnected-segment analog, rendered via `ALineSegmentsGraphic` instead — each vertex pair is its own segment rather than a continuous path. `VectorModel2D`/`VectorView2D` render a single arrow: it's really a two-point line plus an `arrowheadSize`, with `setEndpoint`/`getEndPoint` helpers that mutate the last vertex and call `signalGeometryUpdate()` so the view redraws — handy for interactively dragging a vector's tip. The `A*Graphic` classes these views build on live in [../../../../rendering/](../../../../rendering/README.md).

## Contents:
- [./LineModel2D.ts](./LineModel2D.ts): 2D polyline node model storing vertices with per-vertex colors and a reactive `lineWidth`.
- [./LineSegmentsModel2D.ts](./LineSegmentsModel2D.ts): 2D disconnected line segments model, analogous to `LineModel2D` but rendered as individual segments.
- [./LineSegmentsView2D.ts](./LineSegmentsView2D.ts): View for 2D line segments using `ALineSegmentsGraphic`.
- [./LineView2D.ts](./LineView2D.ts): View for a 2D polyline using `ALineGraphic`.
- [./VectorModel2D.ts](./VectorModel2D.ts): 2D vector (arrow) model with `lineWidth` and `arrowheadSize`, and helpers for setting/getting the endpoint.
- [./VectorView2D.ts](./VectorView2D.ts): View for 2D vectors using `ArrowGraphic2D`.
- [./index.ts](./index.ts): Barrel export for the 2D lines module.