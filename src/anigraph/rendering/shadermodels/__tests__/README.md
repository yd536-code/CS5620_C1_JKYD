# __tests__

Jest specs for the lighting shader models. Every test loads fresh modules (`jest.isolateModules`), because the class-wide "folder added" flags are statics that would otherwise leak between tests, and stubs `AShaderModel.ShaderSourceLoaded` so no shader file is fetched.

## Contents:
- [./DiffuseBlinnPhongModels.test.ts](./DiffuseBlinnPhongModels.test.ts): Tests both `getClassControlSpecGroup` outputs, the add-once bookkeeping of `AddAppState`/`CreateModel` (including subclasses inheriting their ancestor's flag), and `CreateMaterial`'s default uniforms.
- [./TexturedShaderModels.test.ts](./TexturedShaderModels.test.ts): Checks that `ABasicTexturedShaderModel` and `ATerrainShaderModel` pass a uniforms dictionary on to the new material.
