# Lights

A small model/view hierarchy for lighting a 3D scene, mirroring the pattern used elsewhere in `scene/`: an abstract base (`ALightModel3D`/`ALightView3D`) with concrete point-light subclasses. `ALightModel3D` (extends `ANodeModel3D`, so lights are themselves scene nodes with a transform/position) holds reactive `intensity` and `color` state and a default Leva GUI control spec for `intensity`, so any light automatically gets a slider in the control panel. `APointLightModel3D`/`APointLightView3D` add `distance` (range) and `decay` (falloff rate) and wrap a real `THREE.PointLight`, syncing intensity/color/position/distance/decay from the model each frame. `AVisiblePointLightModel3D`/`AVisiblePointLightView3D` extend that further with a `radius` field and render a small sphere graphic at the light's position in addition to the actual Three.js light, so the light source itself is visible in the rendered scene (useful for debugging or stylized scenes) rather than being an invisible point.

## Contents:
- [./__tests__/](./__tests__/README.md): Jest tests for the light views.
- [./ALightModel3D.ts](./ALightModel3D.ts): Abstract base light model (`ANodeModel3D`) with reactive `intensity` and `color` state and a default GUI control spec.
- [./ALightView3D.ts](./ALightView3D.ts): Abstract base light view.
- [./APointLightModel3D.ts](./APointLightModel3D.ts): Point light model with configurable `distance` (range) and `decay` (falloff rate) on top of the base light properties.
- [./APointLightView3D.ts](./APointLightView3D.ts): View that wraps a `THREE.PointLight` and syncs intensity, color, position, distance, and decay from the model.
- [./AVisiblePointLightModel3D.ts](./AVisiblePointLightModel3D.ts): Point light model variant that also carries a `radius` field for rendering a visible sphere at the light's position.
- [./AVisiblePointLightView3D.ts](./AVisiblePointLightView3D.ts): View for visible point lights that renders both the Three.js light and a small sphere graphic.
- [./index.ts](./index.ts): Barrel export for the lights module.