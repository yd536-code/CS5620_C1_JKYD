# Rendering Image

This directory is for textures whose contents come from procedurally-generated or CPU-computed pixel data, as opposed to an image file loaded from disk (that's `ATexture` in [../](../README.md)). `ADataTexture<T>` is the base class: it wraps a `THREE.DataTexture`, delegates `width`/`height`/`nChannels` to a [./pixeldata/](./pixeldata/README.md) buffer it owns, and uploads that buffer to the GPU when `needsUpdate` is set. `setPixelData` sets it for you; after editing pixels with `setPixelNN`, call `setTextureNeedsUpdate()` yourself (so many edits cost one upload). `ADataTextureFloat1D` and `ADataTextureFloat4D` are the concrete single-channel and RGBA float variants, backed by the matching `PixelDataFloat1D`/`PixelDataFloat4D` classes.

## Contents:
- [./pixeldata/](./pixeldata/README.md): Raw pixel buffer types (`PixelData`, `PixelDataFloat1D`, `PixelDataFloat4D`) that back data textures.
- [./__tests__/](./__tests__/README.md): Tests for the Float data textures and for re-setting pixel data.
- [./ADataTexture.ts](./ADataTexture.ts): Base data texture class extending `ATexture`. Wraps a `THREE.DataTexture` and uploads a `PixelData` buffer to the GPU when `setTextureNeedsUpdate()` is called.
- [./ADataTextureFloat1D.ts](./ADataTextureFloat1D.ts): Single-channel float data texture backed by `PixelDataFloat1D`.
- [./ADataTextureFloat4D.ts](./ADataTextureFloat4D.ts): RGBA float data texture backed by `PixelDataFloat4D`.
- [./index.ts](./index.ts): Barrel export for the rendering/image module.