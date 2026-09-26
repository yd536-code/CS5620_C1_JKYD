# Loaded Character

A variant of [../](../README.md)'s `CharacterModel3D`/`CharacterView3D` for characters whose geometry comes from an imported 3D asset (via [../../../../fileio/](../../../../fileio/README.md)) instead of being built procedurally. `LoadedCharacterModel3D` extends `ALoadedModel3D` (from [../../../../scene/nodes/loaded/](../../../../scene/nodes/loaded/README.md), which wraps a loaded `THREE.Object3D`) rather than `ANodeModel3D` directly, but still implements the same `CharacterModelInterface` (mass, position, velocity) as the procedural `CharacterModel3D`, and reuses the sibling `character/` module's `CharacterMaterial` for per-character coloring via `setCharacterColor`. `LoadedCharacterView3D` is a thin subclass of `ALoadedView3D` with no character-specific overrides — the loaded-model view machinery is already enough to display it.

## Contents:
- [./LoadedCharacterModel3D.ts](./LoadedCharacterModel3D.ts): Extends `ALoadedModel3D` with `CharacterModelInterface` (mass, velocity, position). Also supports per-character color via `CharacterMaterial` uniforms.
- [./LoadedCharacterView3D.ts](./LoadedCharacterView3D.ts): View for loaded characters that creates `ALoadedElement` graphics and propagates material updates.
- [./index.ts](./index.ts): Barrel export for the LoadedCharacter module.