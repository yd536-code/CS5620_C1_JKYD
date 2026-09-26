import {ASceneModel2D} from "../../../anigraph/starter/Scene2D/ASceneModel2D";
import {ANodeModel, ANodeModel2D, AObjectNode, Mat3, V2} from "../../../anigraph";
import {MoonModel, OrbitModel} from "./nodes";

/**
 * # Moving a node to a new parent without moving it on screen
 *
 * Click a moon that is orbiting, and it is *detached*: it becomes a top-level node, stays exactly where it was (same
 * position, rotation and size on screen), and stops orbiting. Click a detached moon, and it is *attached* to the
 * orbit again, also without moving, and orbits from there.
 *
 * Changing a node's parent changes what its transform means, because a node's transform is relative to its parent.
 * So the scene model also changes the transform, to keep the node's **world** transform the same
 * (`ReparentKeepingWorldTransform`).
 */
export class AttachAndDetachSceneModel extends ASceneModel2D{
    orbit!: OrbitModel;

    /**
     * Moves `node` under `newParent` without moving it on screen.
     *
     * A node is drawn with its world transform: its parent's world transform times its own transform. To keep the
     * world transform the same under a new parent, the node's own transform must become
     * `newParentWorld⁻¹ · oldWorld`.
     * - Read the old world transform **before** reparenting. Afterwards it would include the new parent's transform.
     * - The node's transform is a PRSA (position, rotation, scale, anchor), and the product is a `Mat3`. `setTransform`
     *   turns the matrix back into position, rotation and scale (which works because there is no shear), so the
     *   node's `prsa` still works afterwards.
     * @param node the node to move
     * @param newParent a node, or the scene's model graph (for a top-level node, whose world transform is its own)
     */
    static ReparentKeepingWorldTransform(node: ANodeModel2D, newParent: AObjectNode){
        const oldWorld = node.getWorldTransform();
        node.reparent(newParent);
        const newParentWorld = (newParent instanceof ANodeModel2D) ? newParent.getWorldTransform() : Mat3.Identity();
        node.setTransform(newParentWorld.getInverse().times(oldWorld));
    }

    /**
     * Builds the scene: the orbit, with its planet and moons. This scene has no controls and loads no files.
     */
    async initScene(){
        this.orbit = new OrbitModel();
        this.orbit.prsa.position = V2(0, 0);
        this.addNode(this.orbit);
    }

    /**
     * Called once per frame by the scene controller. Only the orbit animates; attached moons move with it, and
     * detached moons stay still.
     * @param t the current time, in seconds
     */
    timeUpdate(t: number){
        this.orbit.timeUpdate(t);
    }

    /**
     * A click, forwarded from the scene controller with the node under the cursor. Clicking a moon detaches it if it
     * is in the orbit, and attaches it if it isn't. Clicking anything else does nothing.
     * @param pickedNode the frontmost node under the cursor, if any
     */
    onPick(pickedNode: ANodeModel|undefined){
        if(!(pickedNode instanceof MoonModel)){
            return;
        }
        if(pickedNode.parent === this.orbit){
            this.detach(pickedNode);
        }else{
            this.attach(pickedNode);
        }
    }

    /**
     * Takes a moon out of the orbit and makes it a top-level node, where it is.
     * @param moon
     */
    detach(moon: MoonModel){
        // Top-level nodes are children of the scene's model graph (that is where `addNode` puts them).
        AttachAndDetachSceneModel.ReparentKeepingWorldTransform(moon, this.modelGraph);
    }

    /**
     * Puts a moon back in the orbit, where it is.
     * @param moon
     */
    attach(moon: MoonModel){
        AttachAndDetachSceneModel.ReparentKeepingWorldTransform(moon, this.orbit);
    }
}
