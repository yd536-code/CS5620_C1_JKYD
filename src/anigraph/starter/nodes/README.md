# Starter Nodes

A grab-bag library of ready-to-use (and ready-to-subclass) node model/view pairs, each covering one common scene-building need so course scenes don't have to build simple things from scratch. There's no shared base class tying these together beyond the usual `ANodeModel`/`AGLNodeView` pattern from [../../scene/](../../scene/README.md); each subdirectory is independent, ranging from simple diagnostic nodes (`rgbatestmesh`) and debug visualizations (`coordinateaxes`) to fuller building blocks meant to be extended directly by student/course code (`polygon2D`, `textured`, `character`, `terrain`, `instancedparticlesystem2d`) and one utility view mixin (`materialcopyview`) that isn't a node type at all.

## Contents:
- [./backgroundquad/](./backgroundquad/README.md): Background quad node that automatically fills the camera frustum.
- [./character/](./character/README.md): Character model/view with a dedicated shader supporting per-character coloring and loaded character variants.
- [./coordinateaxes/](./coordinateaxes/README.md): Coordinate axes node for visualizing local coordinate frames.
- [./instancedparticlesystem2d/](./instancedparticlesystem2d/README.md): Starter instanced 2D particle system model and view.
- [./materialcopyview/](./materialcopyview/README.md): Abstract view base that renders using a private copy of the model's material.
- [./polygon2D/](./polygon2D/README.md): 2D polygon model/view with optional PRSA transform and texture support.
- [./rgbatestmesh/](./rgbatestmesh/README.md): Test mesh node with per-vertex RGBA colors for shader debugging.
- [./terrain/](./terrain/README.md): Height-map terrain model/view with diffuse and height textures.
- [./textured/](./textured/README.md): Textured 2D polygon model/view.
- [./index.ts](./index.ts): Barrel export for the starter nodes module.