# SVGL

A three-stage pipeline for turning an SVG file into scene-graph-ready geometry for ThreeJS scenes, kept separate from [../AModelLoader3D.ts](../AModelLoader3D.ts) because SVG needs its own parser rather than a Three.js loader. (Named "SVGL" — SVG for ThreeJS — to distinguish it from Two.js's own, unrelated SVG rendering backend in [../../rendering/twojs/](../../rendering/twojs/README.md).) `SVGLLoader` (based on Three.js's own `SVGLoader`) parses raw SVG text into an `SVGLParsedData` tree of paths with node hierarchy and local/global transforms preserved. `SvgLToThreeJsObject.ts` walks that tree and builds a real `THREE.Object3D` group from it, with helpers for setting per-mesh matrix attributes and centering the result. `SVGLAsset` wraps the finished object as an `AObject3DModelWrapper`, normalizing it to unit width and flipping its coordinate system to match AniGraph's convention (SVG's y-axis points down; AniGraph's does not) on load. [./node/](./node/README.md) is the layer above this: the actual scene-graph node model/view classes that place an `SVGLAsset` into a scene.

## Contents:
- [./__tests__/](./__tests__/README.md): Jest tests for SVG parsing (nested group transforms, `load` callbacks) and for mesh/material creation and file reading in `SvgLToThreeJsObject.ts`.
- [./node/](./node/README.md): Scene-node model/view/graphic classes for rendering SVG assets in the scene graph.
- [./SVGLAsset.ts](./SVGLAsset.ts): Wraps a parsed SVG as an `AObject3DModelWrapper`. Normalizes the asset to unit width and handles coordinate-flip on load.
- [./SVGLLoader.ts](./SVGLLoader.ts): Custom SVG loader (based on Three.js SVGLoader) that parses SVG text into an `SVGLParsedData` tree with paths, node hierarchy, and local/global transforms.
- [./SvgLToThreeJsObject.ts](./SvgLToThreeJsObject.ts): Converts an `SVGLParsedData` tree into a `THREE.Object3D` group, including helper utilities for setting matrix attributes and centering objects.
- [./index.ts](./index.ts): Barrel export for the svgl module.
