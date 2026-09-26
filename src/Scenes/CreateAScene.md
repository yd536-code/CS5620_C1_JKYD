# Creating a New Scene in AniGraph

This guide walks through building a scene, using [`C1ExampleScenes/ParticlePlayground2D`](C1ExampleScenes/ParticlePlayground2D/README.md) as the running example: Lab Cat moves with WASD and fires particles with `x`. The code excerpts below are taken from that scene, trimmed for length. For the rules behind where each piece of code goes, see [AniGraphSceneGuides.md](./AniGraphSceneGuides.md).

## The pieces of a scene

AniGraph uses a **model-view-controller** design:

| Piece | Responsibility |
|---|---|
| **Node models** | The things in the scene: their data, their behavior, their assets and their controls. Most of a scene's code lives here. |
| **Node views** | Draw one node model each. They read the model and never change it. |
| **Scene model** | Builds the scene out of node models, and handles interactions *between* nodes. |
| **Scene controller** | Pairs model classes with view classes, forwards input to models, and runs the frame loop. |
| **`index.ts`** | Exports the scene model and controller so `MainApp.tsx` can load them. |

In ParticlePlayground2D, all of the behavior is in one node model, `LabCatParticlePlaygroundModel`. The scene model and controller are each under 100 lines and only connect things.

---

## 1. Choose a base class

| Scene type | Scene model | Scene controller | Example |
|---|---|---|---|
| 2D, Three.js renderer | `AppSceneModel2D` (`anigraph/starter/App2D/`) | `AppSceneController2D` | `C1ExampleScenes/ParticlePlayground2D` |

For C1, every scene uses the 2D Three.js base classes: extend `AppSceneModel2D` and `AppSceneController2D`. (The engine also has Two.js and 3D starter classes in `anigraph/starter/App2DTwoJS/` and `anigraph/starter/App3D/`, but C1 does not use them.)

The renderer is chosen by the controller class: each base controller declares its own `contextType`, and `MainApp.tsx` reads it.

## 2. Lay out the directory

```
src/Scenes/C1ExampleScenes/ParticlePlayground2D/
  README.md
  index.ts
  ParticlePlayground2DSceneModel.ts
  ParticlePlayground2DSceneController.ts
  nodes/
    README.md
    index.ts
    LabCatParticlePlaygroundModel.ts     the node model that holds the scene's behavior
    PlaygroundParticle.ts
    PlaygroundParticleSystemModel.ts
    PlaygroundParticleSystemView.ts
```

Every folder gets a `README.md` with a `## Contents:` list that describes each subdirectory (first) and each file in it.

---

## 3. Write the node models first

Put everything about a node in its model class: its children, materials, assets, per-frame behavior, input responses and control-panel controls. A node written this way can be dropped into another scene unchanged.

```ts
@ASerializable("LabCatParticlePlaygroundModel")   // required on every model class; the label must be unique
export class LabCatParticlePlaygroundModel extends AGroupNodeModel2D {
    static ControlKeys = { MoveSpeed: "LabCatMoveSpeed", Variable1: "variable1", /* ... */ };
    static LabCatSVG: SVGLAsset;

    emitter: ASVGLModel2D;                        // Lab Cat
    particleSystem: PlaygroundParticleSystemModel;
    emitterVelocity: Vec2 = V2(0, 0);

    // Controls. Static, because the scene model calls it from initAppState, before any instance exists (see §4).
    static SetAppState(appState: AppState) {
        appState.addSliderIfMissing(LabCatParticlePlaygroundModel.ControlKeys.MoveSpeed, 5, 0, 20, 0.1);
        appState.addSliderIfMissing(LabCatParticlePlaygroundModel.ControlKeys.Variable1, 0.5, 0, 1, 0.001);
    }

    // Assets. Static, because the scene model calls it before the scene is built.
    static async PreloadAssets() {
        await AssetManager.loadTexture("./images/gradientParticle.png", "GradientParticle");
        LabCatParticlePlaygroundModel.LabCatSVG = await SVGLAsset.Load("./images/svg/LabCatVectorHead.svg");
    }

    constructor() {
        super();
        this.emitter = new ASVGLModel2D(LabCatParticlePlaygroundModel.LabCatSVG);
        this.particleSystem = new PlaygroundParticleSystemModel();
        // ... create the material, set zValues ...

        // A node can add its own children, even before it is in the scene: adding it adds the whole subtree.
        this.addChild(this.emitter);
        this.addChild(this.particleSystem);
    }

    // Input responses. The controller forwards keys here; the model decides what they mean.
    onKeyDown(key: string) {
        const speed = GetAppState().getState(LabCatParticlePlaygroundModel.ControlKeys.MoveSpeed);
        switch (key.toLowerCase()) {
            case "d": this.emitterVelocity.x = speed; break;
            case "a": this.emitterVelocity.x = -speed; break;
            // ...
        }
    }

    // Per-frame behavior.
    timeUpdate(t: number, ...args: any[]) {
        super.timeUpdate(t, ...args);
        // ... move the emitter by emitterVelocity * dt ...
        this.emitter.signalTransformUpdate();   // harmless, but not needed: changing the transform already redraws the view
    }
}
```

