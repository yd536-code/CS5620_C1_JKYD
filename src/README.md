# src

Source root for the AniGraph reference implementation and the CS4620 example/course applications built on it.

## Contents:
- [./anigraph/](./anigraph/README.md): The AniGraph engine itself — scene graph, math, rendering, interaction, and starter classes.
- [./Component/](./Component/README.md): App-level React components used by `MainApp.tsx` to lay out the canvas and GUI.
- [./Scenes/](./Scenes/README.md): Applications (scenes) built on AniGraph — the C1 example scenes and the guides for writing your own.
- [./Tests/](./Tests/README.md): A scratch Jest file and shared custom Jest matchers. (Engine tests live in `__tests__/` folders under `anigraph/`.)
- [./MainApp.tsx](./MainApp.tsx): Root React component. Selects which scene's `AppClasses` to run (via commented-out imports), builds the app state and control panel, and lays out the canvas/GUI.
- [./index.tsx](./index.tsx): App entry point — imports global styles/fonts and mounts `MainApp` into the `#root` DOM element via React's `createRoot`.
- [./index.css](./index.css): Global CSS reset and base page/body styling.
- [./decs.d.ts](./decs.d.ts): Empty TypeScript ambient-declarations placeholder.
- [./react-app-env.d.ts](./react-app-env.d.ts): Create React App's default type-reference declaration file.
