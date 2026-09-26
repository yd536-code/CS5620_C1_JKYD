# Rendering Context

Rendering context and render window management. `ARenderContext` and `ARenderWindow` are backend-agnostic abstract bases; the `AGL*` classes implement them for Three.js/WebGL and the `ATwo*` classes for Two.js (SVG/canvas).

## Contents:
- [./__tests__/](./__tests__/README.md): Tests for the shared members of `ARenderWindow`/`ARenderContext`, and for saving a frame.
- [./ARenderContext.ts](./ARenderContext.ts): Abstract render context base — DOM element, size queries, clear color. Implemented by `AGLContext` and `ATwoJSContext`. `getAspect()` is implemented here (`getShape().x / getShape().y`) and shared by both backends.
- [./ARenderWindow.ts](./ARenderWindow.ts): Abstract render window base — owns a context, a scene controller, and a DOM container, and controls the render loop (`startRendering`/`stopRendering`; `render`/`setContainer` stay abstract, backend-specific). The members both backends share live here: `isRendering`, the context/scene-controller/container storage and getters, `aspect`, and the window-resize listener registration (`_registerResizeListener`).
- [./AGLContext.ts](./AGLContext.ts): Wraps `THREE.WebGLRenderer` with convenience methods for viewport queries, pixel ratio, and rendering. Initialized with configurable WebGL parameters. `clearBuffers`/`setScissor`/`setScissorTest` support `../../scene/ARenderPass.ts` rendering more than one viewport into the same canvas without one pass's clear erasing another's pixels.
- [./AGLRenderWindow.ts](./AGLRenderWindow.ts): Connects an `AGLContext` to an HTML DOM element and a scene controller. Manages the render loop, handles window resize, and supports single-frame screenshot capture.
- [./ATwoJSContext.ts](./ATwoJSContext.ts): Render context wrapping a Two.js renderer instance (SVG by default). Background color is applied as CSS on the DOM element; the live `Two` instance is public for view code.
- [./ATwoJSRenderWindow.ts](./ATwoJSRenderWindow.ts): Render window for Two.js scenes. Drives the animation loop via `requestAnimationFrame`, calling the controller's frame callback and then `two.update()` exactly once per frame.
- [./ARenderDelegate.ts](./ARenderDelegate.ts): Interface defining the contract a scene controller must implement to serve as the render loop delegate (`initRendering`, `onAnimationFrameCallback`, `onWindowResize`).
- [./index.ts](./index.ts): Barrel export for the rendering context module.
