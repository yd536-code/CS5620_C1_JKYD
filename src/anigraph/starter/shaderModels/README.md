# Starter Shader Models

A single convenience wrapper around the Blinn-Phong shader model from [../../rendering/shadermodels/](../../rendering/shadermodels/README.md). `StandardTexturedShaderModel` extends `ABlinnPhongShaderModel` and overrides `CreateMaterial` so a caller can optionally pass a `diffuseTexture` argument directly and have it bound to the material's `diffuse` texture slot automatically, rather than creating the material and then setting the texture in a separate step — it's used as the default shader for [../nodes/character/](../nodes/character/README.md) and is a natural starting point for any new starter node that just wants "a lit, optionally-textured surface" without writing a custom shader.

## Contents:
- [./StandardTexturedShaderModel.ts](./StandardTexturedShaderModel.ts): Extends `ABlinnPhongShaderModel` with a `CreateMaterial` override that optionally pre-binds a diffuse texture. Intended as a simple starting point for textured 3D objects.
- [./index.ts](./index.ts): Barrel export for the starter shaderModels module.