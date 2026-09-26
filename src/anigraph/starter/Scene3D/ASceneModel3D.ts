import {AppState, ASerializable, Color, GetAppState, NodeTransform3D, TransformationInterface, V3, Vec2} from "../../index";
import {ABasicSceneModel} from "../index";
import {ACameraModel3D} from "../../scene/camera";
import {AModelGraph} from "../../scene/AModelGraph";
import {APointLightModel3D} from "../../scene/lights";


/**
 * Base class for a 3D app's scene model: the main data model of your application and the root of the hierarchy of
 * node models that make up the scene. Subclass it and implement the methods below; they run in this order:
 *
 * 1. `initAppState(appState)`: add control-panel controls (runs before anything else, before the camera exists).
 * 2. `PreloadAssets()`: load shaders, textures, and models. Call `await super.PreloadAssets()` first.
 * 3. `initCamera()`: create the camera, e.g. with `initPerspectiveCameraFOV(...)` (or `_initDefaultCamera()`).
 * 4. `initScene()`: create node models and add each top-level one with `this.addNode(node)`. (`addChild` throws on
 *    a scene model; under a node, use `parent.addChild(child)`.)
 *
 * After that, `timeUpdate(...)` runs once per frame (called by {@link ABasicSceneController}'s default
 * `onAnimationFrameCallback`, with `t = this.clock.currentTime`, the clock's time at that moment).
 *
 * @example
 * ```ts
 * initCamera(){
 *     this.initPerspectiveCameraFOV(Math.PI/2, 1.0);
 * }
 * async initScene(){
 *     this.addViewLight();
 *     this.cube = new MyCubeModel();
 *     this.addNode(this.cube);
 * }
 * ```
 */
@ASerializable("ASceneModel3D")
export abstract class ASceneModel3D extends ABasicSceneModel{

    /** The scene's camera, typed as the {@link ACameraModel3D} that the `initPerspectiveCamera*` helpers create. */
    get cameraModel():ACameraModel3D{
        return this._cameraModel as ACameraModel3D;
    }
    set cameraModel(cameraModel:ACameraModel3D){
        this._cameraModel = cameraModel;
    }

    /**
     * Per-frame model update; put your scene's time-based logic here (for example, call each node's `timeUpdate`).
     * The scene controller's default frame loop calls it with `t = this.clock.currentTime`; if you call it yourself
     * without a time, use `this.clock.currentTime`. The model's clock is separate from the controller's, so pausing it doesn't stop camera interaction.
     * @param args typically an optional time `t`, in seconds
     */
    abstract timeUpdate(...args:any[]): void;
    /**
     * Adds controls to the control panel. Add all of your controls here: this runs first, before assets load and
     * before the control panel is first drawn. The camera and nodes don't exist yet at this point.
     */
    abstract initAppState(appState:AppState):void;
    // PreloadAssets is inherited (concrete) from ABasicSceneModel. Overrides should call `await super.PreloadAssets()`
    // first, which is why it is not re-declared abstract here.

    /**
     * Creates the scene camera and adds it to the scene, typically with `initPerspectiveCameraFOV(...)` or
     * `_initDefaultCamera()`. Runs after `PreloadAssets` and before `initScene`.
     */
    abstract initCamera(...args:any[]):void;


    /**
     * A ready-made camera setup to call from `initCamera`: a perspective camera with a 90 degree vertical field of view
     * and aspect 1, at `(0,0,1)` looking at the origin with +y up.
     */
    _initDefaultCamera(){
        // const appState = GetAppState();
        // You can change your camera parameters here
        this.initPerspectiveCameraFOV(Math.PI/2, 1.0)
        // You can set its initial pose as well
        this.camera.setPose(NodeTransform3D.LookAt(V3(0,0,1), V3(), V3(0,1,0)))
    }

    // ── Perspective camera setup ───────────────────────────────────────────────────────────────────────────────
    // Each of these creates an ACameraModel3D, stores it in `cameraModel`, and adds it to the scene.

    /**
     * Creates a perspective camera from its near-plane rectangle and adds it to the scene as `cameraModel`.
     * `near`/`far` default to the app state's `zNear`/`zFar`.
     */
    initPerspectiveCameraNearPlane(left: number, right: number, bottom: number, top: number, near?: number, far?: number){
        this.cameraModel = ACameraModel3D.CreatePerspectiveNearPlane(left, right, bottom, top, near, far);
        this.addNode(this.cameraModel);
    }

