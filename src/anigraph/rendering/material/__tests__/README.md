# __tests__

Jest specs for the material module.

## Contents:
- [./MaterialGUIControls.test.ts](./MaterialGUIControls.test.ts): Tests the four control-spec builders (`MaterialGUIControl`/`MaterialGUIColorControl`, `ShaderUniformGUIControl`/`ShaderUniformGUIColorControl`) that share `AMaterialModelBase.GUIControlSpec`, including the truthiness fallback and the uniform path's `'float'` type.
- [./MaterialFixes.test.ts](./MaterialFixes.test.ts): Checks the `AMaterialModel` constructor argument order, `ALineMaterialModel.getMaterialGUIParams` on a plain `AMaterial`, `AShaderMaterial.Clone` copying uniforms and textures, and `setUniformColor`'s `alpha` argument.
- [./ShaderLoadWait.test.ts](./ShaderLoadWait.test.ts): `AShaderModel.ShaderSourceLoaded`/`CreateModel` and `AssetManager.loadShaderMaterialModel` wait for a shader whose files are still downloading, and don't reload a shader that has finished loading.
