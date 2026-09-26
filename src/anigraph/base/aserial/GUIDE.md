# Serialization Guide

This is the start-to-end guide to AniGraph's serialization system. The
[README](./README.md) documents the same mechanism in per-symbol reference
form; this document is the "learn it once, in order" version. If a change
to this system makes a paragraph here wrong, update the paragraph along
with the code.

## The mental model, in one paragraph

`@ASerializable("Name")` is a class decorator that registers a class by
name in a module-level registry. `toJSON()`/`fromJSON()` are the actual
data contract: 

- `toJSON()` (inherited from `AObject`, or your own) turns an instance into a plain, JSON-safe object 
- `fromJSON(data)` (inherited via `AObject.CreateWithState`, or your own) turns that plain object back into a real instance of the right class.
- `GetIndexedCopy`/`ASerializableToJSON` walk an entire object graph applying `toJSON()` everywhere, assigning each decorated instance a short id so a value reached twice comes back as one copy plus a reference instead of two independent copies;`ASerializableFromJSON` walks the result back the other way, applying
`fromJSON()`. The registry plus those two methods is the whole system —
everything else in this guide is a detail of how that's made to actually
work (name collisions, cycles, versioning) or a convention for using it
well.

## Does your class need to be serializable at all?

Only if instances of it end up *inside a save file*: models (node models,
scene models), and the values they hold (vectors, transforms, geometry,
materials/textures). A scene is saved as its model hierarchy; on load, the
scene controller rebuilds every view from the Model View Specs. So views,
controllers, interaction modes, graphic objects, render contexts, material
and shader models, and managers are never revived from JSON, and should be
decorated `@ALabel("MyClass")` instead of `@ASerializable("MyClass")`.

`@ALabel` only gives the class a label (used for interaction-mode names,
three.js object names, etc.). It doesn't register the class, and doesn't
check for a zero-argument constructor — so a view or mode can take whatever
constructor arguments it likes without warnings. Forgetting it is harmless:
`GetClassLabel` falls back to the class's own name.

## Making your own class serializable

1. **Decorate it:** `@ASerializable("MyClass")` (or `@ASerializable()`,
   which falls back to `constructorFunction.name` — pass an explicit name
   whenever the class might get minified/renamed by a build, or whenever
   you want the saved name stable independent of the class's own name).
2. **Decide where your data lives:**
   - A field that also needs to be *reactive* (something else should be
     notified when it changes) is `@AObjectState` — see
     [../aobject/README.md](../aobject/README.md). `AObject.toJSON()`
     automatically includes every `@AObjectState`/`@AObjectStateRef` field.
   - A field that's real, savable data but doesn't need reactivity is
     `@ASerializableField` — most model classes' actual data lives here
     (see the example in `ASerializableField`'s doc comment in
     `ASerializable.ts`). `AObject.toJSON()` includes these too.
   - A field that's neither (a cache, a derived/computed value, a live
     Three.js/WebGL handle) gets neither decorator and is simply absent
     from the default `toJSON()` output — this is correct, not an
     oversight, for anything that should be recomputed rather than saved.
3. **Decide whether you need a custom `toJSON()`/`fromJSON()` pair at all.**
   If your class extends `AObject` (directly or via `AObjectNode`) and all
   its real data is `@AObjectState`/`@ASerializableField`, the inherited
   `toJSON()`/`fromJSON()` (via `CreateWithState`) is enough — this is the
   common case, and is what almost every currently-decorated class in the
   engine relies on. Write your own pair only when revival needs to run
   real logic beyond "assign these fields onto a new instance" — a
   `Quaternion`-style value type built from constructor arguments rather
   than field assignment, or (see "Asset-reference serialization" below) a class that wraps a live
   runtime/GPU resource.
4. **The zero-argument-constructor-or-`fromJSON()` contract.** Every
   serializable class must support *one* of: `new MyClass()` with no
   arguments (the default revival path needs this), or a static
   `fromJSON(data)`. If neither is true, `@ASerializable` prints a
   dev-only `console.warn` at the moment the class is decorated (module
   load time), naming exactly what's missing — this is a warning, not a
   throw, because `constructor.length` (how the check works) only counts
   *declared* parameters before the first default/rest parameter, and
   several real classes in this codebase report a nonzero length only
   because a subclass always supplies that argument via `super(...)` —
   see the doc comment on `WarnIfConstructionContractViolated` in
   `ASerializable.ts` for the specifics. If you see this warning for a
   class you're writing: either give it a working zero-arg form, or write
   a `fromJSON`. If you see it for an existing class and you're confident
   the warning is a false positive for that specific class (a subclass
   always provides the argument), that's fine to leave — it's exactly the
   documented false-positive shape.