    /**
     * Creates a perspective camera and adds it to the scene as `cameraModel`.
     * @param fovy vertical field of view, in radians
     * @param aspect width / height (the camera also updates this when the canvas is resized)
     * @param near defaults to the app state's `zNear`
     * @param far defaults to the app state's `zFar`
     */
    initPerspectiveCameraFOV(fovy: number, aspect: number, near?: number, far?: number){
        this.cameraModel = ACameraModel3D.CreatePerspectiveFOV(fovy, aspect, near, far);
        this.addNode(this.cameraModel);
    }

    // ── Point lights and the view light ────────────────────────────────────────────────────────────────────────

    /**
     * Creates an {@link APointLightModel3D} and adds it to the main model graph.
     * @returns the new light
     */
    addPointLight(transform?:TransformationInterface, color?:Color, intensity?:number, distance?:number, decay?:number){
        return this.addPointLightToModelGraph(this.modelGraph, transform, color, intensity, distance, decay);
    }

    /**
     * Creates an {@link APointLightModel3D} and adds it to the given model graph (an `AModelGraph` or the name of one).
     * Uses the main model graph if `modelGraph` is undefined.
     * @returns the new light
     */
    addPointLightToModelGraph(modelGraph?:AModelGraph|string, transform?:TransformationInterface, color?:Color, intensity?:number, distance?:number, decay?:number){
        let modelGraphObj = this.modelGraph;
        if(modelGraph instanceof AModelGraph){
            modelGraphObj = modelGraph;
        }else if(modelGraph !== undefined){
            modelGraphObj = this.getModelGraph(modelGraph);
        }
        const plight = new APointLightModel3D(transform, color, intensity, distance, decay);
        modelGraphObj.addChild(plight);
        return plight;
    }

    /**
     * A point light that follows the camera, created by `addViewLight()`. Handy for making sure something is lit,
     * especially while debugging.
     * @type {APointLightModel3D}
     */
    viewLight!:APointLightModel3D;
    static _VIEW_LIGHT_SUBSCRIPTION_KEY:string ="VIEW_LIGHT_CAMERA_UPDATE_SUB"

    /**
     * Creates `viewLight` (a white point light at the camera's pose) and keeps it at the camera's pose whenever the
     * camera's pose is replaced. Call it from `initScene`, after the camera exists.
     */
    addViewLight(){
        this.viewLight = this.addPointLight(this.camera.pose, Color.FromString("#ffffff"),1, 1, 1);
        this._attachViewLightToCamera();
    }

    /** Subscribes `viewLight` to camera pose changes (see `addViewLight`). */
    _attachViewLightToCamera(){
        const self = this;
        this.subscribe(this.camera.addPoseListener(()=>{
            self.viewLight.setTransform(self.camera.transform);
        }), ASceneModel3D._VIEW_LIGHT_SUBSCRIPTION_KEY);
    }
    /** Stops `viewLight` from following the camera. */
    _detachViewLightFromCamera(){
        this.unsubscribe(ASceneModel3D._VIEW_LIGHT_SUBSCRIPTION_KEY);
    }

    // async PreloadAssets(): Promise<void> {
    //     await super.PreloadAssets();
    // }




    // /**
    //  * This will add variables to the control panel
    //  * @param appState
    //  */
    // initAppState(appState:AppState){
    //     /**
    //      * The function below shows examples of very general ways to use app state and the control panel.
    //      */
    //     // AddExampleControlPanelSpecs(this);
    //
    //     /**
    //      * Optionally, you can add functions that will tell what should be displayed in the React portion of the GUI. Note that the functions must return JSX code, which means they need to be written in a .tsx file. That's why we've put them in a separate file.
    //      */
    //     // appState.setReactGUIContentFunction(UpdateGUIJSX);
    //     // appState.setReactGUIBottomContentFunction(UpdateGUIJSXWithCameraPosition);
    // }

    // initScene() is abstract (declared on ASceneModel): create your node models there and add each top-level one
    // with `this.addNode(node)`. See the class docstring.


    // TODO Remove below?
    // Example timeUpdate: uses `t` if given, otherwise the model's clock time.
    // timeUpdate(t?: number):void;
    // timeUpdate(...args:any[])
    // {
    //     let t = this.clock.time;
    //     if(args != undefined && args.length>0){
    //         t = args[0];
    //     }
    //
    //     /**
    //      * If you want to update the react GUI components
    //      */
    //     // GetAppState().updateComponents();
    // }
};
