# Audio

A small wrapper around [Howler.js](https://howlerjs.com/) for playing sound effects and music from AniGraph apps. `AAudioManager` (an `AObject` subclass) keeps a name-keyed dictionary of `Howl` instances; `LoadSound(name, path?, howlOptions?)` creates and caches a `Howl` for a given file and returns a promise that resolves once the file has finished loading (or rejects on a load error), and `playSound(name)`/`getSound(name)` play or fetch an already-loaded sound by its registered name. The module doesn't export the class directly — it exports a single ready-to-use singleton, `AudioManager`, that app and scene code imports and calls directly rather than instantiating `AAudioManager` itself.

## Contents:
- [./AAudioManager.ts](./AAudioManager.ts): Manages a dictionary of named `Howl` sound instances. Provides methods to load sounds from file paths (returning a Promise), play them by name, and look them up. Extends `AObject` and uses the `@ASerializable` decorator.