A few things this shows:
- **Read controls where they're used.** The model reads `getState(...)` itself when it needs a value, rather than having the scene model copy slider values into it.
- **Signal the changes the engine can't see.** Changing a node's transform (including editing `node.prsa` in place) or its `zValue` redraws its view on its own. Changing its geometry or particles doesn't: after changing geometry, call `signalGeometryUpdate()`, and for a particle system, call `signalParticlesUpdated()`. An extra `signalTransformUpdate()` call is harmless.
- **Many transform changes in one frame?** Each one redraws the views, which is wasted work if only the last is drawn. Set the node's `autoTransformUpdate = false`, make the changes, then call `signalTransformUpdate()` once (or `flushTransformUpdate()`, which works whether automatic updates are on or off).
- **Choose the right base class.** Use `ANodeModel2D` for a node that draws something, `AGroupNodeModel2D` for a node that only groups its children, or an engine class such as `ASVGLModel2D`. `ANodeModel2D` defaults to a `NodeTransform2D` transform (position, rotation, scale, anchor). Use `node.prsa` to read and edit it.
- **Clone vectors you store.** Assigning a `Vec2` or `Color` copies a reference to the same object, not its values. Use `.clone()` when a node should keep its own copy, such as a particle's position taken from the emitter's position.

## 4. Write the scene model

The scene model builds the scene and forwards time and input to its nodes. Put logic here only when it involves **interactions between several nodes**, such as collisions or one node chasing another. ParticlePlayground2D has no such interactions, so its scene model is this, in full:

```ts
export class ParticlePlayground2DSceneModel extends AppSceneModel2D {
    playground!: LabCatParticlePlaygroundModel;

    // 1st: runs before assets load and before the control panel is drawn. Add all controls here.
    initAppState(appState: AppState) {
        super.initAppState(appState);
        LabCatParticlePlaygroundModel.SetAppState(appState);
    }

    // 2nd: load files. Each node model knows what it needs.
    async PreloadAssets(): Promise<void> {
        await super.PreloadAssets();
        await LabCatParticlePlaygroundModel.PreloadAssets();
    }

    // 3rd: build the scene. Adding the playground also adds its children.
    async initScene() {
        this.playground = new LabCatParticlePlaygroundModel();
        this.addNode(this.playground);
    }

    // Every frame (called by the controller). Node timeUpdates are not called automatically.
    timeUpdate(t: number) {
        this.playground.timeUpdate(t);
    }

    onKeyDown(key: string) { this.playground.onKeyDown(key); }
    onKeyUp(key: string) { this.playground.onKeyUp(key); }
}
```

Use `this.addNode(node)` to add a top-level node. **Don't** call `this.addChild` on a scene model: it throws an error. Under a node, use `parent.addChild(child)`.

## 5. Write the scene controller

The controller pairs model classes with view classes and forwards input. The frame loop comes from `AppSceneController2D`, which calls the scene model's `timeUpdate` every frame. **Input handlers should forward to a model, not implement behavior.** This controller doesn't know what any key does:

