# Loaded Scene Nodes

This is the scene-node type for putting an externally-loaded 3D asset (from [../../../fileio/](../../../fileio/README.md)'s `AModelLoader3D`/`AssetManager`) into a scene, as opposed to procedurally-built geometry like [../trianglemesh/](../trianglemesh/README.md). `ALoadedModel3D` (extends `ANodeModel3D`) holds one or more `AObject3DModelWrapper` instances in `loadedObjects` plus a `sourceTransform` that's applied to the loaded geometry before the node's own model transform (so an asset authored at the wrong scale/orientation can be corrected once at load time rather than baked into every placement); `setMaterial` overrides the material on every mesh found by walking the loaded object's Three.js descendants. `ALoadedView3D` creates one `ALoadedElement` graphic per loaded object and forwards the model's material-change events to all of them, since a loaded asset can be made of several separate Three.js meshes under one node.

## Contents:
- [./__tests__/](./__tests__/README.md): Jest tests for loaded-model nodes and their views.
- [./ALoadedModel3D.ts](./ALoadedModel3D.ts): Node model that holds one or more `AObject3DModelWrapper` loaded objects. Supports a `sourceTransform` applied before the model transform, and material overrides.
- [./ALoadedView3D.ts](./ALoadedView3D.ts): View that creates `ALoadedElement` graphics from the model's loaded objects, propagates material change events to all graphics, and copies source-transform changes (e.g. `sourceScale`) into them in `update()`.
- [./index.ts](./index.ts): Barrel export for the loaded nodes module.