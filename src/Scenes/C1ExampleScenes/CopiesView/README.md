# CopiesView

A custom view that draws **many copies** of its model's shape. The model holds one shape and a few parameters; the view creates one graphic per copy and asks the model where each copy goes and what color it is.

**What you see:** a row of diamonds whose colors blend from blue to red.

**What you can do:**
- **Drag** anywhere to move the whole row.
- **CopiesNCopies**: how many copies. Changing it makes the view throw away its graphics and create new ones.
- **CopiesSpacing**: the distance between neighboring copies.
- **CopiesStartColor** and **CopiesEndColor**: the colors of the first and last copies; the ones in between blend.
- **CopiesWave**: the copies bob up and down in a wave.

## The idea
The model decides; the view draws. `RowOfCopiesModel` has two functions that the view calls for each copy `i`:
- `getTransformForCopy(i): Mat3`: where copy `i` goes, in the model's own coordinates;
- `getColorForCopy(i): Color`: its color.

Both depend only on `i` and the model's parameters (and the time, for the wave). To arrange the copies differently, change those two functions: the view doesn't need to change. For example, try building each copy's transform from `Mat3.Translation2D`, `Mat3.Rotation` and `Mat3.Scale2D`, or making the colors depend on `i` some other way.

## How the scene is organized
```
CopiesViewSceneController   pairs the model with its view, forwards drags, runs the frame loop
        │  onDragStart / onDrag(worldPoint), timeUpdate(t)
        ▼
CopiesViewSceneModel        creates the node and forwards to it
        │
        ▼
RowOfCopiesModel            the shape, the parameters, and getTransformForCopy / getColorForCopy
        │  signals RowOfCopiesModel.Events.PARAMS_CHANGED whenever a parameter changes
        ▼
RowOfCopiesView             one APolygonGraphic2D per copy
```

### What happens when a slider moves
1. The model's `subscribeToAppState` callback reads the controls into its fields and calls `signalParamsChanged()`, which signals the custom event `PARAMS_CHANGED`.
2. The view, which registered a listener with `addParamsListener` in its `init`, hears the event.
3. If `nCopies` changed, the view disposes the old graphics and creates new ones (`createCopies`).
4. For each copy `i`, the view sets the graphic's transform to `getTransformForCopy(i)` and its color to `getColorForCopy(i)` (`updateCopies`).

With the wave on, the model's `timeUpdate` records the time and signals the same event every frame.

Dragging is different: it changes the node's own transform, which the view applies in `update()`. The copies are part of the view, so they all move together.

## Things to notice
- **Each copy gets its own material.** A graphic initialized with a `Color` gets a material of its own. Disposing a graphic disposes its material too, so graphics that you dispose one at a time shouldn't share one.
- **Change a color by changing the existing material** (`setMaterialAttribute`, in `RowOfCopiesView.SetColor`). Calling `setMaterial(color)` every time would create a new material each time and never free the old one.
- **Drawing order within a view:** `setTransform2D(matrix, z)` sets each copy's z value. Larger z is drawn in front.
- **Dragging by a delta:** the drag moves the row by how far the cursor moved since the last drag event (`lastDragPoint`), so the row doesn't jump to the cursor when you start dragging.

## Removing a behavior
| Behavior | Code | Also remove |
|---|---|---|
| The wave | the `wave` branch in `getTransformForCopy`, and `RowOfCopiesModel.timeUpdate` | the `Wave` control key and its checkbox in `SetAppState`, the `wave`/`time` fields and the line in `readParams` |
| Dragging the row | `onDragStart`/`onDrag` in the model and scene model | the model's `lastDragPoint` field, and the controller's `onDragStart`/`onDragMove` callbacks |
| The color blend | `getColorForCopy` (return `this.startColor.clone()` instead) | the `EndColor` key and its `addColorControl` in `SetAppState`, the `endColor` field and default, and the `endColor` line in `readParams` |

## Contents:
- [./nodes](./nodes/README.md): The model (shape, parameters, and the per-copy procedure) and the view that draws the copies.
- [./CopiesViewSceneModel.ts](./CopiesViewSceneModel.ts): Thin scene model. Adds the node's controls, creates it, and forwards time and drags to it.
- [./CopiesViewSceneController.ts](./CopiesViewSceneController.ts): Thin scene controller. Sets the background, registers the view spec, and forwards drags in world coordinates.
- [./index.ts](./index.ts): Exports the scene model and controller for `MainApp.tsx`.
