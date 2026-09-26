# FileIO tests

Jest tests for the fileio module. File loading is mocked (`ATexture.LoadAsync` and the Three.js loaders' `load`
methods), so these tests don't read real image or model files.

## Contents:
- [./AAssetManager.test.ts](./AAssetManager.test.ts): `AssetManager.loadTexture` caching by name (same name and path reuses the texture; `forceReload` or a new path reloads; overlapping loads share one file load) and the embedded textures `createModelFromAsset` sets on a material.
- [./AModelLoader3D.test.ts](./AModelLoader3D.test.ts): `AModelLoader3D` with mocked loaders: `_LoadFromPath` resolves after loading (and rejects on errors), all loaders accept .gltf, and `computeVertexNormals` is honored.
