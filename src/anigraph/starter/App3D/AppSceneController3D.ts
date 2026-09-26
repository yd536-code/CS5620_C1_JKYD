import {AppSceneModel3D} from "./AppSceneModel3D";
import {Color, Quaternion} from "../../index"
import {ABasicSceneController, ADebugInteractionMode} from "../index";
import {AMeshModel3D, ATriangleMeshView, UnitQuadModel3D, UnitQuadView3D} from "../../scene";
import {AVisiblePointLightModel3D, AVisiblePointLightView3D} from "../../scene/lights";
import {CoordinateAxesModel3D, CoordinateAxesView3D} from "../nodes/coordinateaxes";
import * as THREE from "three";

/**
 * Base class for a 3D app's scene controller. The scene controller handles keyboard and mouse input and keeps the
 * view hierarchy matched to the model hierarchy. Subclasses usually override:
 * - `initModelViewSpecs()`: say which view class to create for each of your model classes.
 * - `initInteractions()`: register interaction modes (the inherited default adds {@link ADebugInteractionMode}).
 * - `initScene()`: set the background color or a skybox (`initSkyBoxCubeMap`).
 *
 * The inherited `onAnimationFrameCallback` calls `model.timeUpdate()`, updates the controller, and renders.
 */
export abstract class AppSceneController3D extends ABasicSceneController{
    // onAnimationFrameCallback and initInteractions are inherited (concrete) from ABasicSceneController, so
    // subclasses can call `super.onAnimationFrameCallback(...)`/`super.initInteractions()`.

    get model():AppSceneModel3D{
        return this._model as AppSceneModel3D;
    }

    /**
     * Sets a black background, then runs the base setup (which calls `initInteractions()`). Override to change the
     * background color or add a skybox.
     * @returns {Promise<void>}
     */
    async initScene(): Promise<void> {
        this.setClearColor(Color.Black());
        await super.initScene();
    }

    /** The keys currently held down, according to the active interaction mode's keyboard interaction. */
    getKeysDownState(){
        return this.interactionMode.getKeyDownState();
    }

    /** Calls the inherited `initInteractions()` (which adds {@link ADebugInteractionMode}) and makes that mode current. */
    _basicInitInteractions() {
        super.initInteractions();

        /**
         * Add an instance of our custom interaction mode
         */
        // this.defineInteractionMode(InteractionModeClass.MODE_NAME, InteractionModeClass.Create(this));
        this.setCurrentInteractionMode(ADebugInteractionMode.NameInGUI);
    }




    /**
     * Specifies which view class to use for each model class. Registers the built-in 3D defaults (see
     * `_addDefaultModelViewSpecs`). If you create custom models and views, link them in your override by calling
     * `addModelViewSpec(ModelClass, ViewClass)` after `super.initModelViewSpecs()`.
     */
    initModelViewSpecs() {
        super.initModelViewSpecs();
        this._addDefaultModelViewSpecs();

        // Example:
        // this.addModelViewSpec(SplineModel, SplineView);
    }

    /**
     * Registers views for four built-in 3D node types: meshes, unit quads, visible point lights, and coordinate axes.
     * (Cameras, groups, point lights, and loaded models already have default views from the scene view.)
     */
    _addDefaultModelViewSpecs(){
        this.addModelViewSpec(AMeshModel3D, ATriangleMeshView);
        this.addModelViewSpec(UnitQuadModel3D, UnitQuadView3D);
        this.addModelViewSpec(AVisiblePointLightModel3D, AVisiblePointLightView3D);
        this.addModelViewSpec(CoordinateAxesModel3D, CoordinateAxesView3D);
    }

    /**
     * Loads a cube-map skybox and sets it as the scene's background.
     *
     * - With no arguments, loads the default Milky Way cube map and rotates it by -90 degrees about x.
     * - With `(path, format?, transform?)`, loads the six faces `path + 'px' + format`, `path + 'nx' + format`, ...,
     *   `path + 'nz' + format` (format defaults to `'.jpg'`).
     * - With `(urls, transform?)`, uses the six face URLs as given (px, nx, py, ny, pz, nz).
     *
     * In both forms, a given `transform` rotates the background (see `setBackgroundTransform`); without one, the
     * background isn't rotated.
     */
    initSkyBoxCubeMap(path?:string, format?:string, transform?:Quaternion, ...args:any[]):void;
    initSkyBoxCubeMap(urls?:string[], transform?:Quaternion, ...args:any[]):void;
    initSkyBoxCubeMap(...args:any[]){
        let urls=[];
        let DefaultPath = './images/cube/MilkyWay/dark-s_';
        let DefaultFormat = '.jpg';
        let transform:Quaternion|undefined;

        if(args.length>0){
            if(Array.isArray(args[0])){
                urls = args[0];
                if(args.length>1){
                    transform = args[1];
                }
            }else{
                let path = args[0]??DefaultPath;
                let format = '.jpg';
                if(args.length>1){
                    format = args[1]??format;
                }
                if(args.length>2){
                    transform = args[2];
                }
                urls = [
                    path + 'px' + format,
                    path + 'nx' + format,
                    path + 'py' + format,
                    path + 'ny' + format,
                    path + 'pz' + format,
                    path + 'nz' + format
                ];

            }
        }else {
            let path = DefaultPath;
            let format = DefaultFormat;
            transform = Quaternion.RotationX(-Math.PI*0.5);
            urls = [
                path + 'px' + format,
                path + 'nx' + format,
                path + 'py' + format,
                path + 'ny' + format,
                path + 'pz' + format,
                path + 'nz' + format
            ];
        }

        /**
         * If you want to change the skybox, you will need to provide the appropriate urls to the corresponding textures
         * from a cube map
         */
        const reflectionCube = new THREE.CubeTextureLoader().load( urls );
        this._setBackgroundCubeTexture(reflectionCube);
        if(transform!==undefined) {
            this.setBackgroundTransform(transform);
        }
    }

    // onAnimationFrameCallback(context:AGLContext) {
    //     /**
    //      * let's update the model...
    //      */
    //     // this.model.timeUpdate(this.model.clock.time);
    //
    //     /**
    //      * and let's update the controller...
    //      * This will mostly update any interactions that depend on time.
    //      * Keep in mind that the model and controller run on separate clocks for this, since we may
    //      * want to pause our model's clock and continue interacting with the scene (e.g., moving the camera around).
    //      */
    //     this.timeUpdate();
    //
    //     /**
    //      * Clear the rendering context.
    //      * you can also specify which buffers to clear: clear(color?: boolean, depth?: boolean, stencil?: boolean)
    //      * ``` this.renderer.clear(false, true); ```
    //      */
    //     context.renderer.clear();
    //
    //     // render the scene view
    //     context.renderer.render(this.getThreeJSScene(), this.getThreeJSCamera());
    // }



    // getWorldCoordinatesOfCursorEvent(event:AInteractionEvent){
    //     if(event.ndcCursor) {
    //         return this.model.cameraModel.ndcToWorld(event.ndcCursor);
    //     }else{
    //         return undefined;
    //     }
    // }

}
