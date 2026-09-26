# 2D Scene Nodes

Concrete `ANodeModel2D`-based node types for 2D scenes, grouped by what geometric primitive they draw: [./lines/](./lines/README.md) covers connected polylines, disconnected line segments, and arrow/vector nodes (all thin wrappers around a `VertexArray2D` plus a `lineWidth`); [./curves/](./curves/README.md) covers spline/curve nodes with switchable linear or cubic-Bezier interpolation; and [./mesh2d/](./mesh2d/README.md) is the catch-all for arbitrary flat polygon geometry that isn't a line or curve. All three follow the same model/view split as the rest of [../../](../../README.md), storing their data in the model's vertex array and delegating actual drawing to a corresponding view/graphic pair in [../../../rendering/](../../../rendering/README.md).

## Contents:
- [./curves/](./curves/README.md): 2D curve/spline model with configurable interpolation modes.
- [./lines/](./lines/README.md): 2D line, line-segments, and vector (arrow) model/view pairs.
- [./mesh2d/](./mesh2d/README.md): General-purpose 2D triangle mesh model and view.
- [./index.ts](./index.ts): Barrel export for the 2D nodes module.