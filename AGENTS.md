# Instructions

Always write docstrings and comments to explain code.

## Conventions for new code

These apply to every class added after the starter code, wherever it goes: a new scene folder, a copy of an example scene, or new classes added to an existing example scene or to the engine. Classes that were already in the starter code (the engine in `src/anigraph/` and the example scenes in `src/Scenes/C1ExampleScenes/`) predate these conventions and keep their existing labels; don't rename those.

1. **Label namespace.** Labels passed to `@ASerializable` and `@ALabel` use the `c1.` namespace followed by the class name, for example `@ASerializable("c1.BouncingBallModel")` and `@ALabel("c1.BouncingBallView")`. This keeps scene classes from colliding with engine and example labels, and makes saved scene files self-describing. (Interaction modes keep plain names, since their names are shown in the InteractionMode menu.)
2. **Docstring tag.** Every class docstring starts with a `@c1scene <SceneName>` line, where `<SceneName>` is the name of the folder of the scene the class is written for:

```typescript
/**
 * @c1scene BouncingBall
 * A ball that bounces off the edges of the screen.
 */
@ASerializable("c1.BouncingBallModel")
export class BouncingBallModel extends ANodeModel2D {
    ...
}
```

## Documentation

Each subfolder should contain a README.md file. The README.md file should contain a list of contents describing each file or subdirectory that it contains. The list should describe subdirectories first, followed by files, matching the following format:

```markdown
## Contents:
- [./subdirectory](./subdirectory/README.md): Short description of the subdirectory.
- [./subfile.ts](./subfile.ts): Description of the file.
```
