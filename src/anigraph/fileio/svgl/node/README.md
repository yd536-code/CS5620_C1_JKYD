# SVGL Node

This is the model/view/graphic triple that lets a loaded `SVGLAsset` (see [../](../README.md)) actually appear as a node in a scene, following the same pattern as any other node type in [../../../scene/](../../../scene/README.md). `ASVGLModel2D`/`ASVGLModel3D` are 2D/3D scene-node models that hold an `SVGLAsset` and provide `FromAsset`/`LoadFromSVGL` factory methods so scenes don't have to drive the SVG-loading pipeline manually. `ASVGLView` creates an `ASVGLGraphic` from the model's asset on init and copies the model's transform to the view whenever the model's transform changes (or `update()` runs). `ASVGLGraphic` is the graphic group that actually wraps the converted `THREE.Object3D`; it supports overriding the color of individual named elements from the original SVG by traversing the resulting mesh hierarchy and matching names, which is how a scene can, e.g., recolor one shape from an imported vector illustration without editing the source file.

## Contents:
- [./ASVGLGraphic.ts](./ASVGLGraphic.ts): Graphic group that wraps a Three.js `Object3D` built from an SVG asset. Supports per-named-element color overrides by traversing the mesh hierarchy.
- [./ASVGLModel2D.ts](./ASVGLModel2D.ts): 2D scene node model (`ANodeModel2D`) holding an `SVGLAsset`. Provides factory methods `FromAsset` and `LoadFromSVGL`.
- [./ASVGLModel3D.ts](./ASVGLModel3D.ts): 3D scene node model (`ANodeModel3D`) equivalent of `ASVGLModel2D`, for placing SVG art in 3D scenes.
- [./ASVGLView.ts](./ASVGLView.ts): View that creates an `ASVGLGraphic` from the model's `SVGLAsset` and copies the model's transform to the view on transform updates.
- [./index.ts](./index.ts): Barrel export for the svgl/node module.