```ts
export class ParticlePlayground2DSceneController extends AppSceneController2D {
    get model(): ParticlePlayground2DSceneModel {   // typed accessor
        return this._model as ParticlePlayground2DSceneModel;
    }

    async initScene() {
        await super.initScene();              // call super FIRST: it sets the clear color to white
        this.setClearColor(Color.Black());
    }

    initModelViewSpecs() {
        super.initModelViewSpecs();           // keeps the built-in specs (camera, group nodes, ...)
        this.addModelViewSpec(LabCatParticlePlaygroundModel, AGroupNodeView);
        this.addModelViewSpec(PlaygroundParticleSystemModel, PlaygroundParticleSystemView);
        this.addModelViewSpec(ASVGLModel2D, ASVGLView);
    }

    initInteractions() {
        super.initInteractions();             // registers the default pan/zoom mode
        this.createNewInteractionMode("Main", {
            onKeyDown: (event: AInteractionEvent, interaction: AKeyboardInteraction) => this.model.onKeyDown(event.key),
            onKeyUp: (event: AInteractionEvent, interaction: AKeyboardInteraction) => this.model.onKeyUp(event.key),
            onClick: (event: AInteractionEvent) => {
                this.eventTarget.focus();     // without focus, key events never arrive
            },
        });
        this.setCurrentInteractionMode("Main");
    }

    // No frame-loop code: every frame, the base AppSceneController2D calls
    // this.model.timeUpdate(this.model.clock.currentTime) and then renders.
}
```

**Mouse input:** get world coordinates with `this.getWorldCoordinatesOfCursorEvent(event)`, then pass them to a model method:

```ts
onDragMove: (event: AInteractionEvent, interaction: ADragInteraction) => {
    const cursor = this.getWorldCoordinatesOfCursorEvent(event);
    if (cursor) { this.model.onDrag(cursor); }
},
```

Don't compute positions from `event.ndcCursor` scaled by `sceneScale`. 2D scenes have a camera that can pan and zoom, and `getWorldCoordinatesOfCursorEvent` accounts for it.

Two.js scenes register views that extend `ATwoJSNodeView` in the same way, with no cast needed.

## 6. Write the views

Views draw one model each. They read the model and never change it. `PlaygroundParticleSystemView` extends the engine's `InstancedParticleSystemView2D` and fills in two functions, one returning each particle's transform and one returning its color:

Views are rebuilt from the view specs whenever a scene loads, so they aren't saved and don't need `@ASerializable`. Give them `@ALabel` instead. The label becomes the view's three.js object name; if you leave it off, the class name is used.

```ts
@ALabel("PlaygroundParticleSystemView")
export class PlaygroundParticleSystemView extends InstancedParticleSystemView2D<PlaygroundParticle> {
    get2DTransformForParticleIndex(i: number): Mat3 {
        const p = this.model.particles[i];
        return Mat3.Translation2D(p.position).times(Mat3.Scale2D(p.size));
    }
    getColorForParticleIndex(i: number): Color {
        return this.model.particles[i].color;
    }
}
```

For a custom Three.js view from scratch, extend `AGLNodeView`. Create graphics in `init()` and register them with `registerAndAddGraphic`. Apply the model's transform in `update()` with `this.setTransform(this.model.transform)`. For a complete small example, see `anigraph/starter/nodes/polygon2D/PolygonView2D.ts`.

Many nodes need no custom view. ParticlePlayground2D draws Lab Cat with the engine's `ASVGLView` and its group node with `AGroupNodeView`.

## 7. Export the scene and load it

`index.ts`:

```ts
import {ParticlePlayground2DSceneModel} from "./ParticlePlayground2DSceneModel";
import {ParticlePlayground2DSceneController} from "./ParticlePlayground2DSceneController";
const ParticlePlayground2D = {
    SceneModelClass: ParticlePlayground2DSceneModel,
    SceneControllerClass: ParticlePlayground2DSceneController,
    ComponentClass: undefined,   // or a custom React component
}
export default ParticlePlayground2D;
```

In `src/MainApp.tsx`, comment out the active `import AppClasses from ...` line and import yours:

```ts
import AppClasses from "./Scenes/C1ExampleScenes/ParticlePlayground2D"
```

---

## Gotchas

Each of these caused a real bug while ParticlePlayground2D was being built.

