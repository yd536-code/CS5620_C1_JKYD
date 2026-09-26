# Graphic Object

The backend-agnostic `AGraphicObject` interface and the Three.js base classes for renderable objects. (The Two.js implementations live in [../twojs/](../twojs/README.md).)

## Contents:
- [./__tests__/](./__tests__/README.md): Jest specs for `AGraphicElement`.
- [./AGraphicObject.ts](./AGraphicObject.ts): Backend-agnostic interface for graphic objects — the composable visual elements owned by a node view. Implemented by `AGLGraphicObject` (Three.js) and `ATwoJSGraphicObject` (Two.js).
- [./AGLGraphicObject.ts](./AGLGraphicObject.ts): Root abstract class for Three.js graphic objects. Defines the `HasThreeJSObject` interface, and provides `setMatrix`, `setColor`, and `onMaterialChange` hooks.
- [./AGraphicElement.ts](./AGraphicElement.ts): Abstract graphic element with a Three.js `BufferGeometry` and `Material`. Manages disposal, material attribute setting, and creation of mesh-based elements from vertex arrays.
- [./AGraphicGroup.ts](./AGraphicGroup.ts): Container that wraps a `THREE.Group` and tracks child `AGraphicObject` members, providing `add`, `remove`, and `mapOverMembers`.
- [./ASceneElement.ts](./ASceneElement.ts): Graphic group backed by a `THREE.Scene` rather than a `THREE.Group`, used as the top-level container for a render pass.
- [./index.ts](./index.ts): Barrel export for the graphicobject module.
