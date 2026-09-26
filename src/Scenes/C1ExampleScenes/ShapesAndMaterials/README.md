# ShapesAndMaterials

A gallery of seven exhibits, each showing one way to put something on the screen. There's no game logic here; it's a reference to copy from.

**Click any exhibit:** it plays a pop and pulses (the scene model finds the clicked exhibit, which plays the sound and animates itself). The control panel has a slider or checkbox for each exhibit that has settings, and a **Background** dropdown that switches between a plain color and a space image.

| Where | Exhibit | What it shows | Code |
|---|---|---|---|
| top, 1st | Star as a polygon | The outline only; three.js decides how to fill it with triangles, so the vertex colors blend unevenly. | `ColorWheel.CreatePolygon()` (`PolygonModel2D` + `PolygonView2D`) |
| top, 2nd | Star as a triangle mesh | Same outline plus a white center vertex, with triangles listed explicitly (`addTriangleIndices`), so colors blend smoothly from the center. | `ColorWheel.CreateMesh()` (`AMeshModel2D` + `A2DMeshView`) |
| top, 3rd | Textured quad | An image on a square with texture coordinates, scaled to the image's aspect ratio. | `TexturedQuad.Create()` |
| top, 4th | Flipbook | A square that switches between ten images over time. **FlipbookFPS** sets the speed. | `FlipbookModel` |
| bottom, 1st | SVG, draw order, visibility | Vector Lab Cat over a square with a flat ("basic") color. **LabCatDepth** sets Lab Cat's `zValue` (in front or behind); **ShowLabCat** sets `visible`. | `LayeringModel` |
| bottom, 2nd | Animated line | A sine wave through 40 points, each with its own color. **LineWidth** sets the thickness. | `WaveLineModel` + `WaveLineView` |
| bottom, 3rd | Custom graphic element | A pentagon whose view adds a small RGB triangle (`VertexMarkerGraphic`) at each vertex. | `MarkedShapeModel` + `MarkedShapeView` |

## Things to notice
- **Polygon vertices go clockwise.** Every polygon here lists its vertices clockwise (a negative angle step). `APolygonGraphic2D` needs that: three.js reverses counter-clockwise outlines when it fills them, which scrambles per-vertex colors.
- **Materials decide how pixels are colored.** `AssetManager.CreateBasicMaterial(color)` paints one flat color; `AssetManager.Create2DRGBAMaterial()` blends the vertices' colors; `AssetManager.Create2DTextureMaterial(texture)` paints an image using the vertices' texture coordinates.
- **You don't always need your own class.** Three exhibits are plain engine classes (a `PolygonModel2D` and two `AMeshModel2D`s) built by small factory functions, and `LayeringModel` uses a plain `ASVGLModel2D` child. A class of your own is worth it when a node has behavior (`FlipbookModel`, `WaveLineModel`) or needs its own view (`MarkedShapeModel`).
- **Every model class that appears in the scene needs a view spec,** including engine classes, because specs match the model's exact class. See `initModelViewSpecs` in the controller.
- **Picking:** the controller asks `getNodeModelAtCursor(event)` which node is under the cursor and hands it to the scene model, which walks up the scene graph to the enclosing `ExhibitModel`.
- **Files are loaded before the scene is built.** Each class that needs files has a static `PreloadAssets`, and the scene model calls them all from its own.

## How the scene is organized
```
ShapesAndMaterialsSceneController   view specs, background, click → getNodeModelAtCursor → model.onPick(node)
        │
        ▼
ShapesAndMaterialsSceneModel        creates and lays out the exhibits; forwards time; finds the clicked exhibit
        │
        ▼
ExhibitModel × 7                    group node: position on the grid, pop sound, pulse animation
   └── content                      the thing on display (one of the exhibits in the table above)
```

## Contents:
- [./nodes](./nodes/README.md): The exhibit group node and the classes and factories for each exhibit.
- [./ShapesAndMaterialsSceneModel.ts](./ShapesAndMaterialsSceneModel.ts): Adds the controls (each node class's, plus the Background dropdown), loads the files, lays out the exhibits, forwards time, and passes a picked node on to its exhibit.
- [./ShapesAndMaterialsSceneController.ts](./ShapesAndMaterialsSceneController.ts): Registers a view spec for every model class, sets the background from the dropdown, and turns clicks into picks.
- [./index.ts](./index.ts): Exports the scene model and controller for `MainApp.tsx`.
