# __tests__

Jest specs for the data-texture classes and their pixel buffers.

## Contents:
- [./DataTextures.test.ts](./DataTextures.test.ts): Tests `PixelDataFloat1D`/`4D` `CreateBlock`, nearest-neighbor get/set and three.js format/type, and `ADataTextureFloat1D`/`4D` `CreateSolid`/`Create`/`init` (including that Float1D allocates one float per pixel).
- [./ADataTextureUpdates.test.ts](./ADataTextureUpdates.test.ts): Checks that `ADataTexture.setPixelData` can be called again (same size keeps the `THREE.DataTexture`, a new size makes a new one), that `setTextureNeedsUpdate(false)` does nothing, and that `CheckWebGLSupport` uses `renderer.getContext()`.
