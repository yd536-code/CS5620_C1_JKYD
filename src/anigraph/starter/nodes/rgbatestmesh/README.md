# RGBA Test Mesh

A minimal diagnostic node used to sanity-check the vertex-color pipeline in isolation from any texture or lighting logic. `RGBATestMeshModel3D` extends `AMeshModel3D` from [../../../scene/nodes/trianglemesh/](../../../scene/nodes/trianglemesh/README.md); its `Create` factory builds a `VertexArray3D` configured for rendering with colors enabled but no normals or UVs, so the only per-vertex data that reaches the shader is RGBA color — useful for confirming that a shader's color attribute is wired up correctly before adding textures or lighting. `RGBATestMeshView` is an otherwise-ordinary triangle-mesh view (`ATriangleMeshGraphic`) with no special-casing beyond that vertex format.

## Contents:
- [./RGBATestMeshModel3D.ts](./RGBATestMeshModel3D.ts): Triangle mesh model configured with a per-vertex color attribute (`VertexArray3D` with colors only). Provides a `Create` factory.
- [./RGBATestMeshView.ts](./RGBATestMeshView.ts): View that renders the RGBA test mesh using `ATriangleMeshGraphic`.
- [./index.ts](./index.ts): Barrel export for the rgbatestmesh module.