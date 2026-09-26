# HierarchyAndAnimation nodes

The node models in this scene. Each one owns its controls (`static SetAppState`) and its behavior. They are all drawn by engine views (`PolygonView2D` for the shapes, `AGroupNodeView` for the group nodes), so there are no custom views here.

## Contents:
- [./SpikyStarModel.ts](./SpikyStarModel.ts): A `PolygonModel2D` star. Spikes, spikiness and color rebuild its geometry through subscriptions; scale and rotation are read every frame in `timeUpdate`. Shows both ways of using a control.
- [./ArmModel.ts](./ArmModel.ts): An `AGroupNodeModel2D` that builds a chain of links in its constructor, each a child of the previous one. Owns the ArmStyle dropdown, the ShowArm checkbox, one rotation slider per link, and link selection and dragging.
- [./ArmLinkModel.ts](./ArmLinkModel.ts): One link of the arm: a pointed hexagon whose anchor is its joint. Can be highlighted, and computes the angle that points it at a world-space point (world → parent coordinates with `getWorldTransform().getInverse()`).
- [./OrbitGroupModel.ts](./OrbitGroupModel.ts): An `AGroupNodeModel2D` with three child polygons around its center. The group turns, carrying them around; `spin()` adds an eased spin with the node's own `addTimedAction` and a `BezierTween`.
- [./index.ts](./index.ts): Re-exports the classes above.
