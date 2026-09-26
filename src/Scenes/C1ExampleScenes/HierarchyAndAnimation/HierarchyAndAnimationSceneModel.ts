import {AppSceneModel2D} from "../../../anigraph/starter/App2D/AppSceneModel2D";
import {ANodeModel, AppState, V2, Vec2} from "../../../anigraph";
import {ArmModel, OrbitGroupModel, SpikyStarModel} from "./nodes";

/**
 * The scene model. It builds the scene graph, passes time and input on to the nodes, and adds the one control that
 * needs a node instance (the Spin! button). Each node's behavior lives in its own class.
 *
 * The scene graph it builds:
 * ```
 * scene
 *   ├── star: SpikyStarModel
 *   │     └── arm: ArmModel
 *   │           └── link 0 → link 1 → ... (each a child of the one before)
 *   └── orbit: OrbitGroupModel
 *         └── three moons
 * ```
 */
export class HierarchyAndAnimationSceneModel extends AppSceneModel2D{
    star!: SpikyStarModel;
    arm!: ArmModel;
    orbit!: OrbitGroupModel;

    /**
     * Adds the control-panel controls. Every control has to be added here (directly or through a node class's static
     * `SetAppState`), because the panel sizes itself to the controls it has when it is first drawn.
     * @param appState
     */
    initAppState(appState: AppState){
        super.initAppState(appState);
        SpikyStarModel.SetAppState(appState);
        ArmModel.SetAppState(appState);
        OrbitGroupModel.SetAppState(appState);

        // The one control added here rather than in a node class. A button calls a method on a particular node,
        // and `SetAppState` is static: it runs before any node exists. The arrow function looks up `this.orbit` when
        // the button is clicked, by which time `initScene` has created it.
        appState.addButton("Spin!", ()=>this.orbit?.spin());
    }

    /**
     * Builds the scene graph. This scene loads no files, so it doesn't override `PreloadAssets`.
     */
    async initScene(){
        this.star = new SpikyStarModel();
        this.star.prsa.position = V2(-5, 0);

        // The arm is a child of the star, attached at the tip of the star's first spike. Its position is in the
        // star's coordinates, so the arm stays on that tip as the star rotates and scales.
        this.arm = new ArmModel();
        this.arm.prsa.position = SpikyStarModel.FirstSpikeTip();
        this.star.addChild(this.arm);

        // Adding the star adds its whole subtree (the arm and its links). Only top-level nodes are added with
        // `addNode`; a scene model's `addChild` throws an error.
        this.addNode(this.star);

        this.orbit = new OrbitGroupModel();
        this.orbit.prsa.position = V2(5, 0);
        this.addNode(this.orbit);
    }

    /**
     * Called once per frame by the scene controller. Node `timeUpdate`s are not called automatically: call each one
     * that animates. (The arm doesn't animate by itself.)
     * @param t the current time, in seconds
     */
    timeUpdate(t: number){
        this.star.timeUpdate(t);
        this.orbit.timeUpdate(t);
    }

    /**
     * A mouse press, forwarded from the scene controller. The arm decides whether it was one of its links.
     * @param pickedNode the frontmost node under the cursor, if any
     */
    onPress(pickedNode: ANodeModel|undefined){
        this.arm.onPress(pickedNode);
    }

    /**
     * A drag, forwarded from the scene controller.
     * @param worldPoint the cursor, in world coordinates
     */
    onDrag(worldPoint: Vec2){
        this.arm.dragToward(worldPoint);
    }
}
