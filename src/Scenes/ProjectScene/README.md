# StarterScene

The scene to copy when you start your own. It is as small as it can be while still showing every piece of a scene once: one node model with its own controls, a custom view for it, a thin scene model, and a thin controller.

**What you see:** a blue hexagon that spins. The **StarterSpinSpeed** slider sets how fast (negative spins the other way), and **StarterShapeColor** sets its color. Click anywhere to move it there; the arrow keys nudge it (click the canvas first so it receives key presses).

## How to make your own scene from this one
1. Copy this folder and rename it, along with the classes in it (`ProjectSceneModel` → `MySceneModel`, and so on).
2. Replace `ProjectShapeModel`/`ProjectShapeView` with your own node models and views. Give every model class `@ASerializable("SomeUniqueName")` and every view class `@ALabel("SomeName")`.
3. For each node model class: add its controls in a `static SetAppState`, its files in a `static async PreloadAssets`, and call both from the scene model. Register its view in the controller's `initModelViewSpecs`.
4. In `../../MainApp.tsx`, make your scene the active `import AppClasses from "./Scenes/..."` line.

See the [Creating a Scene](https://www.cs.cornell.edu/courses/cs4620/2026fa/assignments/docs/assignments/c1/creating-a-scene/) page of the C1 docs for the full walkthrough of this scene, and [`../AniGraphSceneGuides.md`](../AniGraphSceneGuides.md) for where each kind of code belongs.

## How the scene is organized
```
ProjectSceneController   pairs models with views, forwards keys and clicks, runs the frame loop
        │  onKeyDown(key), onClick(worldPoint), timeUpdate(t)
        ▼
ProjectSceneModel        creates the shape and forwards to it
        │
        ▼
ProjectShapeModel        ← the behavior: spins, moves, recolors; owns its controls
   drawn by ProjectShapeView
```

## Contents:

[//]: # (- [./nodes]&#40;nodes/README.md&#41;: The example node model and its custom view.)

[//]: # (- [./ProjectSceneModel.ts]&#40;ProjectSceneModel.ts&#41;: Thin scene model. Adds the shape's controls, loads its assets, creates it, and forwards time, keys and clicks to it.)

[//]: # (- [./ProjectSceneController.ts]&#40;ProjectSceneController.ts&#41;: Thin scene controller. Sets the background, registers the view spec, forwards keyboard and click input &#40;in world coordinates&#41;, and runs the frame loop.)

[//]: # (- [./index.ts]&#40;index.ts&#41;: Exports the scene model and controller for `MainApp.tsx`.)
