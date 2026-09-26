# C1ExampleScenes

2D example scenes for the C1 assignment, built on the Three.js `Scene2D` starter classes ([../../anigraph/starter/Scene2D/](../../anigraph/starter/Scene2D/README.md)). They follow the conventions in [../AniGraphSceneGuides.md](../AniGraphSceneGuides.md): each node model holds its own behavior, assets and controls, the scene model only handles interactions between nodes, and the controller only forwards input.

## Contents:
- [./StarterScene](./StarterScene/README.md): The blank template to copy for your own scene: one spinning shape with its own controls, a custom view, and thin scene model and controller.
- [./HierarchyAndAnimation](./HierarchyAndAnimation/README.md): Transforms and the scene graph: a spiky star with an articulated arm attached (press and drag links), an orbiting group with an eased Spin! button, and one of every kind of control-panel control.
- [./ShapesAndMaterials](./ShapesAndMaterials/README.md): A gallery of drawing techniques: polygon vs. triangle mesh, materials, textured quad, flipbook, SVG with draw order and visibility, animated line, custom graphic element; click an exhibit to hear and see it pulse.
- [./ParticlePlayground2D](./ParticlePlayground2D/README.md): Particle-system playground: move Lab Cat with WASD and fire particles with x. Students write `fire()` and `updateParticles()`.
- [./CopiesView](./CopiesView/README.md): A custom view that draws many copies of its model's shape (one graphic per copy, rebuilt when the count changes), with each copy's transform and color computed by the model.
- [./MouseInput](./MouseInput/README.md): Every kind of mouse input (hover, drag by a delta, shift-drag, right-click, drag end) and two interaction modes of your own, Edit and Create.
- [./AttachAndDetach](./AttachAndDetach/README.md): Moving a node to a new parent without moving it on screen: click a moon to take it out of a turning, scaled orbit, or put it back.
