# __tests__

Jest specs for the drawable graphic elements. Construction is real (`LineMaterial` works under jsdom). The package barrel is imported first to avoid a module-cycle error.

## Contents:
- [./ACoordinateAxesGraphic3D.test.ts](./ACoordinateAxesGraphic3D.test.ts): Tests `ACoordinateAxesGraphic3D`'s segments, colors, line width, `Line2` element, `setLineVerts`, `Create` and `setColors`, plus `ALineSegmentsGraphic.Create`.
- [./GraphicElementFixes.test.ts](./GraphicElementFixes.test.ts): Checks `ALineSegmentsGraphic.onMaterialChange` and subclass `Create`, `AInstancedGraphic` (`setVerts(number[])` throws, `setMatrixAndColorAt` with a `Mat3` or `Mat4`, the `geometry` name), and `APolygonGraphic2D.setTextureMatrix` for 2D/3D/4D positions.
