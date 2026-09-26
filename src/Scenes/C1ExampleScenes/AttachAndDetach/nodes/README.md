# AttachAndDetach nodes

## Contents:
- [./OrbitModel.ts](./OrbitModel.ts): A group node, scaled up 1.5×, that turns every frame. Its children are a planet (a plain `PolygonModel2D`) and five moons.
- [./MoonModel.ts](./MoonModel.ts): A small regular polygon with no behavior. Drawn by the engine's `PolygonView2D`.
- [./index.ts](./index.ts): Re-exports both classes.