| Symptom | Cause and fix |
|---|---|
| `Unsure how to create view for ... with class MyModel` | View specs match the model's **exact** class, not parent classes. A subclass of `AGroupNodeModel2D` doesn't get the default group view. Add `addModelViewSpec(MyModel, ...)` for it. |
| Control-panel sliders are cut off or hidden | Check that `MainAppConfigs.USE_STRICT_MODE` in `MainApp.tsx` is `false` (the default). With React StrictMode on, the panel keeps the height it had when first drawn, so controls added later (in `initScene`, or in a constructor) don't fit. Either way, add controls in the scene model's `initAppState`. |
| Nothing moves | Node models' `timeUpdate` is not called by the scene model automatically; call it from the scene model's `timeUpdate`, as above. (The base 2D controller calls the scene model's `timeUpdate`. If you override `onAnimationFrameCallback`, call `super.onAnimationFrameCallback(context)` and don't call `model.timeUpdate` yourself too.) |
| A node's shape or particles change but aren't redrawn | Geometry and particle changes aren't detected on their own. Call `signalGeometryUpdate()` or `signalParticlesUpdated()`. |
| A node's transform changes but it doesn't move | Transform changes redraw on their own, so the change probably went to a copy. Edit the node's transform through `node.prsa` (it's the live transform), not the deprecated `getTransformAsPRSA()`, which always returns a copy. |
| `node.prsa` throws "This node's transform is a Mat3" | The node was constructed with a `Mat3`, converted with `convertTransformToMatrix()`, or given a sheared matrix by `setTransform` (which also logs a warning). Call `convertTransformToPRSA()` first, or read the transform with `node.transform.getMatrix()`. |
| Keys do nothing | The canvas doesn't have keyboard focus. Call `this.eventTarget.focus()` in `onClick`, and click the canvas. |
| Memory use grows as nodes come and go | `removeChild` only detaches a node so it can be added again later; the scene still keeps track of it. To delete a node, call `release()` on it (before or after removing it). |
| Two objects move together unexpectedly | They share one `Vec2`/`Color` object. Assign `.clone()` instead. |
| Background color setting is ignored | `setClearColor` was called before `super.initScene()`. Call `super` first. |
| Pan and zoom stopped working | Setting your own interaction mode as current replaces the pan/zoom mode. It is still available in the interaction-mode menu. |

## Control panel quick reference

```ts
// In initAppState (or a node's static SetAppState called from it):
appState.addSliderIfMissing("MySlider", initialValue, min, max, step);
appState.addColorControl("MyColor", Color.FromString("#aabbcc"));
appState.addCheckboxControl("MyToggle", false);
appState.setSelectionControl("MyDropdown", "OptionA", ["OptionA", "OptionB"]);
appState.addButton("MyButton", () => { /* ... */ });

// Anywhere (typically in the node model that uses the value):
const value = GetAppState().getState("MySlider");

// To react to changes instead of reading every frame, subscribe from the node that cares:
this.subscribe(GetAppState().addStateValueListener("MySlider", (v: number) => { /* ... */ }), "MySliderSub");
```

## Node hierarchy quick reference

```ts
this.addNode(parent);        // in the scene model: a top-level node, together with its whole subtree
parent.addChild(child);      // child inherits parent's transform; works before or after parent is in the scene
parent.removeChild(child);   // detach, keeping child's views so it can be added again later
child.reparent(newParent);   // move under another node
child.release();             // delete: disposes child, its descendants and their views, attached or not
```

## Checklist

- [ ] Node models hold their own behavior, assets (`static PreloadAssets`) and controls (`static SetAppState`), each with `@ASerializable`
- [ ] The scene model adds controls in `initAppState`, loads assets in `PreloadAssets`, builds the scene in `initScene`, and calls node `timeUpdate`s from its `timeUpdate`
- [ ] Scene-model logic is limited to interactions between nodes
- [ ] The controller registers a view spec for every model class, including subclasses, and forwards input to models (it doesn't call `model.timeUpdate`; the base controller does)
- [ ] `index.ts` exports `SceneModelClass` and `SceneControllerClass`, and `MainApp.tsx` imports it
- [ ] Each folder has a `README.md` with a `## Contents:` list
