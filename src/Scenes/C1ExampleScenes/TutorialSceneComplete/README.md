# TutorialSceneComplete

The tutorial scene with every step of the C1 [Tutorial](https://www.cs.cornell.edu/courses/cs4620/2026fa/assignments/docs/assignments/c1/tutorial/) done. Run it to see what each step should look like, or compare it with your own [../TutorialScene](../TutorialScene/README.md) when you get stuck.

It's a workbench of small, separate demos, one per docs section, not a finished application. Each class's comments name the tutorial step that added it.

**Don't import from this folder into your own scene.** Its classes have the same names and labels as the ones you write in `TutorialScene`, and loading both makes them collide. If your IDE offers to auto-import a `Tut...` class from `TutorialSceneComplete`, import it from your own `./nodes` instead.

**To run it:** in `src/MainApp.tsx`, comment out the active `import AppClasses from ...` line and add:
```typescript
import AppClasses from "./Scenes/C1ExampleScenes/TutorialSceneComplete";
```

## What's where

| Where on screen | What | Step |
|---|---|---|
| Center | A hexagon that spins; its speed, color and number of sides come from the control panel | 1.1–3.2, 7.1 |
| Upper right | A group turning two squares; one square has a small white square nested in it | 2.2–2.4 |
| Lower right, above the line | A second group, turning the other way | 2.4 |
| Upper left | A purple square rotating about its corner (its anchor) | 4.1 |
| Left | A triangle placed with a `Mat3` | 4.2 |
| On the nested white square | A small dark marker, placed at the square's world position every frame | 4.3 |
| Far left | A flipbook counting 0 to 9 (optional step) | 6.5 |
| Lower left | A triangle mesh with blended vertex colors | 6.2 |
| Bottom left of center | A textured quad, and the Lab Cat SVG overlapping it | 6.4, 6.6, 6.9 |
| Bottom center | A pentagon drawn by a custom view that adds a dot at each vertex | 6.8 |
| Bottom right | A zigzag line | 6.7 |
| Below the hexagon | A small red square you move with the keys | 8.1, 8.2 |
| Top | A circle that drifts around its spot, driven by noise | 10.1 |

## Controls

Click the canvas first, so it gets key presses.

- **W, A, S, D** move the red square. Drive it onto the hexagon and the hexagon turns yellow (step 8.7).
- **X** leaves a particle where the red square is (step 11.2).
- **Click** the hexagon to make it pulse and pop (steps 7.2, 8.3, 9.1).
- **InteractionMode → Drag**: drag a shape to move it, including a square inside a turning group (step 8.4). The drifting circle and the marker set their own positions every frame, so they snap back. **Pan/Zoom** pans and zooms the camera. **Main** is the mode for keys and clicks.

In the control panel:
- **SpinSpeed**, **ShapeColor**, **ShapeSides**: the hexagon. **ResetSpeed** sets SpinSpeed back to 1, moving the slider (steps 3.1, 3.2).
- **Ping**: the hexagon signals an event, and the upper group recolors its squares (step 3.3).
- **MoveSquare**: takes one of the upper group's squares out of the group, or puts it back, without it jumping (step 2.5).
- **Background**: a plain color or an image (step 6.1).
- **FlipbookFPS**: the flipbook's frame rate (step 6.5).
- **ZigzagHeight**: the line's height (step 6.7).
- **SVGDepth**: moves the SVG in front of or behind the textured quad (step 6.9).
- **ShowGroups**: shows or hides both groups (step 6.10).
- **Pulse**: pulses the hexagon (step 7.2).
- **CameraZoom**, **CenterCamera**: the camera (step 8.6).

## Contents:
- [./nodes](./nodes/README.md): The node models, views and graphic element the tutorial adds.
- [./TutorialSceneModel.ts](./TutorialSceneModel.ts): The scene model. Builds the workbench, forwards time and input to the nodes, owns the scene-wide controls, and handles the few things that involve more than one node (the Ping subscription, reparenting, the world-position marker, the overlap check, where particles are emitted, dragging).
- [./TutorialSceneController.ts](./TutorialSceneController.ts): The scene controller. Applies the background, registers a view for every model class, and defines the Main and Drag interaction modes.
- [./index.ts](./index.ts): Exports the scene model and controller for `MainApp.tsx`.
