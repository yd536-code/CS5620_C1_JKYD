# __tests__

Jest specs for the top-level [math](../README.md) classes that aren't linear-algebra or transform types. `Color.test.js` checks `Color` construction (with and without an explicit alpha, which defaults to 1), the `FromRGBA` factory, and named color factories, using the shared `VecCloseTo` matcher from [../test/](../test/README.md). `Precision.test.js` checks `Precision.isTiny` (including custom-epsilon behavior) and the `ClampAbsAboveEpsilon` helper used to snap near-zero floating-point values, guarding the epsilon-comparison logic that the vector/matrix `isEqualTo` methods elsewhere in this module depend on.

## Contents:
- [./Color.test.js](./Color.test.js): Tests `Color` construction, conversions, and blending, including the 0-255 conversions (`FromString`, `RGBuintAfloat`) and `Color.ThreeJS(string)` keeping r, g, b in order.
- [./LaText.test.js](./LaText.test.js): Tests the `LaText` inline-math delimiters (`beginMath`, `endMath`, `inline`).
- [./Precision.test.js](./Precision.test.js): Tests `Precision` epsilon comparison and clamping helpers.
