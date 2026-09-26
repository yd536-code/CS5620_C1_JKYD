# Rendering

Rendering infrastructure: contexts, render windows, graphic objects, materials, shaders, images, and render targets. Most of this module is Three.js-based (the `AGL*` classes), with backend-agnostic abstractions (`ADisplayObject`, `AGraphicObject`, `ARenderContext`, `ARenderWindow`) that are also implemented by the Two.js backend in [./twojs/](./twojs/README.md). Node views (see [../scene/nodeView/](../scene/nodeView/README.md)) consume this module by creating [./graphicelements/](./graphicelements/README.md) instances, which are built from [../geometry/](../geometry/README.md) data and styled with an [./material/](./material/README.md) `AMaterial` — the material's `AShaderModel` in turn owns a shader built from either the general-purpose shaders in [./material/shadermodels/](./material/shadermodels/README.md) or the lighting-focused models in [./shadermodels/](./shadermodels/README.md). [./context/](./context/README.md) owns the actual `THREE.WebGLRenderer`/render loop that draws all of this each frame, optionally redirected to an off-screen [./target/](./target/README.md) for multi-pass effects, and [./image/](./image/README.md) supplies textures generated from CPU-side pixel data rather than loaded from a file.

## Contents:
- [./__tests__/](./__tests__/README.md): Jest specs for the top-level rendering files (`ATexture`, `ThreeJSHelpers`).
- [./context/](./context/README.md): Rendering context and render window management (abstract bases plus Three.js/WebGL and Two.js implementations).
- [./graphicelements/](./graphicelements/README.md): Concrete Three.js graphic element classes for lines, meshes, particles, shapes, and coordinate axes.
- [./graphicobject/](./graphicobject/README.md): The backend-agnostic `AGraphicObject` interface and Three.js base classes (`AGLGraphicObject`, `AGraphicElement`, `AGraphicGroup`, `ASceneElement`).
- [./image/](./image/README.md): Data texture and pixel data classes for GPU image uploads.
- [./loaded/](./loaded/README.md): Graphic elements for wrapping loaded Three.js `Object3D` instances.
- [./material/](./material/README.md): Material and shader model system including `AMaterial`, `AShaderModel`, `AShaderMaterial`, and supporting shader/material managers.
- [./shadermodels/](./shadermodels/README.md): Built-in shader model implementations (diffuse, Blinn-Phong, textured, terrain).
- [./target/](./target/README.md): Render target wrapper for off-screen rendering.
- [./threejs/](./threejs/README.md): Three.js implementation of the backend-agnostic display object interface.
- [./twojs/](./twojs/README.md): Two.js (SVG/canvas) rendering backend — display objects, graphic objects, node/scene views, and 2D graphic elements.
- [./ADisplayObject.ts](./ADisplayObject.ts): Backend-agnostic interface for display hierarchy objects (add/remove children, visibility, matrix). Implemented by `AGLDisplayObject` and `ATwoJSDisplayObject`.
- [./ACameraElement.ts](./ACameraElement.ts): Bridges `ACamera` (math) with a Three.js `THREE.Camera`, implementing `HasThreeJSObject`.
- [./ATexture.ts](./ATexture.ts): Wraps a `THREE.Texture` with a name, URL, and tex-data dictionary; supports loading from URL with repeat-wrapping and error fallback.
- [./ThreeJSHelpers.ts](./ThreeJSHelpers.ts): Utility function `GetDeepTHREEJSClone` for recursively cloning Three.js object hierarchies with independent geometry and material copies.
- [./index.ts](./index.ts): Barrel export for the rendering module.
