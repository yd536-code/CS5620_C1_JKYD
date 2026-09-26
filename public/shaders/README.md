# Shaders

GLSL shader programs loaded at runtime by `ShaderManager` (see `src/anigraph/rendering/material/ShaderManager.ts`). Each subdirectory `NAME` contains a `NAME.vert.glsl` / `NAME.frag.glsl` pair, loaded with:

```typescript
AssetManager.shaders.LoadShader(SHADER_NAME);
```
