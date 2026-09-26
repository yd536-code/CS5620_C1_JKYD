# Scene Interaction Modes

The base interaction mode used by scene controllers. This lives in `scene/` (rather than `starter/interactionmodes/`) so that both Three.js and Two.js scene controllers can use interaction modes; the old `starter/interactionmodes` import path still works via a re-export. `ASceneInteractionMode` extends `AInteractionMode` from [../../interaction/](../../interaction/README.md) and does the wiring most "player controls" style modes need: it sets up drag, click, right-click, wheel, mouse-move, and keydown/keyup interactions against the owning `ASceneController`'s DOM element, then dispatches each to a same-named, no-op-by-default overridable method (`onDragStart`, `onKeyDown`, `onWheelMove`, etc.) — subclasses like `ADebugInteractionMode` in [../../starter/interactionmodes/](../../starter/interactionmodes/README.md) just override the callbacks they care about rather than re-registering interactions from scratch.

## Contents:
- [./ASceneInteractionMode.ts](./ASceneInteractionMode.ts): Base scene interaction mode extending `AInteractionMode`. Sets up standard mouse (drag, click, wheel, right-click) and keyboard (keydown/keyup) interactions and wires them to overridable callback methods.
- [./index.ts](./index.ts): Barrel export for the scene interactionmodes module.
