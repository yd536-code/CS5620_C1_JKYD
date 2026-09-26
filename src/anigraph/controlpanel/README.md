# controlpanel

Building blocks for the Leva-based GUI control panel every AniGraph app
uses -- the actual stateful home for a panel is [`AAppState`](../appstate/README.md)
(see its [`ControlPanel.md`](../appstate/ControlPanel.md) for the guide
scene authors should read first); this module only provides the pieces
`AAppState` builds itself out of.

## Contents:
- [./__tests__/](./__tests__/README.md): Unit tests for `AControlSpecGroup` --
  registration for every control type, the `onChange` composition rule,
  nesting (both a plain pre-built spec dict and an already-built
  `AControlSpecGroup`), and `findControlPath()` against every
  folder-nesting/suffixing case in the codebase.
- [./GUISpecs.ts](./GUISpecs.ts): `GUISpecs`, a class of `static` pure
  builder functions (`SliderControl`, `ColorControl`, `ButtonControl`,
  `CheckboxControl`, `SelectionControl`) that each take an `onChange`
  callback and return a plain leva-shaped spec object, plus
  `MakeFolder(name, spec, addFolderNameToKeys, collapsed)` (wraps a spec
  dict in leva's `folder()`, optionally suffixing each child key with
  `_<name>`) and `KeyNameInFolder`. Pure functions -- no registry, no
  notion of "already registered," no panel-refresh side effect.
  `AControlSpecGroup` calls these internally rather than reimplementing
  spec-shape logic.
- [./AControlSpecGroup.ts](./AControlSpecGroup.ts): `AControlSpecGroup`, a
  named, nestable group of control-panel specs -- the thing you build a
  group of controls with, in place of manually calling `GUISpecs`'
  builder functions and merging dicts by hand. `AAppState` owns one root
  `AControlSpecGroup` and every one of its `addXControl`/
  `addControlSpecGroup`/`setGUIControlSpecKey`/`updateControlSpecEntry`
  methods is a thin wrapper around it (see `ControlPanel.md`'s "Adding a
  control the user can interact with" section for how to use them). Beyond `AAppState`, this is also what
  `ANodeModel.getInstanceControlSpecGroup()`/`static
  getClassControlSpecGroup()` and `AShaderModel`'s equivalents return, so
  a model can expose its own controls polymorphically instead of a scene
  hand-writing an `instanceof` chain over every subclass it knows about
  -- see `../appstate/ControlPanel.md` for a worked example, and
  `ABasicDiffuseShaderModel.getClassControlSpecGroup()` in
  `../rendering/shadermodels/` for a real class-wide one.
- [./index.ts](./index.ts): Barrel export for this module.
