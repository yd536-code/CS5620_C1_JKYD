# 2D Mesh

The general-purpose 2D node type for arbitrary flat geometry, as opposed to the special-cased [../lines/](../lines/README.md) and [../curves/](../curves/README.md) node types. `AMeshModel2D` (extends `ANodeModel2D`, defaulting to a `NodeTransform2D` transform — see [../../../nodeModel/](../../../nodeModel/README.md)) wraps a `VertexArray2D`, and exposes a static `Create2DMeshModel(hasColors, hasTextureCoords, hasNormals)` factory that builds an appropriately-configured vertex array via `VertexArray2D.CreateForRendering` rather than requiring callers to set up attributes by hand. `AMeshView2D` renders whatever's in the model's vertex array using `APolygonGraphic2D`, re-syncing geometry and the 2D transform every frame — this is the workhorse node type used any time a scene needs a custom flat shape (polygons, sprites, custom silhouettes) that isn't a line or curve.

## Contents:
- [./AMeshModel2D.ts](./AMeshModel2D.ts): 2D mesh node model wrapping a `VertexArray2D`. Provides a `Create2DMeshModel` factory for configuring which attributes (colors, UV, normals) are present.
- [./AMeshView2D.ts](./AMeshView2D.ts): View that renders the 2D mesh using `APolygonGraphic2D` and syncs geometry and transform each frame.
- [./index.ts](./index.ts): Barrel export for the mesh2d module.
