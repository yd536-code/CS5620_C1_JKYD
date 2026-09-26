# Loaded Graphics

Graphic elements for displaying assets that came from [../../fileio/](../../fileio/README.md)'s model loaders rather than being built from AniGraph's own vertex-array/geometry classes. `ALoadedElement` is the main one: a graphic group that takes an `AObject3DModelWrapper` (the loader's output), places its already-built Three.js `Object3D` inside the group, and exposes `setMaterial` to override every descendant mesh's material at once — useful since a loaded OBJ/GLTF asset can contain many sub-meshes with their own original materials. `ALoadedBoundsElement` is a debugging aid that renders the same wrapper's computed axis-aligned bounding box as a solid triangle mesh with a random color, so you can check a loaded asset's size and placement.

## Contents:
- [./__tests__/](./__tests__/README.md): Jest specs for `ALoadedElement`.
- [./ALoadedBoundsElement.ts](./ALoadedBoundsElement.ts): Renders the axis-aligned bounding box of a loaded `AObject3DModelWrapper` as a solid triangle mesh with a random color, useful for checking a loaded model's size and placement.
- [./ALoadedElement.ts](./ALoadedElement.ts): Graphic group that wraps a loaded `AObject3DModelWrapper`, placing its Three.js scene object inside the group and exposing `setMaterial` to override all descendant mesh materials.