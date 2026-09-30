# TutorialSceneComplete nodes

The node models, views and graphic element added by the C1 tutorial, one class per file. Each class's comments name the step that added it.

## Contents:
- [./TutFactories.ts](./TutFactories.ts): Functions that build plain engine nodes with no behavior of their own: squares, a triangle, the marker, a triangle-mesh fan, a textured quad and the SVG. Also loads the texture and SVG, and has the clockwise `RegularPolygon` helper the other classes use.
- [./TutShapeModel.ts](./TutShapeModel.ts): The hexagon at the center: spins with `dt` at a slider-set speed, recolors and changes its number of sides through subscriptions, signals a custom Ping event, pulses with an eased timed action and a sound, and can be highlighted.
- [./TutGroupModel.ts](./TutGroupModel.ts): A group node that turns two squares, and recolors them when asked.
- [./TutPivotModel.ts](./TutPivotModel.ts): A square that rotates about its corner, set as its anchor.
- [./TutFlipbookModel.ts](./TutFlipbookModel.ts): A flipbook: a textured square that switches between ten images over time (optional step).
- [./TutLineModel.ts](./TutLineModel.ts): A zigzag line whose height comes from a slider; moves its points in place and signals the geometry change.
- [./TutLineView.ts](./TutLineView.ts): Draws a `TutLineModel` with an `ALineGraphic`, and rebuilds it when the model's geometry changes.
- [./TutDotsModel.ts](./TutDotsModel.ts): A plain pentagon, its own class so it can have its own view.
- [./TutDotsView.ts](./TutDotsView.ts): A custom view: draws the pentagon as a `PolygonView2D` does, and adds a dot at each vertex.
- [./TutDotGraphic.ts](./TutDotGraphic.ts): A custom graphic element: a small dark hexagon, with one geometry and material shared by every dot.
- [./TutMovableModel.ts](./TutMovableModel.ts): A square moved with W, A, S and D, using held-key motion (velocity times `dt`).
- [./TutNoiseModel.ts](./TutNoiseModel.ts): A circle that drifts around its home position, driven by seeded simplex noise.
- [./TutParticle.ts](./TutParticle.ts): The data for one particle.
- [./TutParticleSystemModel.ts](./TutParticleSystemModel.ts): A small instanced particle system with a fixed set of particles; `fire()` marks the next particle and the next frame emits it (the `t0 = -1` pattern). Emitted particles stay where they were put.
- [./TutParticleSystemView.ts](./TutParticleSystemView.ts): Draws each visible particle as a textured square.
- [./index.ts](./index.ts): Re-exports the classes above.
