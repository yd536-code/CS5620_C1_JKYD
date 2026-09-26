# __tests__

Jest specs for the [3D linear algebra classes](../README.md), using the custom `VecCloseTo`/`MatrixCloseTo` matchers from [../../../test/](../../../test/README.md) for tolerant floating-point comparisons. `Mat4.test.js` checks the `Mat4` transform factories (`Identity`, `Translation3D`, uniform and non-uniform `Scale3D`) against expected effects on homogeneous points. `Quaternion.test.js` verifies identity behavior and axis-angle rotations (e.g. a 90° rotation about Z mapping the x-axis onto the y-axis) via `appliedTo`. `Vec4.test.js` covers basic `Vec4`/`V4` construction and component access for the 4-element vector used for both 3D homogeneous points and directions.

## Contents:
- [./Mat4.test.js](./Mat4.test.js): Tests `Mat4` construction, composition, transform factories, that `setPosition` writes the translation column, and that `FromEulerAngles` matches three.js's `makeRotationFromEuler`.
- [./QuaternionConvention.test.ts](./QuaternionConvention.test.ts): Pins what each rotation means (direction of rotation, matrices, camera orientation, `LookAt`), and checks the standard / three.js convention: stored x, y, z, w match `THREE.Quaternion`, `times` follows matrix order, and poses round-trip through three.js objects.
- [./Quaternion.test.js](./Quaternion.test.js): Tests `Quaternion` construction, conversions, and `isEqualTo` (all components, `q` equals `-q`).
- [./Vec4.test.js](./Vec4.test.js): Tests `Vec4` arithmetic and homogeneous-coordinate behavior.
