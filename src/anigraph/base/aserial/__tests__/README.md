# __tests__

Jest specs for the [aserial](../README.md) module. Several file names
start with a short tag (`D3`, `D4`, ...); the tag is only part of the name
and does not describe the contents.

`ASerializable.test.js` covers the round trip end to end: that a decorated
value type revives as its own class (not a plain object) both standalone
and nested inside a plain container, and, in most of the file,
`AObjectNode.fromJSON`'s recursive graph repair: that `_parent` and
`_root` are correct at *every* depth of a multi-level tree after a round
trip, that a node with more than one child revives every child correctly,
and that revived children are actually `ref()`-wrapped (checked with
`getAncestorList()`, which would return a truncated or wrong chain
otherwise).

`D6CycleAndDedup.test.ts` covers cycle detection and shared-reference
de-duplication, using a small test-only `D6TestNode` class (a plain
`@ASerializableField other` reference to another instance of itself),
since the point is the *shape* of the reference graph, not any particular
class's fields: a shared, non-cyclic reference gets one full copy plus an
`_aserial_ref` pointer rather than two independent copies, and round-trips
back to the same object (`revived.a.other === revived.b.other`); a
reference cycle (A → B → A) doesn't overflow the stack, either in
`GetIndexedCopy` (serializing) or after a full round trip. The round-trip
test pins down the exact shape of the one-shot-`fromJSON` limitation
described in the module README (the forward edge resolves correctly; the
back edge resolves to an instance of the right class that is not the same
object), so a change to that behavior fails the test.

`D7AssetReference.test.ts` covers asset-reference serialization:
`AMaterial`, `AShaderMaterial` and `ATexture` wrap live three.js
resources, so they save a registered model name (plus per-instance
overrides) instead of the live `THREE.Material`/`THREE.Texture`. It checks
that a plain `AMaterial` round-trips through its model's registered name;
that `AMaterial.fromJSON` warns and returns a bare instance when the model
name is missing or unregistered; that `AShaderMaterial` round-trips its
model reference, its per-instance uniform overrides and a texture
reference; that `ATexture.fromJSON` rebuilds its texture from `_url`; and
that two objects sharing one `AShaderMaterial` still share it after a
round trip. It registers a small shader model with hand-written source in
place of loading `.glsl` files.

`D8Versioning.test.ts` covers schema versioning: that `GetIndexedCopy`
writes `_aserial_version` from a class's current `AObjectVersion`
(inherited default `1` for any `AObject` subclass) but leaves it out for a
decorated class that never opted in; that a save file with no
`_aserial_version` still loads, treated as version 0; that
`migrate(oldVersion, data)` is called (and its result is what gets
constructed) exactly when the saved version is older than the class's
current one; and that bumping `AObjectVersion` on one subclass doesn't
change a sibling or the shared ancestor.

`D9Registry.test.ts` covers the class registry: that re-decorating the
exact same class definition (as a hot-reload does) keeps the same
registered name with no numeric suffix; that two different classes
claiming the same name both get registered (one with a suffix) and a
`console.warn` is logged; and that `AUnregisterSerializable` removes a
registration.

`D3PrimitiveTypes.test.js` checks value types beyond the `Vec2`/`Color`
checks above: `Quaternion` revives as a `Quaternion` with a working method
(`appliedTo`), not just matching fields, and a real `VertexArray2D` (with
homogeneous position and color data) revives with its `position`
attribute as a `VertexPositionArray2DH` with a working `getAt()`. It also
checks the `Quaternion` JSON `convention` marker.

`D4ContractViolation.test.ts` checks that `@ASerializable`'s
construction-contract check logs a `console.warn` as soon as a violating
class (one with a required constructor argument) is *decorated*, and that
a zero-argument constructor or a static `fromJSON` each silence it.

`ValidateSerializableGraph.test.ts` covers `ValidateSerializableGraph`: a
clean graph reports no issues; a decorated class that breaks the
construction contract is flagged on the actual instance in the graph; a
nested value that looks like a class instance but has no own
`@ASerializable` decoration is flagged (an ordinary plain-object literal
is not); a reference cycle running purely through plain objects is
flagged (the one case `GetIndexedCopy` can't handle); and a cycle or
shared reference through a *decorated* instance is not flagged, since
`GetIndexedCopy` handles that case.

`ALabel.test.ts` covers the split between labels and registration:
`GetClassLabel` returns a class's own `@ALabel`/`@ASerializable` label or
else its own class name (never a decorated ancestor's); `warnIfMissing`
logs once per class; `@ALabel` doesn't register a class or run the
construction-contract check; two undecorated interaction modes get
distinct names and don't overwrite each other in `AInteractionModeMap`,
and a redefinition warning names both classes; `VertexArray2D`'s explicit
`fromJSON` round-trips. Its last test imports every engine and scene
module that uses either decorator and checks that this produces no
construction-contract warnings.

`ClassNameLabels.test.ts` checks that labels equal class names: the
registered model-side classes are registered under their class name and
round-trip, and the runtime-only ones (marked `@ALabel`) keep their
class-name label but are not registered.

## Contents:
- [./ALabel.test.ts](./ALabel.test.ts): `@ALabel`/`GetClassLabel` suite, interaction-mode naming without labels, and the check that importing every module logs no construction-contract warnings.
- [./ASerializable.test.js](./ASerializable.test.js): Round-trip tests for `ASerializableToJSON`/`ASerializableFromJSON`, and `AObjectNode.fromJSON`'s recursive graph repair.
- [./ClassNameLabels.test.ts](./ClassNameLabels.test.ts): Class-name labels, split into registered classes and label-only (`@ALabel`) classes.
- [./D3PrimitiveTypes.test.js](./D3PrimitiveTypes.test.js): `Quaternion`/`VertexArray2D` round trips, checking working methods on the revived instances, not just matching fields. Also checks the `Quaternion` JSON `convention` marker, and that data saved without it loads as the same rotation.
- [./D4ContractViolation.test.ts](./D4ContractViolation.test.ts): The construction-contract warning at decoration time.
- [./D6CycleAndDedup.test.ts](./D6CycleAndDedup.test.ts): `GetIndexedCopy`/`ASerializableFromJSON` shared-reference de-duplication and reference cycles.
- [./D7AssetReference.test.ts](./D7AssetReference.test.ts): `AMaterial`/`AShaderMaterial`/`ATexture` round trips as asset references.
- [./D8Versioning.test.ts](./D8Versioning.test.ts): `_aserial_version`, `AObjectVersion` and `migrate()`.
- [./D9Registry.test.ts](./D9Registry.test.ts): Registry name collisions, hot-reload re-registration, and `AUnregisterSerializable`.
- [./ValidateSerializableGraph.test.ts](./ValidateSerializableGraph.test.ts): `ValidateSerializableGraph`'s three checks (construction contract, unregistered nested classes, plain-object cycles), plus the cases it must not flag.
