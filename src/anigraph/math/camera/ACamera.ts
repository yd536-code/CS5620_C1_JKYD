import {AObject, AObjectState} from "../../base";
import {AniGraphDefines} from "../../defines";
import {NodeTransform3D} from "../nodetransforms";
import {Mat4, V2, V4, Vec2, Vec3, Vec4} from "../linalg";
import * as THREE from "three";
import {TransformationInterface3D, TransformationInterface} from "../TrasnformationInterface";
import {Camera} from "three";
import {VertexArray3D} from "../../geometry";
import {CameraProjectionKind, OrthographicProjection, PerspectiveProjection} from "./CameraProjection";


// export const ZNEAR:number = AniGraphDefines.DefaultZNear;
// export const ZFAR:number = AniGraphDefines.DefaultZFar;

/** Event names a camera signals. */
export enum CamUpdateEvents{
    POSE_UPDATED='CAMERA_POSE_UPDATED',
    PROJECTION_UPDATED='CAMERA_PROJECTION_UPDATED',
}


/** The kinds of camera projection. */
export enum CAMERA_PROJECTION_TYPES{
    PERSPECTIVE = 'PERSPECTIVE',
    ORTHOGRAPHIC = 'ORTHOGRAPHIC'
}


/**
 * Base class for cameras: a pose (the camera's transform in world space) plus a projection matrix and the frustum
 * settings it is built from (`lrbt` = near-plane left/right/bottom/top, `zNear`, `zFar`, `zoom`). The camera looks
 * down its local -z axis, with +y up. `viewMatrix` is the inverse of the pose; `PV` = projection * view maps world
 * points to NDC.
 *
 * The pose and projection are `@AObjectState`, so replacing them (`pose = ...`, `setProjection(...)`) notifies
 * listeners such as {@link ACameraClass.addPoseListener}. Editing the pose in place (e.g. `setPosition`, or
 * `camera.pose.position.x = 1`) does not notify pose listeners.
 * @typeParam T The pose type.
 */
export abstract class ACameraClass<T extends TransformationInterface3D> extends AObject{
    /** Event names the camera signals (e.g., `PROJECTION_UPDATED` from `_setProjection`). */
    static CameraUpdateEvents = CamUpdateEvents;
    static DEFAULT_NEAR = AniGraphDefines.DefaultZNear;
    static DEFAULT_FAR = AniGraphDefines.DefaultZFar;
    /** The camera's pose. */
    abstract get transform():T;
    // abstract setTransform(transform:T):void;
    /** The projection types (`PERSPECTIVE`, `ORTHOGRAPHIC`). */
    static PROJECTION_TYPE = CAMERA_PROJECTION_TYPES;

    /** The shared {@link OrthographicProjection} used by every orthographic camera. */
    static ORTHOGRAPHIC_PROJECTION: CameraProjectionKind = new OrthographicProjection();
    /** The shared {@link PerspectiveProjection} used by every perspective camera. */
    static PERSPECTIVE_PROJECTION: CameraProjectionKind = new PerspectiveProjection();

    _projectionType!:CAMERA_PROJECTION_TYPES;

    /** Whether this is a perspective or orthographic camera. */
    get projectionType(){
        return this._projectionType;
    }

    /**
     * The {@link CameraProjectionKind} for this camera's current `projectionType`. `updateProjection()` and
     * `CreateThreeJSCamera()` use it. Throws if the projection type is not set.
     */
    get _projectionKind(): CameraProjectionKind {
        switch (this.projectionType) {
            case ACameraClass.PROJECTION_TYPE.ORTHOGRAPHIC:
                return ACameraClass.ORTHOGRAPHIC_PROJECTION;
            case ACameraClass.PROJECTION_TYPE.PERSPECTIVE:
                return ACameraClass.PERSPECTIVE_PROJECTION;
            default:
                throw new Error("Unknown projection type: " + this.projectionType);
        }
    }

    fixedImagePlaneWidth!:number;

    @AObjectState _pose:T;
    @AObjectState protected _projection:Mat4;
    @AObjectState zoom!:number;
    @AObjectState lrbt:number[];
    @AObjectState zNear!:number;
    @AObjectState zFar!:number;



    // @AObjectState _pose:T;
    // protected _projection:Mat4;
    // zoom!:number;
    // lrbt:number[];
    // zNear!:number;
    // zFar!:number;

    /**
     * Returns the pose a new camera starts with. (Lets the base-class constructor create a pose of the subclass's
     * type.)
     */
    abstract _DefaultPose():T;
    /** Sets this camera's projection, pose, and projection type from a three.js camera. */
    abstract setWithThreeJSCamera(camera:THREE.Camera):void;

