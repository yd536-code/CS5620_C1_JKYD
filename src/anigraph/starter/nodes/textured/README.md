# Textured 2D Nodes

Extends [../polygon2D/](../polygon2D/README.md) and [../../../fileio/svgl/](../../../fileio/svgl/README.md) with 2D nodes that show an image or vector asset instead of a flat color. `TexturedPolygonModel2D` extends `PolygonModel2D`, adding a texture and a `textureMatrix` for UV mapping — setting a texture automatically initializes the polygon's UV vertex attribute if it isn't already present; it stores its transform as a `NodeTransform2D` by default, same as `PolygonModel2D`. `TexturedPolygonView2D` keeps a `TexturedPolygonModel2D`'s mesh geometry, texture, and 2D transform synced each frame. `SVGModel2D` is unrelated to the polygon classes — it's a 2D node that holds a loaded `SVGLAsset` directly and exposes the SVG's internal node hierarchy as typed `ANodeModel2D` children (via `SVGLAsset.Load`/`LoadFromSVG`), so an imported multi-part SVG illustration becomes a normal (if read-only) piece of the scene graph, with `getBounds2D()` computing bounds over both its own vertices and all child bounds.

## Contents:
- [./SVGModel2D.ts](./SVGModel2D.ts): 2D node model that holds an `SVGLAsset` and exposes its child nodes as typed `ANodeModel2D` children.
- [./TexturedPolygonModel2D.ts](./TexturedPolygonModel2D.ts): Extends `PolygonModel2D` with a texture and a `textureMatrix` for UV mapping. Initializes UV attributes automatically when a texture is set.
- [./TexturedPolygonView2D.ts](./TexturedPolygonView2D.ts): View for textured 2D polygons, syncing mesh geometry, texture, and 2D transform.
- [./index.ts](./index.ts): Barrel export for the textured module.
