# Using the control panel

Every AniGraph app has a control panel — the panel of sliders, checkboxes,
buttons, color pickers, and dropdowns docked next to the canvas. This guide
covers the two things you'll want to do with it in a scene:

1. **Add a control the user can interact with**, and read/react to its value.
2. **Update a control from your own code while the app is running** — e.g.
   widen a slider's range once more data exists, or change what a dropdown
   offers.

Both go through your scene's `AAppState` (usually accessed via
`GetAppState()`). You don't need to know how the panel renders itself under
the hood to use it correctly — everything here is about the behavior you can
rely on.

## How control panel values relate to app state

Every control has a **name** (a string, like `"Speed"`), and that name is the
one thing that ties three separate pieces together:

1. **What the panel displays.** Registering a control (`addSliderControl`,
   `addCheckboxControl`, etc.) tells the panel to show a control of that
   type, under that name.
2. **`appState.stateValues[name]`** — the actual stored value, read with
   `appState.getState(name)`. This is a plain value (a `number`, `boolean`,
   `Color`, ...), not something specific to the panel.
3. **`appState.GUIControlSpecs[name]`** — the control's *spec*: its type,
   range/options/step, and starting value. This is what you're building
   when you call `addSliderControl` and friends, or a `CreateControlPanelXSpec`
   method directly.

The connection between (1)/(3) and (2) only runs in one direction
automatically: **when the user edits a control in the panel, that writes the
new value into `stateValues[name]` for you** (via `setState`), and anything
subscribed with `addStateValueListener(name, ...)` finds out. There's no
extra step — this is why `getState(name)` right after registering a control
returns whatever the user last set it to, not something you have to sync
yourself.

The reverse is more limited, and this is the part that trips people up:
**calling `setState(name, value)` yourself does not, by itself, move the
control's displayed position in the panel.** `stateValues` and what the
panel shows are two different things, kept in sync automatically in only one
direction. There are two different things you might actually want here,
and they're two different calls:

- To change what a control *looks like* or what range/options it
  accepts — as opposed to its current value — re-register its spec (see
  "Updating a control from code" below). The panel treats that as a real
  update, without disturbing whatever value is already there.
- To make the panel's display catch up to a value you set from code (e.g.
  right after calling `setState(name, ...)` yourself), call
  **`appState.updateControlPanelValue(name)`**. It pushes `getState(name)` into the
  panel as the control's new displayed value, leaving its range/options/step
  untouched — the one case where AAppState *does* let you move a control's
  displayed value from outside the panel.

One consequence worth internalizing: a control's `initialValue` (the one you
pass to `addSliderControl` and friends) only ever matters the *first* time
that name is registered. From then on, `getState(name)` reflects the live
value — either what the user set, or what your own code last wrote with
`setState` — regardless of what `initialValue` you pass on a later
re-registration.

## Adding a control the user can interact with

Registering a control is a two-step pattern, split across the two methods
every scene model already implements:

1. **`initAppState(appState)`** — register the control once, with a name and
   a starting value. This runs before your scene is built.
2. **`initScene()`** — subscribe to that name with `addStateValueListener` so
   your code finds out when the user changes it.

```ts
class MySceneModel extends ATwoJSAppSceneModel {
    speed: number = 1;

    initAppState(appState: AppState): void {
        appState.addSliderControl("Speed", 1, 0.1, 5, 0.1);
    }

    async initScene(): Promise<void> {
        const appState = GetAppState();
        this.subscribe(
            appState.addStateValueListener("Speed", (v: number) => {
                this.speed = v;
            }),
            "SpeedSubscription"
        );
    }
}
```

The name you pass to `addSliderControl` (`"Speed"`) is what ties everything
together — it's the same string you pass to `addStateValueListener`, and the
same string you'd pass to `appState.getState("Speed")` for a one-off read
(useful in a callback that doesn't have its own subscription, like a
per-frame `timeUpdate`). Names are shared across the whole app's control
panel, so keep them specific to your scene.

### Which method to call

| You want... | Register with | Current value |
|---|---|---|
| A numeric slider | `addSliderControl(name, initialValue, min, max, step)` | `number` |
| A checkbox | `addCheckboxControl(name, value)` | `boolean` |
| A color picker | `addColorControl(name, initialValue)` | AniGraph `Color` |
| A dropdown | `setSelectionControl(name, initialValue, options)` | one of `options` |
| A button | `addButton(name, callback)` | none — see below |