    /** The camera's position in world space. Setting it calls `setPosition` (an in-place pose edit). */
    get position(){
        return this.pose.getPosition();
    }

    set position(value:Vec3){
        this.setPosition(value);
    }

    /**
     * The pose as a {@link NodeTransform3D}: the live pose if it is one; otherwise logs an error and returns a
     * decomposed copy.
     */
    get nodeTransform():NodeTransform3D{
        if(this._pose instanceof NodeTransform3D){
            return this._pose as NodeTransform3D;
        }else{
            console.error(`trying to use camera.nodeTransform when pose is set to a Matrix transformation! ${this._pose}`);
            return NodeTransform3D.FromMatrix(this._pose as unknown as Mat4);
        }
    }

    /** Returns a copy of the pose as a {@link NodeTransform3D} (decomposing it if the pose is a matrix). */
    getPoseAsNodeTransform(){
        if(this._pose instanceof NodeTransform3D){
            return this._pose.clone() as NodeTransform3D;
        }else{
            return NodeTransform3D.FromMatrix(this._pose.getMat4());
        }
    }

    /** The camera's transform in world space (the live object). Assigning a new pose notifies pose listeners. */
    get pose(){return this._pose;}
    set pose(p:T){
        this._pose = p;
    }
    /**
     * The projection matrix. Assigning it here does not update `lrbt`/`zNear`/`zFar` or signal
     * `PROJECTION_UPDATED`; use `setProjection` for that.
     */
    get projection(){return this._projection;}
    set projection(p:Mat4){
        this._projection = p;
    }

    /** Near-plane left edge, `lrbt[0]` (similarly `frustumRight`, `frustumBottom`, `frustumTop`). */
    get frustumLeft(){return this.lrbt[0];}
    get frustumRight(){return this.lrbt[1];}
    get frustumBottom(){return this.lrbt[2];}
    get frustumTop(){return this.lrbt[3];}



    /** Returns the pose. */
    getPose(){return this.pose;}
    /** Returns the projection matrix. */
    getProjection(){return this.projection;}
    /** Returns the inverse of the projection matrix (computed each call). */
    getProjectionInverse(){return this.projection.getInverse();}
    /** The pose's matrix (camera space to world space). */
    get modelMatrix(){return this.pose.getMatrix();}
    /** The view matrix (world space to camera space): the inverse of the pose's matrix. */
    get viewMatrix(){return this.pose.getMat4().getInverse();}
    /** Projection times view: maps world-space points to clip space (NDC after homogenizing). */
    get PV(){return this.projection.times(this.viewMatrix);}

    /** The camera's right direction (local +x) in world space. */
    get right(){return this.pose._getQuaternionRotation().getLocalX();}
    /** The camera's up direction (local +y) in world space. */
    get up(){return this.pose._getQuaternionRotation().getLocalY();}
    /** The camera's backward direction (local +z) in world space. */
    get backward(){return this.pose._getQuaternionRotation().getLocalZ();}
    /** The direction the camera looks (local -z) in world space. */
    get forward(){return this.backward.times(-1);}


    // abstract onCanvasResize(width:number, height:number):void;

    /** Width divided by height of the near plane. */
    get aspect(){
        let wh = this._nearPlaneWH;
        return wh.x/wh.y;
    }

    /**
     * Recomputes the projection matrix from `lrbt`, `zoom`, `zNear`, and `zFar` (through `_projectionKind`) and
     * signals `PROJECTION_UPDATED`. Call it after changing those settings (a `zoom` change calls it automatically).
     */
    // abstract updateProjection():void;
    updateProjection(): void {
        this._setProjection(this._projectionKind.matrix(this));
    }

    /** Sets the projection matrix and, unless `signalEvent` is false, signals `PROJECTION_UPDATED`. */
    _setProjection(projection:Mat4, signalEvent:boolean=true){
        this.projection = projection;
        if(signalEvent) {
            this.signalEvent(ACameraClass.CameraUpdateEvents.PROJECTION_UPDATED);
        }
    }

