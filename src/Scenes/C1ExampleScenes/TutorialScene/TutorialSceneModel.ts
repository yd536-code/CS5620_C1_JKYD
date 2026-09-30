import {ASceneModel2D} from "../../../anigraph/starter/Scene2D/ASceneModel2D";
import {AppState} from "../../../anigraph";

/**
 * The tutorial scene's model. It starts out empty: each method below is where a step of the C1 tutorial adds code.
 * The scene model builds the scene out of node models, passes time and input on to them, and handles anything that
 * involves several nodes at once. Anything about a single node goes in that node's model class, in `./nodes`.
 */
export class TutorialSceneModel extends ASceneModel2D{

    /**
     * 1st: adds control-panel controls. Runs before assets load and before the panel is first drawn.
     * Step 3.1 of the tutorial adds the first control here.
     * @param appState the app state, which holds the value of every control
     */
    initAppState(appState: AppState){
        super.initAppState(appState);
    }

    /**
     * 2nd: loads files (images, SVGs, sounds). Always call `super` first: it loads the standard materials.
     * Step 6.1 of the tutorial loads the first file here.
     */
    async PreloadAssets(): Promise<void> {
        await super.PreloadAssets();
    }

    /**
     * 3rd: builds the scene, adding each top-level node with `this.addNode(node)`.
     * Step 1.1 of the tutorial adds your first node here.
     */
    async initScene(){
    }

    /**
     * Called once per frame by the scene controller. Node `timeUpdate`s are not called automatically: call each one
     * from here. Step 2.1 of the tutorial adds the first call.
     * @param t the current time, in seconds
     */
    timeUpdate(t: number){
    }
}
