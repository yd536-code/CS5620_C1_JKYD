# Two.js Graphic Elements

Concrete Two.js drawable primitives. Each extends `ATwoJSGraphicObject`, wrapping one or more Two.js shapes in a group that an `ATwoJSNodeView` attaches to the scene. Default style for all: white fill, black 1px stroke (configurable via the graphic's `ATwoJSMaterial`).

All graphics also expose `setStroke(color, linewidth?)` (in addition to `setColor` for fill) via `ATwoJSGraphicObject`, for shapes where fill and stroke need to be styled independently.

## Contents:
- [./ATwoJSCircleGraphic.ts](./ATwoJSCircleGraphic.ts): A filled circle centered at its group's local origin; position it by transforming the parent node view.
- [./ATwoJSGroupGraphic.ts](./ATwoJSGroupGraphic.ts): A container group for composing other Two.js graphics under a single transform.
- [./ATwoJSLineGraphic.ts](./ATwoJSLineGraphic.ts): A straight line segment with in-place endpoint updates via `setEndpoints`. Has no fillable area, so fill is disabled by default and `color` sets the stroke.
- [./ATwoJSPathGraphic.ts](./ATwoJSPathGraphic.ts): An open or closed polygonal path built from a `Vec2[]`; `setPoints` replaces the underlying `Two.Path`. `color` sets the fill — for an open path meant to read as a line rather than a filled region, call `setStroke(...)` and `twoShape?.noFill()` after construction.
- [./ATwoJSPolygonGraphic.ts](./ATwoJSPolygonGraphic.ts): A closed polygon driven by an AniGraph `VertexArray2D`; `setVerts` rebuilds the path when vertex data changes.
- [./ATwoJSTextGraphic.ts](./ATwoJSTextGraphic.ts): A single line of text anchored at its group's local origin; `setText`/`setPosition`/`setAlignment` update it in place. Fill defaults to opaque black with no stroke.
- [./index.ts](./index.ts): Barrel export for the twojs graphicelements module.
