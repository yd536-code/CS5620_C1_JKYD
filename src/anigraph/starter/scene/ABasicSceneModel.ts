import {ASerializable} from "../../base";
import {ASceneModel} from "../../scene/ASceneModel";
import {AppState} from "../../appstate";
import {AssetManager} from "../../fileio";


/**
 * Shared base for the starter scene models ({@link ASceneModel2D}, {@link ASceneModel3D}). Adds `getTexture` (a
 * shortcut for `AssetManager.getTexture`) and a helper for a model play-speed slider on top of {@link ASceneModel}.
 * Most students extend one of the App scene models rather than this class directly.
 */
@ASerializable("ABasicSceneModel")
export abstract class ABasicSceneModel extends ASceneModel{
    // sceneScale is inherited from ASceneModel.
    // The view light (`viewLight`, `addViewLight`) is on ASceneModel3D, since point lights are 3D-only.

    /**
     * Returns the texture that was loaded under `name` with `AssetManager.loadTexture`, or `undefined` if none was.
     * This is a shortcut for `AssetManager.getTexture(name)`.
     * @param name the texture's name (by default, `loadTexture` names a texture after its file name)
     */
    getTexture(name:string){
        return AssetManager.getTexture(name);
    }

    /**
     * Adds a "ModelPlaySpeed" slider (0 to 10, default 1) that sets the model clock's `rate`, to speed up, slow down,
     * or pause the scene's animation. Call it from `initAppState`.
     */
    addTimeRateAppStateControl(appState:AppState){
        const STATEKEY = "ModelPlaySpeed"
        appState.addSliderIfMissing(STATEKEY, 1, 0, 10, 0.001);
        const self = this;
        this.subscribeToAppState(STATEKEY, (value:number)=>{
            self.clock.rate = value;
        })
    }

    /** Loads assets before the scene is built (by default, the standard shaders). Overrides should call
     * `await super.PreloadAssets()` first. */
    async PreloadAssets(){
        await super.PreloadAssets();
    }
    /** Adds control-panel controls. Runs first, before assets load and before the camera exists. */
    abstract initAppState(appState:AppState):void;

}

