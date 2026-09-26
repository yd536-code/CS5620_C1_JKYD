# Physics

A minimal, unopinionated layer of physics-flavored data types — currently just particle state — that the [../effects/particles/](../effects/particles/README.md) system and course assignments build simulations on top of. It intentionally has no simulation/integration code of its own (no forces, collisions, or solvers); it only defines what a "particle" looks like as data (position, velocity, mass, size) so different particle systems and student-written physics code share a common shape. See [./particles/](./particles/README.md) for the actual type/interface definitions.

## Contents:
- [./particles/](./particles/README.md): Particle interface and concrete 2D/3D particle classes with position, velocity, and mass.
- [./index.ts](./index.ts): Barrel export for the physics module.