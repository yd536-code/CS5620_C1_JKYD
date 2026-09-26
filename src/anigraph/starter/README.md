# Starter

This module is what turns the lower-level pieces of AniGraph ([scene](../scene/README.md), [rendering](../rendering/README.md), [geometry](../geometry/README.md), etc.) into something a course assignment or new project can actually build on without re-deriving the whole engine setup. It's layered: [./scene/](./scene/README.md) has the shared, backend-concrete base classes (`ABasicSceneModel`/`ABasicSceneController`) that register default node-view mappings and common scene setup; [./Scene2D/](./Scene2D/README.md), [./App2DTwoJS/](./App2DTwoJS/README.md), and [./Scene3D/](./Scene3D/README.md) each specialize that shared base for one of AniGraph's three supported starting points (2D-on-Three.js, 2D-on-Two.js, and 3D), leaving a small set of abstract methods (camera setup, asset preloading, per-frame update) for a concrete scene to fill in. [./interactionmodes/](./interactionmodes/README.md) supplies working camera navigation that those scene classes wire in by default, [./nodes/](./nodes/README.md) is a library of ready-made node types (polygons, textured surfaces, terrain, characters, particles) for scenes to use directly or subclass, and [./shadermodels/](./shadermodels/README.md) provides a simple textured-material starting point. `ControlPanelExamples.ts` and `ExampleAssets.ts` at the top level are reference code — example GUI-control wiring and a few pre-registered asset entries — rather than classes meant to be extended.

## Contents:
- [./Scene2D/](./Scene2D/README.md): Abstract 2D scene model and controller starter classes (Three.js backend).
- [./App2DTwoJS/](./App2DTwoJS/README.md): Abstract 2D scene model and controller starter classes for the Two.js (SVG/canvas) backend.
- [./Scene3D/](./Scene3D/README.md): Abstract 3D scene model and controller starter classes.
- [./interactionmodes/](./interactionmodes/README.md): Pre-built interaction modes for scene navigation and debugging.
- [./nodes/](./nodes/README.md): Ready-to-use scene node model/view pairs (polygons, terrain, particles, characters, etc.).
- [./scene/](./scene/README.md): Concrete starter scene model and controller base classes.
- [./shadermodels/](./shadermodels/README.md): Starter shader model implementations.
- [./ControlPanelExamples.ts](./ControlPanelExamples.ts): Example function `AddExampleControlPanelSpecs` showing how to add GUI controls to the Leva control panel via `AppState`.
- [./ExampleAssets.ts](./ExampleAssets.ts): Pre-defined asset detail entries (dragon, cat, duck, car, LabCat) for quick loading via `AssetManager`.
- [./index.ts](./index.ts): Barrel export for the starter module.