# SVGL tests

Jest tests for the SVGL pipeline. SVG text is parsed with jsdom's `DOMParser`; file loading is mocked.

## Contents:
- [./SVGLLoader.test.ts](./SVGLLoader.test.ts): `SVGLLoader.parse` gives paths inside nested `<g transform>` groups the combined `globalTransform`, and `SVGLLoader.load` calls its `onLoad`/`onProgress`/`onError` callbacks.
- [./SvgLToThreeJsObject.test.ts](./SvgLToThreeJsObject.test.ts): `createMeshesFromPath` makes fills transparent based on `fill-opacity` (not `stroke-opacity`), and `getSVGLTextFromFile` resolves with the text or rejects on a read error.
