# Effects

This is the home for higher-level visual-effect node types built on top of the core scene graph and rendering layers — currently just particle systems (fire, smoke, sparks, and similar effects made of many small moving elements). See [./particles/](./particles/README.md) for the model/view classes and the GPU-instanced rendering path used to draw large particle counts efficiently.

## Contents:
- [./particles/](./particles/README.md): Model, view, and instanced-rendering classes for 2D and 3D particle systems.
- [./index.ts](./index.ts): Barrel export for the effects module.