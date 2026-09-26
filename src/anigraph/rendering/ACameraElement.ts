import {ACamera, ACameraClass, Mat4, TransformationInterface} from "../math";
import {HasThreeJSObject} from "./graphicobject";
import * as THREE from "three";
import {AniGraphDefines} from "../defines";

/**
 * An {@link ACamera} paired with a Three.js camera. Whenever the camera's pose is reassigned, the pose, projection,
 * and inverse projection are copied into the Three.js camera's matrices (its `matrixAutoUpdate` is off).
 */
export class ACameraElement extends ACamera implements HasThreeJSObject{
    protected _threejs!:THREE.Camera;
    /** The Three.js camera. */
    get threejs(){
        return this._threejs;
    }

    /** Returns the Three.js camera. */
    getThreeJSCamera(){
        return this.threejs;
    }

    /**
     * Wraps an existing Three.js camera, or builds one from a pose and projection. With no arguments, uses the
     * default {@link ACamera} and creates a matching Three.js camera.
     */
    constructor(threeCamera?:THREE.Camera);
    constructor(pose?:TransformationInterface, projection?:Mat4);
    constructor(...args:any[]){
        if(args.length>0){
            if(args[0] instanceof THREE.Camera){
                super(args[0]);
                this._setThreeJS(args[0]);
            }else{
                super((args[0] as TransformationInterface).getMat4(), args[1]);
                this._setThreeJS(this.CreateThreeJSCamera());
            }
        }else{
            super();
            this._setThreeJS(this.CreateThreeJSCamera());
        }
        const self = this;
        this.addPoseListener((pose)=>{
            self.pose.assignTo(self.threejs.matrix);
            self.projection.assignTo(self.threejs.projectionMatrix);
            self.projection.getInverse().assignTo(self.threejs.projectionMatrixInverse);
        })

    }

    /** Sets the wrapped Three.js camera and turns off its `matrixAutoUpdate`. */
    _setThreeJS(camera:THREE.Camera){
        this._threejs = camera;
        this._threejs.matrixAutoUpdate=false;
    }

    /** Creates a perspective camera whose near plane spans the given left/right/bottom/top bounds. */
    static CreatePerspectiveNearPlane(left: number, right: number, bottom: number, top: number, near?: number, far?: number) {
        let camera = new this();
        camera.setProjection(Mat4.PerspectiveFromNearPlane(left, right, bottom, top, near, far));
        camera._projectionType = ACameraClass.PROJECTION_TYPE.PERSPECTIVE;
        camera._setThreeJS(camera.CreateThreeJSCamera());
        return camera;
    }

    /** Creates an orthographic camera with the given bounds (near/far default to `AniGraphDefines.DefaultOrthoZNear/Far`). */
    static CreateOrthographic(left:number, right:number, bottom:number, top:number, near?:number, far?:number) {
        let camera = new this();
        camera.setProjection(Mat4.ProjectionOrtho(left, right, bottom, top, near??AniGraphDefines.DefaultOrthoZNear, far??AniGraphDefines.DefaultOrthoZFar));
        camera._projectionType = ACameraClass.PROJECTION_TYPE.ORTHOGRAPHIC;
        camera._setThreeJS(camera.CreateThreeJSCamera());
        return camera;
    }



}



