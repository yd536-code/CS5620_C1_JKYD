# Polygon 2D

The basic filled-shape node used throughout the C1 (2D) course assignments and examples — many custom 2D nodes in course scenes subclass `PolygonModel2D` rather than `ANodeModel2D` directly. `PolygonModel2D` wraps a `Polygon2D` vertex array (from [../../../geometry/](../../../geometry/README.md)) as its geometry, inherits `zValue` (draw order/depth) from `ANodeModel2D`, and stores its transform as a `NodeTransform2D` by default (position/rotation/scale/anchor parameters; call `convertTransformToMatrix()` on an instance, or construct it with a `Mat3`, if you want a raw `Mat3` instead — see [../../../scene/nodeModel/](../../../scene/nodeModel/README.md)). `PolygonView2D` renders it via an `APolygonGraphic2D` (see [../../../rendering/](../../../rendering/README.md)), syncing the graphic's geometry and 2D transform to the model each frame.

## Contents:
- [./__tests__](./__tests__/README.md): Jest specs for `zValue` in the polygon's render matrix.
- [./PolygonModel2D.ts](./PolygonModel2D.ts): 2D polygon node model using a `Polygon2D` vertex array. Provides vertex-manipulation helpers.
- [./PolygonView2D.ts](./PolygonView2D.ts): View that renders the polygon using `APolygonGraphic2D` and syncs geometry and 2D transform each frame.
- [./index.ts](./index.ts): Barrel export for the polygon2D module.