    /**
     * Creates a camera from a three.js camera, or from a pose and optional projection matrix. With no arguments, the
     * camera has the default pose, an identity projection, empty `lrbt`, and orthographic projection type. (When a
     * pose is given, the projection type is not set; the `Create...` factories set it.)
     */
    constructor(threeCamera?:THREE.Camera);
    constructor(pose?:TransformationInterface, projection?:Mat4);
    constructor(...args:any[])
    {
        super();
        this._pose = this._DefaultPose();
        this._projection = new Mat4()
        this.zoom = 1;
        this.lrbt=[];
        this.zNear=ACamera.DEFAULT_NEAR;
        this.zFar=ACamera.DEFAULT_FAR;

        if(args.length) {
            if (args[0] instanceof THREE.Camera) {
                this.setWithThreeJSCamera(args[0]);
            } else {
                this.setPose(args[0]);
                // this.pose = args[0];
            }
            if (args[1] && args[1] instanceof Mat4) {
                this.projection = args[1];
            }
        }else{
            this._projectionType = ACameraClass.PROJECTION_TYPE.ORTHOGRAPHIC;
        }
        const self = this;
        this.addStateKeyListener('zoom', ()=>{
            self.onZoomUpdate();
        })
    }

    /** Builds a new `THREE.Camera` of this camera's projection type (see {@link CameraProjectionKind.createThreeJSCamera}). */
    CreateThreeJSCamera(): Camera {
        return this._projectionKind.createThreeJSCamera(this);
    }



    /**
     * Calls `callback` when the pose is replaced (`pose = ...`, `setPose`). It does not fire for in-place edits of the
     * pose, such as `setPosition` or `camera.pose.position.x = 1`.
     * @returns A subscription handle.
     */
    addPoseListener(callback:(self:AObject)=>void, handle?:string, synchronous:boolean=true,){
        return this.addStateKeyListener('_pose', callback, handle, synchronous);
    }
    /** Calls `callback` when the projection matrix is replaced. Returns a subscription handle. */
    addProjectionListener(callback:(self:AObject)=>void, handle?:string, synchronous:boolean=true){
        return this.addStateKeyListener('_projection', callback, handle, synchronous);
    }

    /**
     * Sets the projection matrix (signaling `PROJECTION_UPDATED`) and recomputes `lrbt`, `zNear`, and `zFar` from it
     * by unprojecting NDC corners. Does not change `zoom` or the projection type.
     */
    setProjection(projection:Mat4){
        this._setProjection(projection);
        let pinv = this.projection.getInverse();
        let min = pinv.times(V4(-1.0,-1.0,-1.0, 1.0)).getHomogenized()
        let max = pinv.times(V4(1.0,1.0,-1.0, 1.0)).getHomogenized()
        let farpoint = pinv.times(V4(0.0,0.0,1.0,1.0)).getHomogenized();
        this.lrbt = [
            min.x,
            max.x,
            min.y,
            max.y,
        ]
        this.zNear = -min.z;
        this.zFar = -farpoint.z;
    }

    // setPose(pose:T){
    //     this.pose = pose;
    // }

    /** Replaces the pose (notifying pose listeners). */
    abstract setPose(pose:TransformationInterface):void;


    /** Sets the pose's position, in place (pose listeners are not notified). */
    setPosition(position:Vec3){
        this.pose.setPosition(position);
    }

    // setPosition(position:Vec3){
    //     let newPose = this.pose.clone();
    //     newPose.setPosition(position);
    //     this.setPose(newPose);
    // }

    /** Called when `zoom` is reassigned; recomputes the projection. */
    onZoomUpdate() {
        this.updateProjection();
    }


    /** The center of the near-plane rectangle `lrbt`, as a `Vec2`. */
    get _nearPlaneCenter(){
        return V2(this.frustumLeft,this.frustumBottom).plus(V2(this.frustumRight, this.frustumTop)).times(0.5);
    }
    /** The width and height of the near-plane rectangle `lrbt`, divided by `zoom`. */
    get _nearPlaneWH(){
        return V2(this.frustumRight, this.frustumTop).minus(V2(this.frustumLeft,this.frustumBottom)).times(1.0/this.zoom);
    }

    /** Returns the world-space point `p` projected to NDC (after homogenizing). A `Vec3` is treated as a point. */
    getProjectedPoint(p:Vec3|Vec4){
        let pointIn = (p instanceof Vec4)?p:p.Point3DH;
        return this.getWorldToNDC().times(pointIn).Point3D;
    }

    /**
     * Returns the world-space point on (just past) the near plane that lies on the camera ray through `p`: projects
     * `p` to NDC, sets its NDC z to `-1 + offset`, and unprojects.
     */
    getWorldSpaceProjectionOnNearPlane(p:Vec3|Vec4, offset:number=0.001){
        let pointIn = (p instanceof Vec4)?p:p.Point3DH;
        let proj = this.getWorldToNDC().times(pointIn).getHomogenized();
        proj.z=-1+offset;
        let npointh = this.getWorldToNDC().getInverse().times(proj);
        return npointh.Point3D;
    }


