# ParticlePlayground2D

A 2D particle-system playground. You move Lab Cat around with the **WASD** keys and press **x** to fire particles from Lab Cat's position. Click the canvas first so it receives your key presses.

**You write two functions:** `fire()` and `updateParticles()` in [`nodes/LabCatParticlePlaygroundModel.ts`](nodes/LabCatParticlePlaygroundModel.ts). As shipped they are minimal: pressing x puts one particle, standing still, at Lab Cat's position, and pressing x again moves that same particle to wherever Lab Cat is now. Everything else (drawing, input, moving Lab Cat, the control panel) already works.

## How the scene is organized

AniGraph separates **models** (the data and behavior of the things in a scene) from **views** (the code that draws them) and the **controller** (which handles input and runs the frame loop). In this scene, all of the behavior is in one model, and the scene-level classes only connect things:

```
ParticlePlayground2DSceneController    input and frame loop; knows nothing about particles
        │  key presses, and "update to time t" once per frame
        ▼
ParticlePlayground2DSceneModel          creates the playground and forwards to it
        │
        ▼
LabCatParticlePlaygroundModel           ← all the behavior; your code goes here
   ├── emitter: ASVGLModel2D            Lab Cat, drawn by ASVGLView
   └── particleSystem: PlaygroundParticleSystemModel
          └── particles: PlaygroundParticle[]    drawn by PlaygroundParticleSystemView
```

### What happens each frame
1. The controller calls the scene model's `timeUpdate(t)`, which calls the playground's `timeUpdate(t)`.
2. The playground moves Lab Cat by its velocity: `position += velocity * dt`. Pressing w/a/s/d sets the velocity in that direction, and releasing the key stops motion in that direction. (This is with the **motionState** checkbox on; with it off, each w/a/s/d press moves Lab Cat one step directly and releasing does nothing.)
3. The playground calls `updateParticles(t)` (your code), which emits pending particles and updates the rest.
4. `updateParticles` calls `signalParticlesUpdated()`, and the particle view copies the new positions, sizes and colors to the GPU.

### How a particle gets emitted
1. Pressing x calls `fire()` (your code), which marks one particle by setting its `t0` to **-1**.
2. On the next frame, `updateParticles()` finds that particle and calls `emit()` on it.
3. `emit()` places the particle at Lab Cat's position, sets `t0` to the current time, gives it the color and size from the control panel, and makes it visible.

Emission happens during the frame update rather than in `fire()`, so every particle's `t0` is a frame time.

### Particles are reused, never created
The particle system creates all 200 particles at the start and hides them, because the GPU needs to know the number of particles in advance. To "create" a particle, take a hidden one, set its fields, and make it visible. To "remove" one, hide it (`particle.visible = false`).

### A particle's fields
See [`nodes/PlaygroundParticle.ts`](nodes/PlaygroundParticle.ts): `position` (where it is drawn), `position0` (where it was emitted), `t0` (when it was emitted; -1 means "emit next frame"), `color` (its alpha is the opacity), `size`, and `visible`. A particle's age is `t - particle.t0`.

### Careful: vectors are objects
Assigning a `Vec2` (or `Color`) copies a reference to the same object, not the values. `emit()` uses `clone()` so that a particle gets its own copy of Lab Cat's position. Without it, the particle would move whenever Lab Cat moves. Keep this in mind when you set `position` in your own code: `particle.position = particle.position0` makes the two fields one object, so changing one changes the other.

## Control panel
- **ParticleColor** and **ParticleSize**: applied to each particle when it is emitted.
- **LabCatMoveSpeed**: how fast WASD moves Lab Cat, in world units per second.
- **motionState**: on, holding w/a/s/d moves Lab Cat until you release the key. Off (default), each press moves Lab Cat one step (the distance it would travel in 0.1 s at LabCatMoveSpeed). Toggling it stops any ongoing motion.
- **variable1** and **variable2**: general-purpose sliders (0 to 1) for your own experiments. `updateParticles()` shows how to read them.

To add your own controls (for example, a lifespan), add them in `LabCatParticlePlaygroundModel.SetAppState` and read them with `GetAppState().getState(name)`.

## Contents:
- [./nodes](./nodes/README.md): The playground model, the particle class, and the particle system's model and view.
- [./ParticlePlayground2DSceneModel.ts](./ParticlePlayground2DSceneModel.ts): Thin scene model. Creates the playground and forwards time and keys to it.
- [./ParticlePlayground2DSceneController.ts](./ParticlePlayground2DSceneController.ts): Thin scene controller. Registers views, forwards keyboard input, and runs the frame loop.
- [./index.ts](./index.ts): Exports the scene model and controller for `MainApp.tsx`.
