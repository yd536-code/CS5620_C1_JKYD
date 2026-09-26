# ParticlePlayground2D nodes

The models and views for the particle playground. `LabCatParticlePlaygroundModel` holds all of the scene's behavior, and it is the file you edit. The particle classes are data and drawing only. See the [scene README](../README.md) for how the pieces fit together.

## Contents:
- [./LabCatParticlePlaygroundModel.ts](./LabCatParticlePlaygroundModel.ts): The playground model. A group node whose children are Lab Cat (`emitter`) and the particle system. It loads the assets, adds the control-panel sliders, moves Lab Cat with WASD (one step per key event, or by a velocity when the motionState checkbox is on), and contains `fire()` and `updateParticles()` (student code) and `emit()`.
- [./PlaygroundParticle.ts](./PlaygroundParticle.ts): The data for one particle: `position`, `position0`, `t0`, `color`, `size`, `visible`.
- [./PlaygroundParticleSystemModel.ts](./PlaygroundParticleSystemModel.ts): Holds the fixed set of particles and their material. Data only.
- [./PlaygroundParticleSystemView.ts](./PlaygroundParticleSystemView.ts): Draws each visible particle as `gradientParticle.png`, tinted by its color and scaled by its size.
- [./index.ts](./index.ts): Re-exports the classes above.