    /** Same as `PV`. */
    getWorldToNDC(){
        return this.PV;
    }

    /**
     * Returns a matrix with these columns, all in world coordinates:
     * - x column: the vector from the left of the near plane to the right of the near plane
     * - y column: the vector from the bottom of the near plane to the top of the near plane
     * - z column: the vector from the center of the near plane to the center of the far plane
     * - w column: the location of the middle of the near plane
     */
    _getNearPlaneMatrix(){
        let camPVMI = this.getWorldToNDC().getInverse();
        let maxMat = Mat4.Identity();
        // set depth of x and y columns to near plane
        maxMat.r2=new Vec4(-1,-1,1,0);
        // set homogeneous coords of columns to 1
        maxMat.r3=new Vec4(1,1,1,1);

        maxMat = camPVMI.times(maxMat);
        let minMat = Mat4.Scale3D(-1);
        // set depth of x y and z to near plane
        minMat.r2=new Vec4(-1,-1,-1,-1);
        // set homogeneous coords of columns to 1
        minMat.r3 = new Vec4(1,1,1,1);
        minMat = camPVMI.times(minMat);

        let rmat = new Mat4();
        rmat.c0=maxMat.c0.getHomogenized().minus(minMat.c0.getHomogenized());
        rmat.c1=maxMat.c1.getHomogenized().minus(minMat.c1.getHomogenized());
        rmat.c2=maxMat.c2.getHomogenized().minus(minMat.c2.getHomogenized());
        rmat.c3 = minMat.c3.getHomogenized();
        return rmat;
    }

    /**
     * Returns a matrix with these columns, all in world coordinates:
     * - x column: the vector from the left of the far plane to the right of the far plane
     * - y column: the vector from the bottom of the far plane to the top of the far plane
     * - z column: the vector from the center of the near plane to the center of the far plane
     * - w column: the location of the middle of the far plane
     */
    _getFarPlaneMatrix(){
        let camPVMI = this.getWorldToNDC().getInverse();
        let maxMat = Mat4.Identity();
        // set depth of x and y columns to far plane
        maxMat.r2=new Vec4(1,1,1,0);
        // set homogeneous coords of columns to 1
        maxMat.r3=new Vec4(1,1,1,1);
        maxMat = camPVMI.times(maxMat);
        let minMat = Mat4.Scale3D(-1);
        // set depth of x y and z to far plane
        minMat.r2=new Vec4(1,1,-1,1);
        // set homogeneous coords of columns to 1
        minMat.r3 = new Vec4(1,1,1,1);
        minMat = camPVMI.times(minMat);
        let rmat = new Mat4();
        rmat.c0=maxMat.c0.getHomogenized().minus(minMat.c0.getHomogenized());
        rmat.c1=maxMat.c1.getHomogenized().minus(minMat.c1.getHomogenized());
        rmat.c2=maxMat.c2.getHomogenized().minus(minMat.c2.getHomogenized());
        rmat.c3 = minMat.c3.getHomogenized();
        return rmat;
    }

    /**
     * Keeps the image from stretching when the canvas changes size: scales the left and right of `lrbt` so the
     * aspect ratio matches `width/height` (top and bottom are kept), then updates the projection.
     */
    onCanvasResize(width: number, height: number) {
        let oldAspect = this.aspect;
        let newAspect = width/height;
        // let newAspect = height/width;
        let ratio = newAspect/oldAspect;
        let newL = this.lrbt[0]*ratio;
        let newR = this.lrbt[1]*ratio;
        this.lrbt = [newL, newR, this.lrbt[2], this.lrbt[3]];
        this.updateProjection();
    }

    /**
     * Returns the x-y bounds of the region the camera sees, found by unprojecting the corners of the NDC square at
     * z = 0.9 (near the far plane). Used for 2D scenes.
     */
    _get2DSceneBounds(){
        let epsilon = 0.1;
        let PVinv = this.PV.getInverse();
        // let zval = 1-epsilon;
        // let zval = -1+epsilon;
        let zval = 1-epsilon;
        let corners = [
            PVinv.times(V4(-1,-1,zval,1)).Point3D,
            PVinv.times(V4(1,-1,zval,1)).Point3D,
            PVinv.times(V4(1,1,zval,1)).Point3D,
            PVinv.times(V4(-1,1,zval, 1)).Point3D,
        ]
        // this.verts.position.updateElements(corners);

        let verts = VertexArray3D.CreateForRendering(false, true);
        verts.addVertex(corners[0], undefined, V2(0,0));
        verts.addVertex(corners[1], undefined, V2(1,0));
        verts.addVertex(corners[2], undefined, V2(1,1));
        verts.addVertex(corners[3], undefined, V2(0,1));
        return verts.getBounds().getBoundsXY();
    }

}


