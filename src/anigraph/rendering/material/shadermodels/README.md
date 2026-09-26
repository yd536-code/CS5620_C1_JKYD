# Material Shader Models

Utility shader models built on the `AShaderModelBase` infrastructure in [../](../README.md), as opposed to the lighting models in [../../shadermodels/](../../shadermodels/README.md). `ALineShaderModel` wires up `AGLLineMaterial` (see [../threeMaterials/](../threeMaterials/README.md)) as an `AShaderModel` so wide, screen-space lines can be created and configured (transparency, double-sided) through the same material system as everything else.

## Contents:
- [./ALineShaderModel.ts](./ALineShaderModel.ts): Shader model for wide line rendering using `AGLLineMaterial` (Three.js `LineMaterial`). Supports configurable transparency and double-sided rendering.
- [./index.ts](./index.ts): Barrel export for the material/shadermodels module.