# DOM Interactions

Interactions in [../](../README.md) are normally bound to one canvas/render-window element, but pointer movement outside the canvas and keyboard input aren't naturally scoped that way — these two classes listen on `document` instead. `ADOMPointerMoveInteraction` tracks pointer position globally and maintains a keyed pointer-state dictionary (useful when a mode needs to know cursor position even when the pointer isn't over the canvas), while `AKeyboardInteraction` listens for `keydown`/`keyup`, keeps a live `keysDownState` map of which keys are currently held, and invokes configurable callbacks — this is what interaction modes like `ADebugInteractionMode` poll for WASD-style continuous movement.

## Contents:
- [./ADOMPointerMoveInteraction.ts](./ADOMPointerMoveInteraction.ts): Interaction class that listens to DOM pointer-move events and fires a callback, maintaining a keyed pointer state dictionary.
- [./AKeyboardInteraction.ts](./AKeyboardInteraction.ts): Interaction class that listens to `keydown` and `keyup` DOM events, tracks which keys are currently pressed in `keysDownState`, and invokes configurable callbacks.
- [./index.ts](./index.ts): Barrel export for the DOM interaction module.