All except buttons follow the exact pattern above: register in
`initAppState`, subscribe with `addStateValueListener` (or read one-off with
`getState`) in `initScene`.

**Buttons are different: they don't have a value.** `addButton(name,
callback)` calls `callback` directly when clicked — it never calls
`setState`, so there's nothing in `getState(name)` to read and
`addStateValueListener(name, ...)` will never fire for it. Put whatever
should happen directly in `callback`.

**Grouping controls into a folder:** `addControlSpecGroup(name, specDict)`
collapses a set of controls under one heading. Build each control's spec
with the matching `CreateControlPanelXSpec` method (e.g.
`CreateControlPanelSliderSpec`) rather than `addXControl`, since you're
handing the whole group to `addControlSpecGroup` at once instead of
registering each one individually. One thing to know: by default each
control's name inside the folder gets `_<folderName>` appended (so it's
unique across folders) — so read a folder child's value back with
`getState("<controlName>_<folderName>")`, not the plain name you used in the
spec.

## Updating a control from code while the app runs

Everything above handles the user changing a control. Sometimes it's the
*other* direction: something in your app changes, and a control's range,
options, or displayed default should change to match — driven by your code,
not by the user touching that control.

The recipe is the same three steps every time:

1. **Pick the signal** that means "this control's spec might need to
   change." Usually this is a listener you already have — a geometry
   update, another control's `addStateValueListener` firing, anything that
   changes the value the control's spec depends on.
2. **Guard on the thing that actually matters changing**, not on the raw
   signal firing. A geometry listener might fire on every frame of a drag;
   most of those frames don't change whatever your spec depends on. Store
   the last value you synced to, and return early if it hasn't changed —
   updating a control (even one that ends up unchanged) still costs the
   panel a re-render, so it's worth skipping when nothing changed.
3. **Call the same `addXControl`/`setSelectionControl` method you used to
   register it, again**, with the current parameters. That single call
   updates the control's spec *and* refreshes the panel — no separate
   "now apply it" step.

### Worked example: a slider whose range tracks a spline

Suppose a scene draws a piecewise Bézier spline (here a node model
`BezierSplineModel` that you would write yourself) and has a `t` slider for
scrubbing along it. `t`'s valid range depends on how
many segments the spline currently has, which changes as the user clicks new
control points — so the slider's `max` needs to track that from code, not
from the user dragging `t` itself.

```ts
class SplineSceneModel extends AppSceneModel2D {
    splineNode!: BezierSplineModel;

    // Step 2's guard: the segment count `t`'s range was last synced to.
    private _lastTSliderSegCount: number = -1;

    initAppState(appState: AppState): void {
        appState.addSliderControl("t", 0, 0, 1, 0.01);   // initial registration
    }

    async initScene(): Promise<void> {
        // Step 1: the signal. Fires on every point add/move and every
        // degree change -- anything that could move segmentCount.
        this.subscribe(
            this.splineNode.addGeometryListener(() => {
                this.syncTSliderRange();
            }),
            "TSliderRangeSubscription"
        );
        this.syncTSliderRange();   // and once at startup
    }

