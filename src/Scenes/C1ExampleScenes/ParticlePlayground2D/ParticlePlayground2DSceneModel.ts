import {ASceneModel2D} from "../../../anigraph/starter/Scene2D/ASceneModel2D";
import {AppState} from "../../../anigraph";
import {LabCatParticlePlaygroundModel} from "./nodes";

/**
 * The scene model. It is deliberately thin: it creates the playground, adds it to the scene, and passes time and key
 * presses on to it. All of the playground's behavior is in `LabCatParticlePlaygroundModel`.
 */
export class ParticlePlayground2DSceneModel extends ASceneModel2D{
    /** The particle playground: Lab Cat plus its particle system. */
    playground!: LabCatParticlePlaygroundModel;

    /**
     * Adds the control-panel sliders. This runs first, before assets load and before the control panel is drawn.
     * Controls added any later don't fit in the panel. The playground defines its own sliders; we just ask it to add
     * them.
     * @param appState
     */
    initAppState(appState: AppState){
        super.initAppState(appState);
        LabCatParticlePlaygroundModel.SetAppState(appState);
    }

    /**
     * Loads files before the scene is built. The playground knows which files it needs, so we ask it to load them.
     */
    async PreloadAssets(): Promise<void> {
        await super.PreloadAssets();
        await LabCatParticlePlaygroundModel.PreloadAssets();
    }

    /**
     * Builds the scene. Adding the playground also adds its children (Lab Cat and the particle system), which it
     * created in its constructor.
     */
    async initScene(){
        this.playground = new LabCatParticlePlaygroundModel();
        this.addNode(this.playground);
    }

    /**
     * Called once per frame by the scene controller.
     * @param t the current time, in seconds
     */
    timeUpdate(t: number){
        this.playground.timeUpdate(t);
    }

    /** Key presses, forwarded from the scene controller. */
    onKeyDown(key: string){
        this.playground.onKeyDown(key);
    }

    /** Key releases, forwarded from the scene controller. */
    onKeyUp(key: string){
        this.playground.onKeyUp(key);
    }
}
