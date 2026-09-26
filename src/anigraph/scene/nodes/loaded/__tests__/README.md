# __tests__

Jest tests for the loaded-model node in [../](../README.md). They use small three.js meshes built in the test in place of a loaded file.

## Contents:
- [./ALoadedModel3D.test.ts](./ALoadedModel3D.test.ts): Checks that `ALoadedModel3D` accepts a `THREE.BufferGeometry` (with and without a material), that `sourceScale` (the constructor argument and in-place edits) reaches the loaded objects and the view's copies, that an asset's own source transform is kept, and that `AGLNodeView.initLoadedObjects(material)` applies the material it is given.
