# Three.js Backend Adapters

Three.js implementations of the backend-agnostic display interfaces in [../ADisplayObject.ts](../ADisplayObject.ts). Most Three.js rendering code lives elsewhere in `rendering/` (the `AGL*` classes); this directory holds only the adapter layer shared with the Two.js backend abstraction.

## Contents:
- [./AGLDisplayObject.ts](./AGLDisplayObject.ts): Wraps a `THREE.Object3D` as an `ADisplayObject`, exposing visibility, child add/remove, and matrix get/set. `nativeObject` provides direct access to the underlying Three.js object.
