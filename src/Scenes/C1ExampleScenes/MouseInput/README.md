# MouseInput

Every kind of mouse input, and **two interaction modes of your own**.

**What you can do.** The scene starts in **Edit** mode:
- **Hover** over a shape to highlight it.
- **Drag** a shape to move it.
- **Shift-drag** a shape to rotate it.
- **Right-click** a shape to delete it.

Choose **Create** in the control panel's **InteractionMode** menu, and a **click** adds a new shape (right-click still deletes). Choose **Edit** to go back. The menu also lists the default Pan/Zoom mode.

## Where the code goes
- **The controller** (`MouseInputSceneController`) defines the two modes. Each mode is a set of callbacks, one per kind of input. Each callback turns the raw event into what the scene model needs: the node under the cursor (`getNodeModelAtCursor(event)`), the cursor in world coordinates (`getWorldCoordinatesOfCursorEvent(event)`), and whether shift is held (`event.shiftKey`).
- **The scene model** (`MouseInputSceneModel`) decides what input does to which shape: which one is hovered, which one is being dragged, what a right click deletes.
- **The shape** (`ShapeModel`) only knows how to be highlighted, moved and rotated.

## The callbacks
| Callback | Runs when | Used for |
|---|---|---|
| `onMouseMove` | the cursor moves over the canvas | hover: pick the node under the cursor and highlight it |
| `onDragStart` | a button is pressed (the start of a possible drag) | remember which shape is under the cursor, and where the drag started |
| `onDragMove` | the cursor moves with a button held | move the shape by how far the cursor moved since the last event (or rotate it, with shift) |
| `onDragEnd` | the button is released | forget the dragged shape |
| `onClick` | a click. **Also sent at the end of every drag** | Create mode: add a shape. (Edit mode has no `onClick`, so ending a drag there does nothing extra.) |
| `onRightClick` | a right click (AniGraph keeps the browser's menu from opening) | delete the shape under the cursor |

## Things to notice
- **Only the active mode's callbacks run.** That's the point of modes: the same click adds a shape in one mode and does nothing in another, without `if(mode === ...)` checks everywhere. The controller creates each mode with `createNewInteractionMode(name, callbacks)` and picks the starting one with `setCurrentInteractionMode(name)`.
- **Drag by a delta, not to the cursor.** `onDrag` moves the shape by `worldPoint - lastDragPoint`, so a shape grabbed near its edge doesn't jump to put its center under the cursor.
- **Picking returns any node.** `getNodeModelAtCursor` returns whatever node is frontmost under the cursor, so `AsShape` checks the class before treating it as a shape.
- **Forget a node before deleting it.** `onRightClick` clears `hovered` and `dragged` if they point at the shape it deletes, so nothing keeps using a deleted node.

## Removing a behavior
| Behavior | Code | Also remove |
|---|---|---|
| Hover | `onHover`, `ShapeModel.setHovered`/`Lightened` | the Edit mode's `onMouseMove` |
| Rotating with shift | the `shiftKey` branch in `onDrag`, `ShapeModel.rotateBy` | the `event.shiftKey` argument |
| Deleting | `onRightClick` | both modes' `onRightClick` |
| Create mode | `onCreateClick`, `createCreateMode` and its call | `Modes.Create` |

## Contents:
- [./nodes](./nodes/README.md): The shape.
- [./MouseInputSceneModel.ts](./MouseInputSceneModel.ts): Adds the starting shapes, and decides what hover, drag, shift-drag, right-click and Create-mode clicks do.
- [./MouseInputSceneController.ts](./MouseInputSceneController.ts): Defines the Edit and Create interaction modes, and forwards picked nodes and world-coordinate cursors to the scene model.
- [./index.ts](./index.ts): Exports the scene model and controller for `MainApp.tsx`.
