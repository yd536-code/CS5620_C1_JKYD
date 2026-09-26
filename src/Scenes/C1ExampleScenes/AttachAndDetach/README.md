# AttachAndDetach

Moving a node to a **new parent without moving it on screen**.

**What you see:** a planet with five moons, all children of a group node that turns (and is scaled up 1.5×).

**What you can do:**
- **Click an orbiting moon** to detach it. It becomes a top-level node, and stays exactly where it was, at the same angle and size, but stops orbiting.
- **Click a detached moon** to attach it to the orbit again. It doesn't move when you click; it orbits from where it is.

## Why it takes more than `reparent`
A node's transform is **relative to its parent**: a node is drawn with its *world* transform, which is its parent's world transform times its own. So changing the parent changes where the node is drawn, even though its own transform didn't change. A moon detached with `reparent` alone would jump to where its old transform puts it in world coordinates (closer to the center, smaller, and at a different angle).

To keep it in place, `ReparentKeepingWorldTransform` in the scene model:
1. reads the node's world transform **before** reparenting (afterwards it would include the new parent's);
2. reparents it;
3. sets its transform to `newParentWorld⁻¹ · oldWorld`, so that `newParentWorld · transform = oldWorld`.

The product is a `Mat3`. The moon's transform is a PRSA (position, rotation, scale, anchor), and `setTransform` turns the matrix back into position, rotation and scale, so `moon.prsa` still works afterwards. (That works because rotations and uniform scales never produce shear.)

**Top-level nodes** are children of the scene's model graph, `this.modelGraph` in the scene model. That's where `addNode` puts them, and it has no transform of its own, so a top-level node's world transform is just its own transform.

## Where the code goes
Moving a node between parents involves two nodes, so it's the scene model's job (`detach`, `attach`). The orbit only knows how to turn; the moons know nothing at all.

## Removing a behavior
| Behavior | Code | Also remove |
|---|---|---|
| Attaching again | `attach`, and the `else` branch in `onPick` | |
| The orbit's scale (to see the simpler case) | the `this.prsa.scale = ...` line in `OrbitModel` | |

## Contents:
- [./nodes](./nodes/README.md): The orbit (a turning, scaled group node with a planet and moons) and the moon.
- [./AttachAndDetachSceneModel.ts](./AttachAndDetachSceneModel.ts): Builds the orbit, and moves a clicked moon out of it or back in, keeping its world transform (`ReparentKeepingWorldTransform`).
- [./AttachAndDetachSceneController.ts](./AttachAndDetachSceneController.ts): View specs, background color, and click picking.
- [./index.ts](./index.ts): Exports the scene model and controller for `MainApp.tsx`.
