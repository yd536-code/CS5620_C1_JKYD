# Three Materials

A small home for Three.js material types that don't fit AniGraph's usual GLSL-shader-driven `AShaderModel` pipeline (see [../](../README.md)) because they wrap a specialized Three.js material class instead of a custom shader. `AGLLineMaterial` is the one class here: it re-exports/wraps Three.js's `LineMaterial` (from `three/examples/jsm/lines`, used for width-aware, resolution-dependent line rendering) and defines the `LineMaterialParameters` interface (dashing, line width, resolution, world-space units) needed to configure it. `../shadermodels/ALineShaderModel.ts` is what actually exposes this material through AniGraph's normal `AShaderModel` API, so scene code rarely imports this directly.

## Contents:
- [./AGLLineMaterial.ts](./AGLLineMaterial.ts): Wraps Three.js `LineMaterial` (from `three/examples/jsm/lines`) and defines the `LineMaterialParameters` interface for configuring dashed lines, line width, and resolution.
- [./index.ts](./index.ts): Barrel export for the threeMaterials module.