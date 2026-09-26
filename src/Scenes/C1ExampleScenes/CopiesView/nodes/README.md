# CopiesView nodes

## Contents:
- [./RowOfCopiesModel.ts](./RowOfCopiesModel.ts): The model: a base shape, the parameters (number of copies, spacing, two colors, wave), `getTransformForCopy(i)` and `getColorForCopy(i)`, the custom `PARAMS_CHANGED` event, and drag-by-delta.
- [./RowOfCopiesView.ts](./RowOfCopiesView.ts): The view: one `APolygonGraphic2D` per copy, rebuilt when the number of copies changes and updated in place (transform, z value and material color) whenever the parameters change.
- [./index.ts](./index.ts): Re-exports both classes.
