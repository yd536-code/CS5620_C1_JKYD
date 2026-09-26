# Scene Nodes

These are the concrete, ready-to-use node types built on the abstract bases in [../nodeModel/](../nodeModel/README.md) and [../nodeView/](../nodeView/README.md) — most scenes assemble themselves out of these rather than subclassing the base node model/view classes directly. [./2d/](./2d/README.md) covers 2D primitives (lines, curves, flat meshes); [./trianglemesh/](./trianglemesh/README.md) is the general-purpose procedural 3D mesh type; [./loaded/](./loaded/README.md) wraps externally-loaded 3D assets from [../../fileio/](../../fileio/README.md); and [./unitquad/](./unitquad/README.md) is a minimal flat-rectangle node for backgrounds and screen-space effects. Every one of these follows the same model/view split as the rest of the scene graph: the model holds data (a vertex array and/or loaded objects, plus a transform), and a paired view turns that data into a `THREE.Object3D` via a graphic class from [../../rendering/](../../rendering/README.md).

## Contents:
- [./2d/](./2d/README.md): 2D node types: lines, curves, 2D meshes, and 2D vector graphics.
- [./loaded/](./loaded/README.md): Model and view for scene nodes backed by externally loaded 3D assets.
- [./trianglemesh/](./trianglemesh/README.md): General-purpose 3D triangle mesh model and view.
- [./unitquad/](./unitquad/README.md): Unit quad model and view for full-screen or background quad rendering.
- [./index.ts](./index.ts): Barrel export for the nodes module.