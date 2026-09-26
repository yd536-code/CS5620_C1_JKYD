# 2D Linear Algebra Classes

Concrete 2D vector and matrix types, extending the shared [../](../README.md) bases. `Vec2` (extends `VectorBase`) is a plain 2-component vector with arithmetic, normalization, and a helper to lift it into homogeneous form. `Vec3` (also extends `VectorBase`) does double duty as both a general 3-element vector and — when its third component is used as the homogeneous coordinate — a 2D point or direction in homogeneous coordinates, which is what lets `Mat3` (extends `Matrix`, implements `TransformationInterface`) represent 2D affine transforms (translation, rotation, scale, and inverse) as ordinary 3x3 matrix-vector multiplication. This is the 2D counterpart to [../3D/](../3D/README.md); node transforms for 2D scene nodes (see [../../nodetransforms/](../../nodetransforms/README.md)) are built from these types.

## Contents:
- [./__tests__/](./__tests__/README.md): Unit tests for the 2D linear algebra classes.
- [./index.ts](./index.ts): Re-exports Vec2, Vec3, and Mat3.
- [./Mat3.ts](./Mat3.ts): 3x3 matrix class for 2D affine transformations, including translation, rotation, scale, and inverse.
- [./Vec2.ts](./Vec2.ts): 2D vector class with arithmetic, normalization, and conversion to homogeneous coordinates.
- [./Vec3.ts](./Vec3.ts): 3-element vector used for both 3D vectors and 2D homogeneous points.
