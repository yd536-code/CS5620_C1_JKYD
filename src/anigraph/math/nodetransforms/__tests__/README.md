# __tests__

Jest specs for the [nodetransforms](../README.md) module's `getMatrix()` composition, checking that the PRSA parameters produce the expected `Mat3`/`Mat4`. `NodeTransform2D.test.js` verifies that a default transform yields the identity matrix, that a position-only transform maps the origin to that position, and that a rotation-only transform rotates a point as expected (e.g. a 90° rotation carrying the x-axis onto the y-axis). `NodeTransform3D.test.js` checks the equivalent `getMatrix()` composition for the 3D, quaternion-based transform, plus `getInverse()` (including an anchor and non-uniform scale) and `clone()`.

## Contents:
- [./MatrixDecomposition.test.ts](./MatrixDecomposition.test.ts): Tests `setWithMatrix`/`FromMatrix`/`TryFromMatrix` for both classes: exact round-trips, the position/anchor options, shear detection, and the once-only warning.
- [./NodeTransform2D.test.js](./NodeTransform2D.test.js): Tests `NodeTransform2D` matrix composition and parameter decomposition.
- [./NodeTransform3D.test.js](./NodeTransform3D.test.js): Tests `NodeTransform3D` matrix composition, parameter decomposition, and `getInverse` (exact with an anchor and non-uniform scale).
