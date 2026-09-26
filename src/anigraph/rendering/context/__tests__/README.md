# __tests__

Jest specs for the members that `ARenderWindow`/`ARenderContext` share across both backends. Both abstract classes are tested by building a fake instance via
`Object.create(Base.prototype)` (the same technique `ASceneView.test.ts` uses) rather than constructing a real
`AGLRenderWindow`/`ATwoJSRenderWindow`, since those pull in `THREE.WebGLRenderer`/`Two` construction that a unit test
for pure bookkeeping has no reason to depend on.

## Contents:
- [./ARenderWindow.test.ts](./ARenderWindow.test.ts): Tests `startRendering`/`stopRendering`, the `aspect` getter (including its container-less default of `1`), and `_registerResizeListener`'s wiring to `sceneController.onWindowResize(self)`.
- [./ARenderContext.test.ts](./ARenderContext.test.ts): Tests `getAspect()`'s `getShape().x / getShape().y` computation.
- [./AGLRenderWindowSaveFrame.test.ts](./AGLRenderWindowSaveFrame.test.ts): Checks that the default frame-save callback downloads the PNG with a temporary link (with `URL.createObjectURL` and the link click mocked), and warns on a null blob.
