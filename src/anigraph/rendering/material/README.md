# Material

Material and shader model infrastructure: abstract base classes, concrete material types, managers, and shader source loading. The two are deliberately separate: `AMaterialModel` is a *template* for a class of materials (default parameters, which GLSL shader it uses, a `materialClass` constructor reference), created once and registered by name in `AMaterialManager`; `AMaterial` is an *instance* of that template with its own uniform values, wrapping a real `THREE.Material`. `AMaterial.setValue`/`setValues` signal its `UPDATE` event; the `CHANGE` event is signaled by a node model when its material is replaced. Other setters (`setRenderSide`, `setBlendingMode`, `AShaderMaterial.setUniform`) signal nothing. `AShaderModel`/`AShaderMaterial` specialize that pair for GLSL-shader-backed materials specifically — `AShaderModel` manages loading vertex/fragment source via `ShaderManager` (see Background Notes below) and building uniform dictionaries, while `AShaderMaterial` exposes typed `getUniformValue`/`setUniform`/texture-binding helpers on top of a live `THREE.ShaderMaterial`. Everything in [./shadermodels/](./shadermodels/README.md), [./threeMaterials/](./threeMaterials/README.md), and the lighting models in [../shadermodels/](../shadermodels/README.md) is built on these four classes.

## Contents:
- [./__tests__/](./__tests__/README.md): Tests for the material GUI-control builders, material fixes, and waiting for shader files to load.
- [./shadermodels/](./shadermodels/README.md): Utility shader models (the wide-line shader model).
- [./threeMaterials/](./threeMaterials/README.md): Thin wrappers around Three.js built-in material types used by the AniGraph material system.
- [./ALineMaterialModel.ts](./ALineMaterialModel.ts): Built-in material model for wide, screen-space lines (`DefaultMaterials.LineMaterial`); builds Three.js's `LineMaterial` with per-vertex colors.
- [./AMaterial.ts](./AMaterial.ts): Base material class wrapping a `THREE.Material` and an `AMaterialModel`. `setValue`/`setValues` signal `UPDATE`; defines the `CHANGE`/`UPDATE` event names; exposes a static `Clone`.
- [./AMaterialManager.ts](./AMaterialManager.ts): Manages a registry of named material model instances and provides helpers for creating materials from registered models.
- [./AMaterialModel.ts](./AMaterialModel.ts): Abstract base model for materials, tracking shared parameters and a `materialClass` constructor reference.
- [./AShaderMaterial.ts](./AShaderMaterial.ts): Shader-specific material subclass exposing `getUniformValue`, `setUniform`, texture helpers, and color uniform setters.
- [./AShaderModel.ts](./AShaderModel.ts): Abstract shader model base that manages GLSL source loading, uniform dictionaries, texture binding, and material creation. `AShaderModel` also exposes `getInstanceControlSpecGroup()` (this model's own instance-level control-panel controls, lazily created -- `AddInstancesControlToGUI(folder_name?)` registers it once, then each per-material-instance control gets added as its own nested subgroup, e.g. via `getInstanceControlSpecGroup().addControlSpecGroup(instanceName, {})`) and a default-`undefined` `static getClassControlSpecGroup()` that `ABasicDiffuseShaderModel`/`ABlinnPhongShaderModel` (in [../shadermodels/](../shadermodels/README.md)) override -- the same two-hook convention `ANodeModel` uses (see `../../scene/nodeModel/README.md`), applied independently here since `AShaderModel` doesn't extend `ANodeModel`.
- [./MaterialConstants.ts](./MaterialConstants.ts): Enum/constants for default material names and shared material parameter defaults.
- [./ShaderManager.ts](./ShaderManager.ts): Loads GLSL shader source files (`AShaderProgramSource`) asynchronously and keeps them by name. `LoadShader` reloads and replaces the source on every call, which is handy while editing shaders; check `GetShaderSource` first to skip reloading.
- [./index.ts](./index.ts): Barrel export for the material module.

---

### Serialization
`AMaterial`/`AShaderMaterial` (and `ATexture`, in [../ATexture.ts](../ATexture.ts)) are `@ASerializable`, but — because they wrap a live `THREE.Material`/`THREE.Texture` — serialize as an *asset reference* (the registered model name, plus per-instance uniform/texture overrides) rather than a field dump of the live resource, via their own `toJSON`/`fromJSON` pairs. See [../../base/aserial/GUIDE.md](../../base/aserial/GUIDE.md)'s "Asset-reference serialization" section for the full design and its stated limitations, including a short Save/Load example.

## Background Notes

### Loading GLSL code from files with AssetManager.shaders (ShaderManager)
`AssetManager.shaders` is a singleton `AShaderSourceManager`. Load a shader with:
```typescript
AssetManager.shaders.LoadShader(SHADER_NAME);
```
This loads `public/shaders/<SHADER_NAME>/<SHADER_NAME>.vert.glsl` and `.frag.glsl` and returns a `Promise<AShaderProgramSource>`.

### AMaterialModels and AMaterials
`AMaterialModel` is a template for a class of materials (shared uniforms, defaults). `AMaterial` is an instance with its own uniform values. The underlying `THREE.Material` is created by calling the model's `CreateMaterial` method.
