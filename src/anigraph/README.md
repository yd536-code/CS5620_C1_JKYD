# AniGraph Source Code

AniGraph is organized as a set of modules under this directory. The core architecture is Model-View-Controller: node models form a scene graph, views translate models into rendering calls for a particular backend (Three.js or Two.js), and controllers manage interaction and the render loop.

The modules build on each other in roughly this order, lowest-level first: [base/](./base/README.md) provides the reactive-object and serialization infrastructure everything else is built on; [math/](./math/README.md) and [geometry/](./geometry/README.md) provide backend-agnostic numeric and shape data; [rendering/](./rendering/README.md) turns that data into actual draw calls on a specific backend; [scene/](./scene/README.md) ties models, views, and a backend's render window together into the running scene graph; and [interaction/](./interaction/README.md), [time/](./time/README.md), [appstate/](./appstate/README.md), and [components/](./components/README.md) supply the input handling, animation clock, global app state, and React glue that a scene controller coordinates each frame. [effects/](./effects/README.md), [physics/](./physics/README.md), [fileio/](./fileio/README.md), and [audio/](./audio/README.md) are higher-level, more optional modules (particle effects, particle physics data types, asset loading, and sound) that scenes opt into as needed, and [starter/](./starter/README.md) packages the common setup for both backends into reusable base classes so a new scene mostly just subclasses starter code rather than wiring the lower-level modules together from scratch.

## Contents:
- [./__tests__/](./__tests__/README.md): Engine-wide Jest specs (for example, which names the top-level barrel exports).
- [./base/](./base/README.md): Core framework infrastructure, including [AObjects](./base/aobject/README.md), [ASerializable](./base/aserial/README.md), abstract [MVC classes](./base/amvc/README.md), and [event handlers](./base/aevents/README.md).
- [./math/](./math/README.md): Math library (vectors, matrices, transforms, cameras, color).
- [./geometry/](./geometry/README.md): Vertex arrays, bounding boxes, polygons, and 3D model wrappers.
- [./scene/](./scene/README.md): The scene graph — model graph, scene models/views/controllers, cameras, lights, and node model/view base classes.
- [./rendering/](./rendering/README.md): Rendering infrastructure — contexts, render windows, graphic objects, materials, and shaders — with Three.js and Two.js backends.
- [./interaction/](./interaction/README.md): Input handling — pointer, drag, click, wheel, keyboard, and interaction modes.
- [./appstate/](./appstate/README.md): Global application state and the GUI control panel.
- [./components/](./components/README.md): React components for embedding AniGraph render windows and controls.
- [./effects/](./effects/README.md): Visual effect systems (particle systems, instanced particles).
- [./physics/](./physics/README.md): Physics data types and particle definitions.
- [./fileio/](./fileio/README.md): Asset loading — 3D models, textures, shaders, and SVG files.
- [./audio/](./audio/README.md): Audio management using Howler.js.
- [./time/](./time/README.md): Animation clock and time interpolation utilities.
- [./starter/](./starter/README.md): Starter/template classes for building new AniGraph applications.
- [./controlpanel/](./controlpanel/README.md): Building blocks for the Leva-based GUI control panel — `GUISpecs`' spec-builder helpers and `AControlSpecGroup`, the class `AAppState`'s control methods (and `ANodeModel`/`AShaderModel`'s `getInstanceControlSpecGroup`/`getClassControlSpecGroup` hooks) are built on.
- [./basictypes.ts](./basictypes.ts): Shared basic types — constructor/class interfaces, scene graph events, shader uniform types.
- [./defines.ts](./defines.ts): Global constants (default scale, near/far planes) and texture-key helpers.
- [./index.ts](./index.ts): Barrel export for the anigraph module.
