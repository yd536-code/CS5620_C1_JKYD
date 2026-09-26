# Render Target

Support for rendering a scene to a texture instead of directly to the screen, which is what multi-pass rendering (e.g. render-to-texture post-processing, or one pass feeding another) needs. `ARenderTarget` wraps a `THREE.WebGLRenderTarget` (plus an optional depth texture) behind the engine's own `ATexture`/`RenderTargetInterface`, and implements `RenderTargetInterface` from [../../scene/](../../scene/README.md) so a scene controller can treat it uniformly with an on-screen target. `useAsRenderTarget` points the given `THREE.WebGLRenderer` at this target's framebuffer, and `render` is a convenience that does that and then renders a scene/camera pair in one call. `AGLSceneController` and `ASceneViewsAndTargets` (in [../../scene/](../../scene/README.md)) are what actually pair render targets with scene views to build a multi-pass pipeline; this class only handles the framebuffer/texture side.

## Contents:
- [./__tests__/](./__tests__/README.md): Jest specs for `ARenderTarget`.
- [./ARenderTarget.ts](./ARenderTarget.ts): Wraps `THREE.WebGLRenderTarget` and an optional depth texture. Provides `useAsRenderTarget` and `render` methods to redirect rendering to the texture instead of the screen.
- [./index.ts](./index.ts): Barrel export for the rendering/target module.