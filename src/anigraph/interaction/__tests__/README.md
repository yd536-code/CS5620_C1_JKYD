# __tests__

Jest specs for the [interaction](../README.md) module.

`AInteraction.test.ts` covers `AInteractionEvent.ndcCursorForViewport`: the full-canvas viewport is the identity on `ndcCursor`; a cursor re-normalizes correctly into a sub-viewport's own `[-1, 1]` range; a cursor outside a viewport returns `null`; viewport edges are inclusive; and a degenerate (zero-width or zero-height) viewport never contains the cursor. Uses `AMockInteractionEvent` (constructed with a fake DOM event, since this test environment's jsdom has no global `PointerEvent`) so the underlying `ndcCursor` value is exactly whatever `cursorPosition` the test passes in.

## Contents:
- [./AInteraction.test.ts](./AInteraction.test.ts): Tests `AInteractionEvent.ndcCursorForViewport`'s pass-local NDC re-normalization.
- [./ADragInteraction.test.ts](./ADragInteraction.test.ts): Checks that a drag created with some callbacks missing survives a start/move/end sequence, and that the start cursor is still recorded.
- [./AInteractionMode.test.ts](./AInteractionMode.test.ts): Checks that `AInteractionMode.addInteraction` rejects an already-owned interaction without registering it or switching it on/off.
- [./ADOMInteractionEvent.test.ts](./ADOMInteractionEvent.test.ts): Checks that `ADOMInteractionEvent`'s position getters give coordinates when the event target is an `<svg>` element.