## Gotchas worth knowing before writing a new decorated class

These are gathered here from scattered per-file comments; each links back
to its home for the full reasoning.

- **An undecorated subclass of a decorated class is not itself
  serializable, and must never be treated as if it were the ancestor
  class.** `ASerializationClassID` is a static property, and JS resolves
  an unset static through the prototype chain — so a naive
  `SubClass.ASerializationClassID !== undefined` check would report the
  *ancestor's* id for a subclass that was never itself decorated. Every
  place in this system that decides "is this a serializable instance"
  checks *ownership* (`hasOwnProperty`), not just presence — see
  `hasOwnSerializationClassID` in `ASerializable.ts`.
- **A decorated class with no custom `toJSON()` gets a shallow
  own-property copy, not another pass through the decorated-instance
  path.** Handing the walk its own still-decorated self again would
  re-match "this is a decorated instance" on the very next step and loop
  forever (a stack overflow, for example on `NodeTransform2D`). You don't
  need to write a `toJSON()` just to avoid this; the fallback (`{
  ...inObject }`) is there for exactly this case.
- **`GetIndexedCopy`/`ASerializableFromJSON` dedup and cycle-protect
  decorated instances, not plain objects or arrays.** A shared or
  self-referencing *plain* object reached twice via different paths is
  still walked and copied independently each time — this is deliberate
  scope, not a gap: the concrete cases this exists for (a shared
  `Material`, a parent/child-shaped cycle) are both about decorated
  instances.
- **The shell-then-populate revival scheme has one real, stated
  limitation for cyclic references through a one-shot `fromJSON`.** Most
  classes (anything using the inherited `AObject`/`AObjectNode`
  `fromJSON`) build-and-return a whole new instance in a single call,
  discarding the "shell" instance a cyclic reference may have already
  grabbed a reference to. So in a genuine A→B→A cycle, the forward edge
  resolves to the final object correctly, but the back edge can end up
  pointing at a right-class-but-not-reference-equal shell instead. This
  does not crash and does not affect ordinary (non-cyclic) shared
  references — see `D6CycleAndDedup.test.ts` for the exact, tested shape
  of this limitation.
- **`JSON.parse`'s built-in reviver can't support cycles**, which is why
  `ASerializableFromJSON` is a plain `JSON.parse` plus a hand-written
  recursive walk (`ReviveNode`) instead of a `JSON.parse(text, reviver)`
  one-liner: the built-in reviver walks strictly bottom-up, so a
  back-reference nested inside the very object it points to would need to
  resolve before that object has been constructed at all.
- **A `Date` (or any other undecorated built-in with internal, non-
  enumerable state) round-trips as `{}`.** Both directions of this system
  walk a plain object via `for...in` over its own enumerable properties,
  which is empty for a `Date`. This predates this system's current form
  (plain `JSON.stringify`/`parse` has the same gap, just via a different
  mechanism) and isn't specific to anything here, but is worth knowing
  before assuming a plain field of type `Date` will just work.
- **A class that wraps a live GPU/runtime resource serializes as an asset
  reference, not a field dump — see "Asset-reference serialization"
  below for which category a new class belongs in and how to write the
  `toJSON`/`fromJSON` pair.**

## Diagnosing a save/load problem before it happens

