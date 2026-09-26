# Triangle Mesh Scene Node

The 3D counterpart to [../2d/mesh2d/](../2d/mesh2d/README.md) — the general-purpose node type for arbitrary procedural 3D geometry, as opposed to externally-loaded assets ([../loaded/](../loaded/README.md)). `AMeshModel3D` (extends `ANodeModel3D`) wraps a `VertexArray3D`; its static `Create(hasNormals, hasTextureCoords, hasColors)` factory builds a correctly-shaped vertex array via `VertexArray3D.CreateForRendering` so callers configuring a new mesh (e.g. course assignment code building custom shapes) don't have to set up attribute buffers by hand. `ATriangleMeshView` creates an `ATriangleMeshGraphic` from that vertex array and keeps both the geometry and the 3D transform in sync with the model each frame.

## Contents:
- [./AMeshModel3D.ts](./AMeshModel3D.ts): 3D triangle mesh node model wrapping a `VertexArray3D`. Provides a `Create` factory for configuring vertex attribute presence (normals, UVs, colors).
- [./ATriangleMeshView.ts](./ATriangleMeshView.ts): View that creates an `ATriangleMeshGraphic` from the model's vertex array and syncs geometry and 3D transform each frame.
- [./index.ts](./index.ts): Barrel export for the trianglemesh module.