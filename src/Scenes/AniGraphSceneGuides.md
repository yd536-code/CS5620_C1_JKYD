# AniGraph scene guidelines: where logic goes

A scene has three kinds of classes: **node models**, a **scene model** and a **scene controller**. These guidelines say which one a piece of code belongs in. For how to create a scene, see the [Creating a Scene](https://www.cs.cornell.edu/courses/cs4620/2026fa/assignments/docs/assignments/c1/creating-a-scene/) page of the C1 docs. For an example that follows these guidelines, see [C1ExampleScenes/ParticlePlayground2D](C1ExampleScenes/ParticlePlayground2D/README.md).

## Node models: anything that can go here should

If logic or setup concerns one node (or a node and its own children), put it in that node's model class, not in the scene. That includes:
- creating its child nodes, materials and geometry. A node can add its own children in its constructor: adding a node to the scene adds its whole subtree.
- loading its assets, in a `static async PreloadAssets()` that the scene model calls
- its per-frame behavior (`timeUpdate`) and its state, such as velocity
- how it responds to input, as methods like `onKeyDown(key)` or `onMoveForward()` that the controller calls
- the control-panel controls it reads (see below)

A node model built this way can be moved to another scene without its behavior being split across files.

## Scene models: interactions between nodes

Reserve the scene model for logic that deals with **dynamic interactions between multiple nodes**, such as collisions, one node following another, or game rules that involve several objects. Beyond that, the scene model only:
- creates the top-level nodes and adds them to the scene (`initScene`)
- calls each node's `PreloadAssets`
- calls the nodes' `timeUpdate` from its own `timeUpdate`
- passes input from the controller to the nodes it concerns

If a block of scene-model code only reads and writes one node, move it into that node's model.

## Scene controllers: input and wiring, not behavior

The controller registers model-view specs, defines interaction modes, and runs the frame loop. **It should defer control logic to models where appropriate.** An input handler should translate the event into a call on a model (`this.model.player.onMoveForward()`, `this.model.onKeyDown(event.key)`) rather than change model state itself. Deciding what a key does to a velocity, or when a particle fires, is model logic.

Keep in the controller the things that really are about input or rendering: focusing the canvas, reading cursor coordinates, choosing interaction modes, and setting the background.

## Control-panel controls: add them in `initAppState`

Add control-panel controls (sliders, color pickers, checkboxes) in the scene model's `initAppState`. It runs before the control panel is first drawn, so every control is there from the start. Controls added later (for example, from `initScene` or a node's constructor) may not fit in the panel. With React StrictMode on (`MainAppConfigs.USE_STRICT_MODE` in `MainApp.tsx`), they are cut off below the visible area, because the panel keeps the height it had when first drawn; StrictMode is off by default.

If a node owns its controls, give it a static function that adds them, for example `static SetAppState(appState)`, and call it from the scene model's `initAppState`. A static function is needed because no node instances exist yet when `initAppState` runs.
