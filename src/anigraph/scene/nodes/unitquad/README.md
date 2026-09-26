# Unit Quad Scene Node

A minimal node type for the common case of just needing a flat rectangle on screen — full-screen background images, post-processing passes, or billboards — without building a full mesh from scratch. `UnitQuadModel3D` (extends `ANodeModel3D`) has no vertex data of its own to configure; it just holds a `material` and an extra `matrix` (independent of the model's regular transform) that a view composes in before rendering, useful for e.g. UV manipulation or screen-space positioning that shouldn't move the "real" transform. `UnitQuadView3D` builds the actual quad via `AGraphicElement.CreateSimpleQuad` and reapplies the combined model-transform × `matrix` each frame.

## Contents:
- [./UnitQuadModel3D.ts](./UnitQuadModel3D.ts): Node model for a unit quad. Holds a material and an additional `matrix` that is composed with the model transform before rendering.
- [./UnitQuadView3D.ts](./UnitQuadView3D.ts): View that creates a simple quad graphic via `AGraphicElement.CreateSimpleQuad` and applies the combined matrix each frame.
- [./index.ts](./index.ts): Barrel export for the unitquad module.