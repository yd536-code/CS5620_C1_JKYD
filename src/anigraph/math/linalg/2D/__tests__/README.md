# __tests__

Jest specs for the [2D linear algebra classes](../README.md), using the custom `VecCloseTo`/`MatrixCloseTo` matchers from [../../../test/](../../../test/README.md) to compare floating-point vectors and matrices with tolerance. `Mat3.test.js` checks the `Mat3` transform factories (`Identity`, `Translation2D`, `Rotation`, `Scale2D`) individually and composed together against known geometric results (e.g. rotating `(1,0,0)` by 90° lands on `(0,1,0)`). `Vec2.test.js` and `Vec3.test.js` cover basic vector arithmetic, normalization, and — for `Vec3`, which doubles as a 2D homogeneous point/vector type — homogeneous-coordinate behavior.

## Contents:
- [./Mat3.test.js](./Mat3.test.js): Tests `Mat3` construction, composition, inverse, and `setPosition`.
- [./Vec2.test.js](./Vec2.test.js): Tests `Vec2` arithmetic and normalization.
- [./Vec3.test.js](./Vec3.test.js): Tests `Vec3` arithmetic and homogeneous-coordinate behavior, and `VectorBase.RandomVector` with and without a range.
