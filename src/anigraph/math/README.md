# AniGraph Math Library

This is the backend-agnostic numeric foundation everything else in AniGraph is built on — [../geometry/](../geometry/README.md), [../scene/](../scene/README.md), and both rendering backends all consume these types rather than raw arrays or `THREE.*` math classes directly (though several types do interoperate with Three.js under the hood). [./linalg/](./linalg/README.md) supplies the base vector/matrix classes and their concrete 2D/3D specializations; [./nodetransforms/](./nodetransforms/README.md) builds the position/rotation/scale/anchor parameterization scene-graph nodes use on top of those; [./camera/](./camera/README.md) builds perspective/orthographic camera projection math on top of those same matrix types. `Color` (in this directory, extending `VectorBase` so it shares the same arithmetic/serialization machinery as vectors) is the RGBA color type used for materials and vertex colors, with conversions to/from Three.js colors, HSV, hex strings, and the `tinycolor` library. `Precision` centralizes the epsilon values and clamping/comparison helpers that vector and matrix `isEqualTo` methods use for tolerant floating-point equality (exercised directly in [./__tests__/](./__tests__/README.md) and indirectly via the matchers in [./test/](./test/README.md)); `Random` provides a seedable RNG for reproducible procedural effects; `TrasnformationInterface.ts` defines the shared 2D/3D transform contract (`NodeTransform` implements it, and `ACamera` uses it as the type of the pose it stores/accepts); and `LaText.ts` is an unrelated utility for turning numeric arrays/matrices into LaTeX strings (e.g. for debugging or generating figures).

## Contents:
- [./camera](./camera/README.md): Camera classes for perspective and orthographic projections in 3D scenes.
- [./linalg](./linalg/README.md): Linear algebra classes including vectors and matrices for 2D and 3D operations.
- [./nodetransforms](./nodetransforms/README.md): Node transform classes that represent scene-graph transformations as decomposed position, rotation, scale, and anchor.
- [./test](./test/README.md): Test helpers and custom Jest matchers for math types.
- [./__tests__/](./__tests__/README.md): Unit tests for the math module.
- [./Color.ts](./Color.ts): RGBA color class extending VectorBase, with conversions to/from Three.js, HSV, hex, and tinycolor formats.
- [./index.ts](./index.ts): Re-exports all public symbols from the math module.
- [./LaText.ts](./LaText.ts): Utility class for generating LaTeX math strings from numeric arrays and matrices.
- [./Precision.ts](./Precision.ts): Numeric precision constants and helpers for floating-point comparisons and epsilon clamping.
- [./Random.ts](./Random.ts): Seeded random number generator (`SeededRandom`) and a shared default `Random` instance.
- [./TrasnformationInterface.ts](./TrasnformationInterface.ts): Interfaces defining the contract for 2D and 3D transformation objects (matrix, position, quaternion rotation).
