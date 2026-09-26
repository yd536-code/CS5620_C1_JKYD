# HierarchyAndAnimation

Transforms, parent–child relationships in the scene graph, a node that animates itself, and one of each kind of control-panel control.

**What you see:**
- On the left, a **spiky star** with an **articulated arm** of five links hanging off the tip of one spike. The arm is a child of the star, so when you rotate or scale the star, the arm goes with it.
- On the right, three small shapes **orbiting** a center. They are children of a group node, and the group turns, which carries them around. Press **Spin!** and the group winds up backward, spins around twice, overshoots and settles.

**What you can do:**
- **Press a link** of the arm to select it (it turns darker). **Drag** and the selected link points at the cursor; the links after it swing along, and that link's rotation slider follows. Press anywhere else to deselect.
- Use the controls below.

## Control panel
| Control | Kind | Owner | What it does |
|---|---|---|---|
| **StarSpikes** | slider | `SpikyStarModel` | Number of spikes. Rebuilds the geometry through a subscription. |
| **StarSpikiness** | slider | `SpikyStarModel` | How deep the notches between spikes are. Subscription. |
| **StarScale** | slider | `SpikyStarModel` | The star's scale. Read every frame in `timeUpdate`. |
| **StarRotation** | slider | `SpikyStarModel` | The star's rotation. Read every frame. |
| **StarColor** | color | `SpikyStarModel` | The star's color. Subscription. |
| **ArmStyle** | dropdown | `ArmModel` | "Rainbow" gives each link its own hue; "Solid" makes them all one color. |
| **ShowArm** | checkbox | `ArmModel` | Shows or hides the arm (`visible`). |
| **ArmLink0Rotation** … **ArmLink4Rotation** | sliders | `ArmModel` | Each link's angle relative to the link before it. Dragging a link sets its slider. |
| **OrbitRadius** | slider | `OrbitGroupModel` | How far the orbiting shapes are from the group's center. |
| **Spin!** | button | `HierarchyAndAnimationSceneModel` | Calls `orbit.spin()`. |

Each node class adds its own controls in a `static SetAppState(appState)`, which the scene model calls from `initAppState`. The **Spin!** button is the exception: a button calls a method on one particular node, and a static method runs before any node exists, so the scene model adds it (after the node classes' controls) with `appState.addButton("Spin!", ()=>this.orbit?.spin())`.

## How the scene is organized
```
HierarchyAndAnimationSceneController   pairs models with views, forwards presses and drags, runs the frame loop
        │  onPress(pickedNode), onDrag(worldPoint), timeUpdate(t)
        ▼
HierarchyAndAnimationSceneModel        builds the scene graph, adds Spin!, forwards to the nodes
        │
        ├── star: SpikyStarModel           drawn by PolygonView2D
        │     └── arm: ArmModel            AGroupNodeView (draws nothing)
        │           └── link 0: ArmLinkModel      PolygonView2D
        │                 └── link 1 → link 2 → link 3 → link 4
        └── orbit: OrbitGroupModel         AGroupNodeView
              └── three moons: PolygonModel2D     PolygonView2D
```

## Concepts, and where to find them
- **Two ways to use a control:** subscribing (`subscribeToAppState` + `signalGeometryUpdate()`) vs. reading it every frame (`GetAppState().getState(...)` in `timeUpdate`). Both are in [`nodes/SpikyStarModel.ts`](nodes/SpikyStarModel.ts), side by side.
- **Every kind of control:** sliders, a color picker, a dropdown (`setSelectionControl`), a checkbox (`addCheckboxControl`) and a button (`addButton`). See the table above for where each is added.
- **Transforms:** `node.prsa` is a node's live position, rotation, scale and anchor; change them and the view redraws on its own (the scene's `signalTransformUpdate()` calls are harmless; they matter only when a node's `autoTransformUpdate` is off). [`nodes/ArmLinkModel.ts`](nodes/ArmLinkModel.ts) explains what position and anchor mean for a link: `anchor` is the joint in the link's own coordinates, and `position` is where that joint goes in the parent's coordinates.
- **Hierarchy:** `parent.addChild(child)`, children built in a node's own constructor ([`ArmModel.buildChain`](nodes/ArmModel.ts), [`OrbitGroupModel`'s constructor](nodes/OrbitGroupModel.ts)), a subtree attached to another node before `addNode` (the arm under the star, in the scene model's `initScene`), and hiding a whole subtree with `visible`.
- **Group nodes:** `AGroupNodeModel2D` subclasses paired with `AGroupNodeView` ([`ArmModel`](nodes/ArmModel.ts), [`OrbitGroupModel`](nodes/OrbitGroupModel.ts)). Rotating the orbit group moves its children without touching them.
- **Polygon geometry:** building a `Polygon2D` with vertices listed clockwise ([`SpikyStarModel.SpikyGeometry`](nodes/SpikyStarModel.ts), [`ArmLinkModel.LinkGeometry`](nodes/ArmLinkModel.ts)).
- **Picking, dragging, and world-to-local coordinates:** the controller gets the node under the cursor with `getNodeModelAtCursor(event)` and the cursor's world position with `getWorldCoordinatesOfCursorEvent(event)`. [`ArmLinkModel.angleToward`](nodes/ArmLinkModel.ts) brings the cursor into the parent's coordinates with `parent.getWorldTransform().getInverse()`. Selection happens on the press (`onDragStart`) rather than on click, because the browser also sends a click at the end of every drag.
- **A node that animates itself with easing:** [`OrbitGroupModel.spin`](nodes/OrbitGroupModel.ts) calls the node's own `addTimedAction`, which calls a function every frame for two seconds with progress eased by a `BezierTween`. That function sets `spinAngle`, and `timeUpdate` adds `spinAngle` to the steady orbit. The action has a handle, so pressing **Spin!** again mid-spin does nothing.

## Contents:
- [./nodes](./nodes/README.md): The star, the arm and its links, and the orbit group.
- [./HierarchyAndAnimationSceneModel.ts](./HierarchyAndAnimationSceneModel.ts): Scene model. Adds each node class's controls and the Spin! button, builds the scene graph (arm under star), and forwards time, presses and drags.
- [./HierarchyAndAnimationSceneController.ts](./HierarchyAndAnimationSceneController.ts): Scene controller. Sets the background, registers a view spec for every model class, forwards presses (with the picked node) and drags (in world coordinates), and runs the frame loop.
- [./index.ts](./index.ts): Exports the scene model and controller for `MainApp.tsx`.
