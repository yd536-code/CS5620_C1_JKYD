# Base

This is the foundation layer every other AniGraph module builds on — it defines what an object *is* in this engine before any scene-graph, rendering, or math concerns come in. [./aevents/](./aevents/README.md) provides the low-level handle-based callback/subscription primitives (`ACallbackSwitch`, `AEventCallbackDict`). [./aobject/](./aobject/README.md) builds on that to define `AObject` (reactive, valtio-backed state plus a named-event API) and `AObjectNode` (adds parent/child tree structure with structural events), which together are the base class nearly everything else — models, views, controllers, the asset manager, particles — ultimately extends, along with the standalone `ASelection` selection container. [./amvc/](./amvc/README.md) defines the abstract, backend-agnostic `AModel`/`AView`/`AController` triad that concrete Three.js/Two.js scene code specializes, plus the glue types that map model classes to view classes. [./aserial/](./aserial/README.md) provides the `@ASerializable` decorator and a name-keyed class registry that lets any of these objects round-trip through JSON as the correct concrete class rather than a plain object.

## Contents:
- [./aevents/](./aevents/README.md): Callback switches and event callback dictionaries for the reactive event system.
- [./amvc/](./amvc/README.md): Abstract base classes for the Model-View-Controller pattern (`AModel`, `AView`, `AController`, and related types).
- [./aobject/](./aobject/README.md): Base object types including `AObject` (reactive state via valtio), `AObjectNode` (tree nodes), selections, and tag support.
- [./aserial/](./aserial/README.md): The `@ASerializable` decorator and class registry for serialization.
- [./index.ts](./index.ts): Barrel export for the base module.