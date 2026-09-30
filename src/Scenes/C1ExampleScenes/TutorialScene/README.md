# TutorialScene

An empty scene for you to build up, step by step, as you read the C1 docs. Each step of the [Tutorial](https://www.cs.cornell.edu/courses/cs4620/2026fa/assignments/docs/assignments/c1/tutorial/) adds one small demo of the docs section you just read, so you can see each idea work before moving on.

It's a workbench, not a starting point for your project. For that, see the [Creating a Scene](https://www.cs.cornell.edu/courses/cs4620/2026fa/assignments/docs/assignments/c1/creating-a-scene/) page of the docs.

**What you see at first:** an empty canvas. The only control-panel entries are the built-in ones.

**To run it:** in `src/MainApp.tsx`, comment out the active `import AppClasses from ...` line and add:
```typescript
import AppClasses from "./Scenes/C1ExampleScenes/TutorialScene";
```

[../TutorialSceneComplete](../TutorialSceneComplete/README.md) is this scene with every tutorial step done. Compare with it when you get stuck, but import only from this folder.

## Contents:
- [./nodes](./nodes/README.md): Your node models and views go here.
- [./TutorialSceneModel.ts](./TutorialSceneModel.ts): The scene model, empty. Its comments say which tutorial step first fills in each method.
- [./TutorialSceneController.ts](./TutorialSceneController.ts): The scene controller: sets a background color, and otherwise only calls `super`.
- [./index.ts](./index.ts): Exports the scene model and controller for `MainApp.tsx`.
