import {AGLNodeView} from "../nodeView";
import * as THREE from "three";
import {ALabel} from "../../base";
import {ACamera} from "../../math";
import type {ACameraModel2D} from "./ACameraModel2D";
import type {ACameraModel3D} from "./ACameraModel3D";

/** What `ACameraView` renders: a camera model node, 2D ({@link ACameraModel2D}) or 3D ({@link ACameraModel3D}). */
export type ACameraViewModel = ACameraModel2D | ACameraModel3D;

/** Subscription handle for the view's projection listener on its model. */
const CAMERA_VIEW_PROJECTION_LISTENER = "CAMERA_VIEW_PROJECTION_LISTENER";

/**
 * Three.js view for a camera model ({@link ACameraModel3D} or {@link ACameraModel2D}). Its render object is a
 * `THREE.Camera` created by the model's `ACamera`. `update()` copies the projection, the local matrix
 * (`.matrix`), and the world matrix (`.matrixWorld`, composed through the camera's parents) into it, so a
 * parented camera follows its parent. It also updates when the camera's projection changes.
 */
@ALabel("ACameraView")
export class ACameraView extends AGLNodeView{
// export class ACameraView extends _ANodeView{

    /** Creates a camera view connected to `model`. */
    static Create(model:ACameraViewModel){
        let cameraView = new ACameraView();
        cameraView.setModel(model);
        return cameraView;
    }

    /** The Three.js camera this view renders with. */
    get threeJSCamera():THREE.Camera{
        return this.threejs as THREE.Camera;
    }


    /**
     * Adds the usual node-view listeners plus one that calls `update()` when the camera's projection changes. The
     * projection listener is a subscription of this view, so it is removed when the view is released.
     */
    setModelListeners() {
        super.setModelListeners();
        const self = this;
        this.unsubscribe(CAMERA_VIEW_PROJECTION_LISTENER, false);
        this.subscribe(this.model.addCameraProjectionListener(()=>{
            self.update();
        }), CAMERA_VIEW_PROJECTION_LISTENER);
    }

    // get threejs():THREE.Camera{
    //     return this._threejs as THREE.Camera;
    // }

    get model():ACameraViewModel{
        return this._model as ACameraViewModel;
    }

    /** Connects this view to `model` and updates the Three.js camera right away. */
    setModel(model: ACameraViewModel) {
        super.setModel(model);
        this.update();
    }

    // setModelListeners(){
    //     const self=this;
    //     this.unsubscribe(BASIC_VIEW_SUBSCRIPTIONS.MODEL_STATE_LISTENER, false);
    //     this.subscribe(this.model.addStateListener(()=>{self.update()}));
    //     this.unsubscribe(BASIC_VIEW_SUBSCRIPTIONS.MODEL_RELEASE_LISTENER, false);
    //     this.subscribe(this.model.addEventListener(ANodeModel.Events.RELEASE, ()=>{self.dispose()}));
    // }

    /** Turns off Three.js's automatic matrix updates; `update()` sets the camera's matrices itself. */
    init():void{
        this.threejs.matrixAutoUpdate=false;
    }

    // updateTransform() {
    //     this.update();
    // }



    /** Copies the model's projection, local render matrix, and world render matrix into the Three.js camera. */
    update():void{
        // this.model.camera.getProjection().assignTo(this.threejs.projectionMatrix);
        // this.model.camera.getProjectionInverse().assignTo(this.threejs.projectionMatrixInverse);
        // this.model.camera.getPose().getMatrix().assignTo(this.threejs.matrix);
        // this.model.camera.getPose().getMatrix().assignTo(this.threejs.matrixWorld);
        // this.threejs.matrixWorldInverse.copy( this.threejs.matrixWorld).invert();

        // `.matrix` is this camera's *local* render matrix, as for every other AGLNodeView; `.matrixWorld` is the
        // *world* one, composed through the model-graph parent chain via `getWorldRenderMatrix()`, so a camera
        // parented under another node (or another camera) follows its parent's pose.
        this.model.camera.getProjection().assignTo(this.threeJSCamera.projectionMatrix);
        this.model.camera.getProjectionInverse().assignTo(this.threeJSCamera.projectionMatrixInverse);
        this.model.getRenderMatrix().assignTo(this.threeJSCamera.matrix);
        this.model.getWorldRenderMatrix().assignTo(this.threeJSCamera.matrixWorld);
        this.threeJSCamera.matrixWorldInverse.copy( this.threeJSCamera.matrixWorld).invert();
    }

    /**
     * Copies a given `ACamera`'s projection and pose into this view's Three.js camera, instead of the model's. Uses
     * the camera's pose for both `.matrix` and `.matrixWorld`, so parents are ignored.
     */
    updateWithCamera(camera:ACamera){
        camera.getProjection().assignTo(this.threeJSCamera.projectionMatrix);
        camera.getProjectionInverse().assignTo(this.threeJSCamera.projectionMatrixInverse);
        camera.transform.getMat4().assignTo(this.threeJSCamera.matrix);
        camera.transform.getMat4().assignTo(this.threeJSCamera.matrixWorld);
        this.threeJSCamera.matrixWorldInverse.copy( this.threeJSCamera.matrixWorld).invert();
    }

    /**
     * Disposes any graphics the view holds and removes the Three.js camera from its parent (see
     * `AGLNodeView.dispose`).
     */
    dispose(): void {
        super.dispose();
    }

    /** Creates the Three.js camera from the model's `ACamera`. */
    protected _initializeThreeJSObject(): void {
        // super._initializeThreeJSObject();
        this._threejs = this.model.camera.CreateThreeJSCamera();
        // this._threeJSCamera = this.model.camera.CreateThreeJSCamera();
        // this.threejs.add(this.threeJSCamera);
    }

}
