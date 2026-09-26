# ShapesAndMaterials nodes

The exhibit wrapper and the exhibits. See the [scene README](../README.md) for a table of what each exhibit shows.

## Contents:
- [./ExhibitModel.ts](./ExhibitModel.ts): Group node that holds one exhibit's content and positions it. When picked, plays a pop sound (`AudioManager`) and runs a pulse animation with the node's own `addTimedAction`, eased with a `BezierTween`.
- [./ColorWheel.ts](./ColorWheel.ts): Factories for the same star as a `PolygonModel2D` (outline only, tessellated by three.js) and as an `AMeshModel2D` triangle fan with explicit indices.
- [./TexturedQuad.ts](./TexturedQuad.ts): Loads an image and builds a `SquareXYUV` quad with a textured material, scaled to the image's aspect ratio.
- [./FlipbookModel.ts](./FlipbookModel.ts): A textured quad that switches between ten images based on the time and a frames-per-second slider.
- [./LayeringModel.ts](./LayeringModel.ts): Group of a flat-colored square and vector Lab Cat (SVG); a slider and a checkbox set Lab Cat's `zValue` and `visible`.
- [./WaveLineModel.ts](./WaveLineModel.ts): A `LineModel2D` whose 40 rainbow-colored points move along a traveling sine wave; a slider sets the line width.
- [./WaveLineView.ts](./WaveLineView.ts): Draws a `WaveLineModel` with an `ALineGraphic` and the shared line material.
- [./MarkedShapeModel.ts](./MarkedShapeModel.ts): A plain pentagon, its own class so it can be paired with `MarkedShapeView`.
- [./MarkedShapeView.ts](./MarkedShapeView.ts): Extends `PolygonView2D` and adds a `VertexMarkerGraphic` at each vertex: a view with several graphic elements.
- [./VertexMarkerGraphic.ts](./VertexMarkerGraphic.ts): A custom graphic element: a small triangle with red, green and blue corners, sharing one geometry and material across instances.
- [./index.ts](./index.ts): Re-exports the classes above.
