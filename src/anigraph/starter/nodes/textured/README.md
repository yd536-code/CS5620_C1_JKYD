# Textured 2D Nodes

Extends [../polygon2D/](../polygon2D/README.md) with 2D polygons that show an image instead of a flat color. `TexturedPolygonModel2D` extends `PolygonModel2D`, adding a texture and a `textureMatrix` for UV mapping — setting a texture automatically initializes the polygon's UV vertex attribute if it isn't already present; it stores its transform as a `NodeTransform2D` by default, same as `PolygonModel2D`. `TexturedPolygonView2D` keeps a `TexturedPolygonModel2D`'s mesh geometry, texture, and 2D transform synced each frame.

## Contents:
- [./TexturedPolygonModel2D.ts](./TexturedPolygonModel2D.ts): Extends `PolygonModel2D` with a texture and a `textureMatrix` for UV mapping. Initializes UV attributes automatically when a texture is set.
- [./TexturedPolygonView2D.ts](./TexturedPolygonView2D.ts): View for textured 2D polygons, syncing mesh geometry, texture, and 2D transform.
- [./index.ts](./index.ts): Barrel export for the textured module.