`ValidateSerializableGraph(obj)` walks an object graph the
same way `GetIndexedCopy` would, but only inspects — it never serializes —
and returns a list of `{path, classId?, message}` issues instead of
throwing or silently producing bad output. Reach for it when you're not
sure whether something will round-trip cleanly: it catches a
construction-contract violation on the actual instance in your graph
(inheriting the same false-positive rate described in step 4 above — a
flagged class isn't automatically broken, just worth a second look), a
nested value that looks like a real class instance but has no own
`@ASerializable` decoration (the same failure mode as the `Date` gotcha
above, generalized), and a
reference cycle running purely through plain objects (the one case
`GetIndexedCopy` has no protection for and would recurse forever on).

## Versioning

`AObject.AObjectVersion` is a plain static number (inherited default `1`)
naming the *current* shape of a class's serialized data.
`GetIndexedCopy` writes it into the wrapper as `_aserial_version`;
`ReviveNode` reads it back and compares against the class's *current*
`AObjectVersion` before revival. A class that changes its own saved shape
bumps this as an own static field:

```typescript
class MyModel extends AObjectNode {
  static AObjectVersion = 2;
  static migrate(oldVersion: number, data: any) {
    if (oldVersion < 2) {
      data.newField = data.oldField; // translate old shape forward
    }
    return data;
  }
}
```

This is ordinary JS static-field shadowing (safe without any
`GetOwnDecoratorArray`-style own-property trick, since it's a single
scalar, not an accumulated array a naive implementation could leak
between classes). `migrate` is only called when the saved version is
strictly older than the current one; a save file with no
`_aserial_version` at all (an older save, or a class that's never opted into
versioning) is treated as version 0, never rejected. A decorated class
that isn't an `AObject` subclass and never sets `AObjectVersion` simply
never gets the field written at all — no fabricated version number.

## Asset-reference serialization

`AMaterial`/`AShaderMaterial`/`ATexture` are a third category: live
wrappers around a `THREE.Material`/`THREE.Texture` that were never meant to
survive a JSON round trip as a raw field dump — a texture needs to be
reconstructed from a path, not from a serialized pixel buffer; a material
needs to be reconstructed from its model (shader/parameters), not from a
serialized `THREE.Material` graph. Each of these three classes writes its
own `toJSON()`/static `fromJSON()` pair (the same "write your own when
revival needs real logic" escape hatch from step 3 above) that captures
**reconstruction parameters**, not current field values:

- **`AMaterial.toJSON()`** returns `{modelName: this.model.name}` — the name
  the material's `AMaterialModelBase` is registered under in
  `AssetManager.materials`. `fromJSON` looks that model up
  (`AssetManager.materials.getMaterialModel(modelName)`) and calls its
  `.CreateMaterial()`, the same factory call any ordinary (non-serialized)
  construction site already uses. **Known limitation:**
  this captures *which model* the material came from, not a `.setValue()`/
  `.setValues()` override applied directly to the live `THREE.Material`
  afterward — `AMaterial` has no side-channel record of those. A material
  used exactly as its model configured it round-trips correctly; one
  hand-tuned after creation does not.
- **`AShaderMaterial.toJSON()`** extends `AMaterial`'s `{modelName}` with
  the two kinds of per-instance override a real shader material actually
  carries in its own `uniforms`/`textures` fields (unlike the plain
  `AMaterial` case, these *are* captured, because they live on the instance
  rather than being written straight through to the live material with no
  record kept): `textures` returns live `ATexture` instances directly —
  `GetIndexedCopy`'s walk recurses into whatever a custom `toJSON()`
  returns, so a nested decorated instance gets wrapped/deduped exactly as
  if it had been reached generically, which is also what makes two
  `AShaderMaterial`s sharing one texture (or two scene objects sharing one
  *material*) dedup correctly. `uniforms` is filtered and converted:
  texture-valued uniforms (`type: "t"`, a raw `THREE.Texture` — not
  JSON-safe) are skipped and re-derived from `textures` via `setTexture()`
  on revival instead; `THREE.Vector2/3/4` values are tagged
  (`{_athreeVector, values}`) so they round-trip as the same class rather
  than a dead `{x,y,z}` plain object. A uniform value of
  any other type is dropped with a dev-only `console.warn` naming it.
- **`ATexture`** keeps the inherited generic `toJSON()` (`name`/`_url`/
  `_texdata` are already `@AObjectState`) and adds only a static
  `fromJSON`, because the generic revival path has no way to (re)populate
  `_threejs` — it isn't reactive state, and populating it means an actual
  texture load. `fromJSON` calls `loadFromURL(data._url)`, exactly like any
  other caller: `THREE.TextureLoader.load()` (not `.loadAsync()`) returns a
  real `THREE.Texture` synchronously and fills in its image data later, in
  place — the same "placeholder now, populate later" behavior this class
  already has for ordinary (non-serialized) loading, so this introduces no
  new async contract. This means `_url` has to actually be set for every
  texture that should round-trip — `ATexture.LoadAsync` (what
  `AssetManager.loadTexture` calls, the ordinary way a real texture gets
  created) builds its instance from an already-loaded `THREE.Texture`, a
  constructor branch that doesn't set `_url` on its own, so `LoadAsync`
  sets it explicitly after constructing. **Known limitation:** an
  `ATexture` built directly from an in-memory `THREE.Texture`
  (`_setTHREETexture`, with no `LoadAsync`/`loadFromURL` involved at all —
  a user-uploaded file, a render target) genuinely has no path to reload
  from; it revives with `_threejs` left `undefined`, and `fromJSON` warns
  (dev-only) rather than failing silently.
- **A `.load()`-based texture's `.image` is `null`, not a placeholder
  element, until the network load finishes — in every environment, not
  just tests.** `THREE.TextureLoader.load()` (what `loadFromURL`/`fromJSON`
  use, since it's the only synchronous option) returns immediately with
  `.image` at `Texture.DEFAULT_IMAGE` (`null`), assigning a real image only
  once loading completes, asynchronously. `ATexture.width`/`height` read
  `this.threejs.image?.width??0` for exactly this reason — an unloaded
  texture's size is unknown yet, not an error. If you're writing code that
  touches a texture's `.width`/`.height` right after a *synchronous* load
  (`loadFromURL`, or a `fromJSON`-revived texture), don't assume it's
  populated the way it would be after an *awaited* `LoadAsync()`/
  `.loadAsync()` call.

If you're deciding whether a new class you're writing belongs in this
category rather than the generic field-dump path above: does it wrap a
live GPU/runtime handle that needs to be *reconstructed* (via a factory, a
loader, a registry lookup) rather than *repopulated* (plain field
assignment)? If yes, write your own `toJSON`/`fromJSON` pair capturing
whatever reference/parameters the reconstruction call needs, following the
pattern above rather than letting the generic path dump the live resource.

## Worked example: a Save/Load button pair

A typical scene-level Save/Load feature round-trips a few plain arrays of
the scene's own node models (plus any settings) through
`ASerializableToJSON`/`ASerializableFromJSON`:

```ts
// In your scene model. `emitters` is an array of @ASerializable node models.
getSaveData() {
    return {emitters: this.emitters, rayCount: this.rayCount};
}
saveSceneToJSON(): string {
    return ASerializableToJSON(this.getSaveData());
}
loadSceneFromJSON(jsonText: string) {
    const data = ASerializableFromJSON<{emitters: EmitterModel[], rayCount: number}>(jsonText);
    // Remove the current emitters from the scene, then add data.emitters back in.
}
```

Scope the saved data to those plain arrays rather than "the whole scene
graph": serializing the scene's own bookkeeping structures directly would
double up with the underlying `AModelGraph`'s own `_children`. If two of
the saved objects share one `AShaderMaterial` instance, the
asset-reference `toJSON`/`fromJSON` pairs above save it once and the
shared-reference dedup gives both objects the same material back on load.

## What this doesn't do yet

- **Live GPU state itself** (compiled shaders, framebuffer contents, raw
  texture pixel data) is out of scope. The asset-reference
  approach (save a reference, rebuild on load) is the answer for these classes;
  actually dumping their live resource data is not a goal.
- **Every decorated class following the patterns above.** The mechanism
  works end-to-end, but not every decorated class has
  been checked against it, so test a class's round trip before relying
  on it.
- **Cross-version binary compatibility, or any format other than JSON.**
  The versioning hook is about letting this codebase evolve without
  breaking its own old save files, not about interoperating with external
  tools or formats.
- **A cycle running purely through plain (undecorated) objects.** Not
  handled — see the dedup/cycle-protection gotcha above.

## Contents

- [./README.md](./README.md): Per-symbol reference for everything in this
  module.
- [./ASerializable.ts](./ASerializable.ts): The implementation.
- [./__tests__/](./__tests__/README.md): The tests backing the claims in
  this guide.