/**
 * The standard camera, with a 3D pose (by default a {@link NodeTransform3D}). Create one with
 * `CreatePerspectiveFOV`, `CreatePerspectiveNearPlane`, or `CreateOrthographic`. {@link ACameraModel3D} wraps one.
 */
export class ACamera extends ACameraClass<TransformationInterface3D>{
    /** A new camera's pose: the identity {@link NodeTransform3D}. */
    _DefaultPose(): NodeTransform3D {
        return new NodeTransform3D();
    }
    /** Replaces the pose with `pose` (not copied), notifying pose listeners. */
    setPose(pose: TransformationInterface3D): void {
        this.pose = pose;
        // if(pose instanceof NodeTransform3D){
        //     this.pose = pose.clone();
        // }else{
        //     this.pose = NodeTransform3D.FromPoseMatrix(pose.getMat4());
        // }
    }

    /**
     * Returns a new camera with the same projection type, projection, and pose as `camera`. The pose is copied
     * (`camera.pose.clone()`), so moving either camera afterwards doesn't move the other.
     */
    static CopyOf(camera:ACamera){
        let newCamera = new this();
        newCamera._projectionType = camera._projectionType;
        newCamera.setProjection(camera.projection);
        // Copy the pose so that moving one camera doesn't move the other.
        newCamera.setPose(camera.pose.clone() as TransformationInterface3D);
        return newCamera;
    }

    /**
     * Copies a three.js camera's projection and pose (from its position/quaternion/scale, or from `camera.matrix` if
     * `matrixAutoUpdate` is off) and sets the projection type from its class.
     */
    setWithThreeJSCamera(camera: Camera): void {
        this.setProjection(Mat4.FromThreeJS(camera.projectionMatrix));
        if(camera.matrixAutoUpdate){
            this.setPose(NodeTransform3D.FromThreeJSObject(camera));
        }else{
            // this.setPose(Mat4.FromThreeJS(camera.matrix));
            this.setPose(NodeTransform3D.FromPoseMatrix(Mat4.FromThreeJS(camera.matrix)));
        }
        if(camera instanceof THREE.PerspectiveCamera){
            this._projectionType = ACameraClass.PROJECTION_TYPE.PERSPECTIVE;
        }else if(camera instanceof THREE.OrthographicCamera){
            this._projectionType = ACameraClass.PROJECTION_TYPE.ORTHOGRAPHIC;
        }
    }

    /** Same as `pose`. */
    get transform() {
        return this.pose;
    }

    /**
     * Creates a perspective camera from a vertical field of view.
     * @param fovy Vertical field of view, in radians.
     * @param aspect Width divided by height.
     * @param near Near plane distance (default `AniGraphDefines.DefaultZNear`).
     * @param far Far plane distance (default `AniGraphDefines.DefaultZFar`).
     */
    static CreatePerspectiveFOV(fovy: number, aspect: number, near?: number, far?: number){
        let camera = new this();
        camera.setProjection(Mat4.PerspectiveFromFOV(fovy, aspect, near, far));
        camera._projectionType = ACameraClass.PROJECTION_TYPE.PERSPECTIVE;
        return camera;
    }

    /** Creates a perspective camera from the near-plane rectangle and near/far distances. */
    static CreatePerspectiveNearPlane(left: number, right: number, bottom: number, top: number, near?: number, far?: number) {
        let camera = new this();
        camera.setProjection(Mat4.PerspectiveFromNearPlane(left, right, bottom, top, near, far));
        camera._projectionType = ACameraClass.PROJECTION_TYPE.PERSPECTIVE;
        return camera;
    }

    /** Creates an orthographic camera from the view box's left/right/bottom/top and near/far distances. */
    static CreateOrthographic(left:number, right:number, bottom:number, top:number, near?:number, far?:number){
        let camera = new this();
        camera.setProjection(Mat4.ProjectionOrtho(left, right, bottom, top, near??AniGraphDefines.DefaultZNear, far??AniGraphDefines.DefaultZFar));
        camera._projectionType = ACameraClass.PROJECTION_TYPE.ORTHOGRAPHIC;
        return camera;
    }

    /** Returns the x and y of the world point that the NDC point `(ndc.x, ndc.y, 0)` unprojects to. */
    convertNDCToWorld2D(ndc:Vec2){
        let w = this.PV.getInverse().times(new Vec4(ndc.x, ndc.y, 0.0, 1.0)).getHomogenized();
        return V2(w.x, w.y);

    }



}
