# Component

App-level React components used by `MainApp.tsx` to lay out the canvas and GUI. (Framework-level components live in [../anigraph/components/](../anigraph/components/README.md).)

## Contents:
- [./examplecode/](./examplecode/README.md): Example scene-population code (`InitSceneExampleCode.ts` builds simple RGB triangle nodes).
- [./AContextComponent.tsx](./AContextComponent.tsx): Backend switch: renders `AGLContextComponent` or `ATwoJSContextComponent` for a given `ARenderWindow` based on the scene controller's `contextType`.
- [./MainComponent.tsx](./MainComponent.tsx): Bootstrap card that hosts the render window canvas (via `AContextComponent`) with a header slot for children.
- [./DefaultAppComponent.tsx](./DefaultAppComponent.tsx): Simple Bootstrap-grid wrapper used as the root layout when a scene does not provide its own `ComponentClass`.
- [./GUIComponent.tsx](./GUIComponent.tsx): Renders the application's custom GUI content (from `appState.getReactGUIContent()`) and re-renders when the app state signals a component update.
- [./style.ts](./style.ts): Styled-components layout definitions (`Layout`, `FullLayout`, `GUIBottomComponent`).
- [./index.ts](./index.ts): Barrel export for the Component module.
