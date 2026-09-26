import {AppState} from "../../index";
import {ABasicSceneModel} from "../index";
import {ACameraModel2D} from "../../scene/camera";

/**
 * Base class for a 2D (Three.js) app's scene model: the main data model of your application and the root of the
 * hierarchy of node models that make up the scene.
 *
 * This is the 2D starter scene model that 2D scenes extend. It builds on {@link ABasicSceneModel}, which in turn
 * builds on the engine's general `ASceneModel`; for a 2D scene, extend `ASceneModel2D`, not `ASceneModel`.
 *
 * Subclass it and override the methods below; they run in this order:
 *
 * 1. `initAppState(appState)`: add control-panel controls (runs before anything else, before the camera exists).
 * 2. `PreloadAssets()`: load shaders, textures, and models. Call `await super.PreloadAssets()` first.
 * 3. `initCamera()`: creates the camera. The default is an orthographic {@link ACameraModel2D} of half-size
 *    `sceneScale`.
 * 4. `initScene()`: create node models and add each top-level one with `this.addNode(node)`. (`addChild` throws on
 *    a scene model; under a node, use `parent.addChild(child)`.)
 *
 * After that, `timeUpdate(t)` is where per-frame model logic goes. {@link ASceneController2D}'s default frame loop
 * calls it once per frame with the model clock's current time (`clock.currentTime`). Node models' `timeUpdate`s are
 * not called automatically: call them from here.
 *
 * @example
 * ```ts
 * async initScene(){
 *     this.shape = new MyShapeModel();
 *     this.addNode(this.shape);
 * }
 * ```
 */
export abstract class ASceneModel2D extends ABasicSceneModel{

    /**
     * The scene's camera, typed as the {@link ACameraModel2D} that `initCamera` creates. It is a 2D node, so you can
     * move it with `this.cameraModel.prsa` and zoom with `this.cameraModel.camera.zoom`.
     */
    get cameraModel():ACameraModel2D{
        return this._cameraModel as ACameraModel2D;
    }
    set cameraModel(cameraModel:ACameraModel2D){
        this._cameraModel = cameraModel;
    }

    /** Loads assets before the scene is built. Overrides should call `await super.PreloadAssets()` first. */
    async PreloadAssets(): Promise<void> {
        await super.PreloadAssets();
    }

    /**
     * Creates the scene camera: an orthographic camera spanning `[-scale, scale]` in x and y. (When the canvas is
     * resized, the camera widens or narrows the x range to match the canvas's aspect ratio.)
     * @param scale half the visible width/height in world units. Defaults to `sceneScale`.
     */
    initCamera(scale?:number) {
        this.initUniformOrthographicCamera(scale??this.sceneScale);
    }

    // ── Orthographic camera setup ──────────────────────────────────────────────────────────────────────────────
    // Each of these creates an ACameraModel2D (a 2D node), stores it in `cameraModel`, and adds it to the scene.

    /**
     * Creates an orthographic camera with the given view volume and adds it to the scene as `cameraModel`.
     * `near`/`far` default to the app state's `orthoZNear`/`orthoZFar`.
     */
    initOrthographicCamera(left:number, right:number, bottom:number, top:number, near?:number, far?:number){
        this.cameraModel = ACameraModel2D.CreateOrthographic(left, right, bottom, top, near, far);
        this.addNode(this.cameraModel);
    }

    /** Creates an orthographic camera spanning `[-1, 1]` in x and y and adds it to the scene as `cameraModel`. */
    initNormalizedOrthographicCamera(){
        this.cameraModel = ACameraModel2D.CreateOrthographic(-1, 1, -1, 1);
        this.addNode(this.cameraModel);
    }

    /**
     * Creates an orthographic camera spanning `[-scale, scale]` in x and y and adds it to the scene as
     * `cameraModel`.
     * @param scale defaults to 1.
     */
    initUniformOrthographicCamera(scale?:number, near?:number, far?:number){
        scale = scale??1.0;
        this.cameraModel = ACameraModel2D.CreateOrthographic(-scale, scale, -scale, scale, near, far);
        this.addNode(this.cameraModel);
    }

    /**
     * Creates an orthographic camera spanning `[-scale*aspect, scale*aspect]` in x and `[-scale, scale]` in y and adds
     * it to the scene as `cameraModel`.
     * @param scale defaults to 1.
     */
    init2DOrthoCamera(scale?:number, near:number=-1, far:number=1, aspect:number=1){
        scale = scale??1.0;
        this.cameraModel = ACameraModel2D.CreateOrthographic(-scale*aspect, scale*aspect, -scale, scale, near, far);
        this.addNode(this.cameraModel);
    }

    /**
     * Adds controls to the control panel. Add all of your controls here: this runs first, before assets load and
     * before the control panel is first drawn. The camera and nodes don't exist yet at this point.
     * The default does nothing; overrides should still call `super.initAppState(appState)`.
     * @param appState
     */
    initAppState(appState:AppState){
        /**
         * The function below shows examples of very general ways to use app state and the control panel.
         */
        // AddExampleControlPanelSpecs(this);

        /**
         * Optionally, you can add functions that will tell what should be displayed in the React portion of the GUI. Note that the functions must return JSX code, which means they need to be written in a .tsx file. That's why we've put them in a separate file.
         */
        // appState.setReactGUIContentFunction(UpdateGUIJSX);
        // appState.setReactGUIBottomContentFunction(UpdateGUIJSXWithCameraPosition);
    }

    // initScene() is abstract (declared on ASceneModel): create your node models there and add each top-level one
    // with `this.addNode(node)`. See the class docstring.

    // To convert a cursor to world coordinates, use the controller's `getWorldCoordinatesOfCursorEvent(event)` or
    // `this.cameraModel.ndcToWorld(ndc)`.

    /**
     * Per-frame model update. Override it with your scene's time-based logic (for example, call each node's
     * `timeUpdate`). The default does nothing.
     *
     * {@link ASceneController2D}'s default `onAnimationFrameCallback` calls it once per frame with
     * `this.clock.currentTime` (the clock's time at that moment). The model runs on its own clock (`this.clock`), separate from the controller's, so pausing
     * the model doesn't stop camera interaction.
     * @param t the time to update to. Overrides usually read it as their first argument; when it is omitted, use
     * `this.clock.currentTime`.
     */
    timeUpdate(t?: number):void;
    timeUpdate(..._args:any[])
    {
        /**
         * If you want to update the react GUI components
         */
        // GetAppState().updateComponents();
    }
};