    private syncTSliderRange(): void {
        // Step 2: guard on the thing that actually matters.
        const segCount = this.splineNode.segmentCount;
        if (segCount === this._lastTSliderSegCount) return;
        this._lastTSliderSegCount = segCount;

        const appState = GetAppState();
        const max = Math.max(segCount, 1);
        const tValue = Math.min(this.splineNode.manualT, max);

        // Step 3: this line is the entire "update the panel" step.
        appState.addSliderControl("t", tValue, 0, max, 0.01);
    }
}
```

A couple of things worth knowing before you rely on this pattern elsewhere:

- **Re-registering an existing control never yanks its display out from
  under the user.** `addSliderControl`'s `initialValue` argument only
  matters the first time a given name is registered. Once a control is
  already on-screen, calling `addSliderControl`/`addCheckboxControl`/etc.
  again updates its range/options/step, but leaves whatever value the user
  (or a previous update) left it at completely alone. You don't need to
  compute a "correct current value" defensively — the panel already
  preserves it.
- **This works identically for every control type** — swap in
  `addCheckboxControl`, `addColorControl`, or `setSelectionControl` if it's
  a boolean, color, or dropdown's options that need to change, not a
  slider's range.

### Batching several updates into one panel refresh

If one event should update *multiple* controls' specs at once and you want
the panel to refresh only once instead of once per control, use
`addControlSpec` (merges a `{name: spec}` dict without refreshing the panel
by itself) followed by one manual `updateControlPanel()` call:

```ts
appState.addControlSpec({
    "A": appState.CreateControlPanelSliderSpec("A", aValue, 0, aMax, 0.01),
    "B": appState.CreateControlPanelCheckboxSpec("B", bValue),
});
appState.updateControlPanel();
```

This is purely an optimization — calling `addSliderControl`/
`addCheckboxControl` separately for each one is equally correct, just
slightly more re-render work.

## Letting a model expose its own controls

Everything above is the scene explicitly registering each control by name.
Sometimes what you actually want is a *model* exposing its own controls —
e.g. a scene builds a "selected object" panel and needs to show different
controls depending on which subclass is selected. The naive version of
that is an `instanceof` chain in the scene:

```ts
if (selected instanceof A) { /* ...build A's controls... */ }
else if (selected instanceof B) { /* ...build B's controls... */ }
// every time a new subclass is added, this chain grows
```

`ANodeModel` instead gives every node model two hooks, each returning an
[`AControlSpecGroup`](../controlpanel/README.md) (or `undefined` if it has
none) — a real class for building a *group* of controls, replacing the
plain-dict-plus-`GUISpecs`-builder pattern used everywhere above:

- **`getInstanceControlSpecGroup()`** (instance method) — this specific
  instance's own controls.
- **`static getClassControlSpecGroup()`** (static method) — this class's
  own class-wide controls, shared across every instance rather than
  per-object. Not polymorphic through an instance — reach a subclass's
  override via `(someInstance.constructor as typeof ANodeModel)
  .getClassControlSpecGroup()`, or call it on the concrete class directly.

Both default to `undefined` ("this class exposes no controls"), so every
existing `ANodeModel` subclass keeps working unmodified. A subclass that
wants controls overrides one or both, building an `AControlSpecGroup`
whose controls' `onChange` closures mutate `this` (or, for the static
method, whatever class-wide default it manages) directly:

```ts
class LensModel extends ANodeModel2D {
    getInstanceControlSpecGroup(): AControlSpecGroup {
        const group = new AControlSpecGroup("Selected Object", {addNameToKeys: false});
        group.addSliderControl("Selected Focal Length", this.focalLength,
            (v) => this.setFocalLength(v), FOCAL_LENGTH_MIN, FOCAL_LENGTH_MAX, 1, {label: "focalLen"});
        return group;
    }
}
```

The scene side collapses to one call, no `instanceof` chain, no per-name
registration:

```ts
const group = selected?.getInstanceControlSpecGroup()
    ?? new AControlSpecGroup("Selected Object", {addNameToKeys: false});
appState.addControlSpecGroup("Selected Object", group, false, false);
```

`appState.addControlSpecGroup` accepts an `AControlSpecGroup` here the
same way it accepts a plain spec dict everywhere else in this guide — the
group's own `addNameToKeys`/`collapsed` (set at construction) are what's
honored in that case, not the boolean arguments passed to
`addControlSpecGroup` itself.

This isn't `ANodeModel`-specific — `AShaderModel` exposes the same two
hooks independently (it doesn't extend `ANodeModel`), for its own
per-material-instance and per-shader-class controls (see
`ABasicDiffuseShaderModel.getClassControlSpecGroup()` in
`rendering/shadermodels/` for a class-wide example). Because each control
changes the selected object (`this`) directly, nothing is left over from
the previous selection that needs cleaning up.

## Common mistakes to avoid

- **Don't write to `appState.GUIControlSpecs` directly.** Always go through
  `addSliderControl`/`addCheckboxControl`/`addColorControl`/
  `setSelectionControl`/`addControlSpec`/`addControlSpecGroup` — a direct
  property write won't reliably show up in the panel.
- **Don't call an `addXControl` method (or `updateControlPanel()`)
  unconditionally from something that runs every frame.** Guard it on the
  value it depends on actually changing, the way `syncTSliderRange` guards
  on `segCount` above.
- **Don't expect a button to have a value.** There's nothing to `getState`
  or listen for — see "Which method to call" above.
- **Don't forget the `_<folderName>` suffix when reading back a
  folder-grouped control's value.**
