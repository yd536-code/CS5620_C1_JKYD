# __tests__

Jest specs for several of the [geometry](../README.md) module's core data types. `BoundingBox2D.test.js` checks `BoundingBox2D.FromVec2s` against known point sets — a unit square, a single point (zero-size box), and scattered points — verifying the computed `minPoint`/`maxPoint`. `VertexArray2D.test.js` checks `VertexArray2D.addVertex`/`getPoint2DAt`, confirming that `length` tracks the number of added vertices and that stored positions round-trip correctly.

## Contents:
- [./BoundingBox2DCorners.test.ts](./BoundingBox2DCorners.test.ts): Checks that `BoundingBox2D.corners` and `GetBoundaryLinesVertexArray` apply the box's `transform` (identity, translation, rotation with scale), that `getLocalCorners` doesn't, and that an empty box has no corners.
- [./BoundingBox2D.test.js](./BoundingBox2D.test.js): Tests `BoundingBox2D` computation from a `VertexArray2D`.
- [./VertexArray2D.test.js](./VertexArray2D.test.js): Tests `VertexArray2D` vertex, color, and UV insertion and querying.
- [./BoundingBox3D.test.ts](./BoundingBox3D.test.ts): Tests that record the current behavior of `BoundingBox3D`, the members `BoundingBox2D`/`3D` share through `BoundingBox`, pinned checksums of `VertexArray3D.Sphere`/`ColoredSphere`, and `addVertices`.
- [./VertexAttributeArray.test.ts](./VertexAttributeArray.test.ts): Tests that record the current behavior of every `VertexAttributeArray` subclass, including per-class padding and conversion asymmetries.
- [./VertexAttributeArray.bench.test.ts](./VertexAttributeArray.bench.test.ts): Benchmark that checks the generic `getAt`/`setAt` against hand-indexed code (1M vertices, must be within 10%). Skipped unless `ANIGRAPH_BENCH=1`.
- [./GeometryBugFixes.test.ts](./GeometryBugFixes.test.ts): Tests for per-vertex uvs, unit and per-face normals, boundary-line indices, uvs from positions, unique vertex-array uids, per-member source transforms, `pointInBounds` with epsilon and transform, and `VertexIndexArray.getAt`/`nElements`.
- [./ModelWrapperTextures.test.ts](./ModelWrapperTextures.test.ts): `AObject3DModelWrapper.getTextures` finds a model's color and normal maps for any material with those slots (including glTF's `MeshStandardMaterial`) and for meshes nested inside groups.
