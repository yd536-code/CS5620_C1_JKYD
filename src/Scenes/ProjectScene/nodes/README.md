# StarterScene nodes

The example node model and view. Replace them with your own; the comments in each say what every part is for.

## Contents:
- [./LightningModel.ts](./LightningModel.ts): Lightning scaffold with a white zigzag shape and a frame-update hook for adding strike timing. Not yet connected to the scene.
- [./LightningView.ts](./LightningView.ts): Draws the lightning line and refreshes it when the model's geometry or colors change.
- [./ProjectShapeModel.ts](ProjectShapeModel.ts): A regular polygon that spins at a slider-set speed, recolors from a color control (by subscribing to it), moves to a clicked point, and is nudged by the arrow keys. Shows `ControlKeys`, `static SetAppState`, `static PreloadAssets`, the constructor, `timeUpdate` with `dt`, and input methods.
- [./ProjectShapeView.ts](ProjectShapeView.ts): A custom `AGLNodeView` that draws the model's vertices with an `APolygonGraphic2D`, rebuilds it when the geometry changes, and applies the model's transform in `update()`.
- [./index.ts](index.ts): Re-exports the classes above.
