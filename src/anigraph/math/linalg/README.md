# Linear Algebra

The concrete vector and matrix types AniGraph uses everywhere — for positions, directions, colors, transforms, and projections — all build on two shared abstract bases defined directly in this directory. `VectorBase` (decorated `@ASerializable`) implements shared element-wise arithmetic, normalization, dot product, and serialization once, so [./2D/](./2D/README.md)'s `Vec2` and [./3D/](./3D/README.md)'s `Vec3`/`Vec4` don't each reimplement it; `HasLinearOperations` is the minimal `times`/`plus`/`minus` interface those vectors (and other linear-op-supporting types) satisfy. `Matrix` is the equivalent abstract base for matrix types, defining the common arithmetic and point-application contract (`getElement`, `setToIdentity`, `_timesVector`, `_timesMatrix`) that `Mat3` and `Mat4` implement concretely. The 2D and 3D subdirectories then supply the dimension-specific concrete classes, plus (for 3D) `Quaternion` for rotations that don't have a natural 2D equivalent.

## Contents:
- [./2D](./2D/README.md): 2D linear algebra classes: Vec2 and Mat3.
- [./3D](./3D/README.md): 3D linear algebra classes: Vec3 (also used for 2D homogeneous coordinates), Vec4, Mat4, and Quaternion.
- [./HasLinearOperations.ts](./HasLinearOperations.ts): Interface for objects that support scalar multiplication, addition, and subtraction.
- [./index.ts](./index.ts): Re-exports all public symbols from the linalg module.
- [./Matrix.ts](./Matrix.ts): Abstract base class for matrices with arithmetic, cloning, and point-application utilities.
- [./VectorBase.ts](./VectorBase.ts): Base class for all vector types, providing element-wise arithmetic, normalization, dot product, and serialization.
