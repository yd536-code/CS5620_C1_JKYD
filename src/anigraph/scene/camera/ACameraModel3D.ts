/**
 * @file The camera for 3D scenes.
 * @author Abe Davis
 */
import * as THREE from "three";
import {AGroupCallbackSwitch, ASerializable} from "../../base";
import {V2, Vec3, Vec4} from "../../math/linalg";
import {ANodeModel3D} from "../nodeModel/ANodeModel3D";
import {ACamera, TransformationInterface3D} from "../../math";
import {GetAppState} from "../../appstate";
import {applyWithCamera, CameraModelInterface} from "./WithCamera";
import type {Vec2} from "../../math/linalg";

/** Adds the {@link CameraModelInterface} members that `applyWithCamera` copies onto the class (see `WithCamera.ts`). */
export interface ACameraModel3D extends CameraModelInterface {
}

/**
 * A 3D scene's camera, as a scene-graph node. The camera's pose is this node's own transform (inherited from
 * {@link ANodeModel3D}), so `getWorldTransform()`, `getRenderMatrix()`, and `getWorldRenderMatrix()` work as for any
 * node, and a camera parented under another node follows its parent. {@link ACameraView} renders it.
 *
 * The node also wraps an {@link ACamera} (`camera`), which holds the projection and does pose-dependent math
 * (`forward`/`right`/`up`, `viewMatrix`, `PV`). The node's transform and the camera's pose are kept in sync, and
 * after a sync they are the same object (`cameraModel.transform === camera.pose`):
 * - **Node to camera:** runs when the node's transform is replaced (`setTransform`, `setPose`, `setPosition`) or when
 *   `signalTransformUpdate()` is called explicitly. It calls `camera.setPose(transform)`.
 * - **Camera to node:** runs when the camera's pose is replaced (`camera.setPose(...)` or `camera.pose = ...`),
 *   so code that moves the camera through `sceneModel.camera` also moves this node.
 *
 * Because both sides share one object, an in-place edit (for example `cameraModel.prsa.position = ...`, or
 * `camera.setPosition(...)`, which edits the pose in place) changes both right away, and the rendered camera follows.
 * However, listeners added with `camera.addPoseListener` only hear about a pose that is *replaced*, not an in-place
 * edit. If other code listens to the camera's pose (for example, a light that follows the camera), move the camera
 * with `setPose`/`setTransform` so those listeners run.
 *
 * The two sync directions don't loop forever: each writes back the object it just received, and reassigning a state
 * key to its current value doesn't notify listeners.
 */
@ASerializable("ACameraModel3D")
export class ACameraModel3D extends ANodeModel3D {
    protected _camera!: ACamera;

    /** The camera's pose: this node's transform. */
    get pose() {
        return this.transform;
    }

    /** Sets the camera's pose. Same as `setTransform(pose)`. */
    setPose(pose: TransformationInterface3D) {
        this.setTransform(pose);
    }

    /** Moves the camera to `position`, keeping its rotation, by setting a modified copy of the transform. */
    setPosition(position: Vec3) {
        let newPose = this.transform.clone();
        newPose.setPosition(position);
        this.setTransform(newPose);
    }

    /**
     * @param camera the camera to wrap: an {@link ACamera}, or a `THREE.PerspectiveCamera` (which is wrapped in a new
     * `ACamera`). With no argument, the model wraps a default `new ACamera()` (identity projection); loading a saved
     * scene constructs camera models this way. Prefer the static `Create...` methods, which set up a real projection.
     * @throws Error if `camera` is some other kind of object (for example a non-perspective Three.js camera).
     */
    constructor(camera?: THREE.Camera | ACamera, ...args: any[]) {
        super();
        if (camera instanceof ACamera) {
            this._camera = camera;
        } else if (camera instanceof THREE.PerspectiveCamera) {
            this._camera = new ACamera(camera);
        } else if (camera === undefined) {
            this._camera = new ACamera();
        } else {
            throw new Error(`ACameraModel3D expects an ACamera or a THREE.PerspectiveCamera, but got ${camera}`);
        }
        this._setCameraListeners();
    }

    /**
     * Converts a cursor position in normalized device coordinates to a world-space point on this camera's `z = 0`
     * plane, using this node's *world* transform. The wrapped camera's pose is only the node's local transform, so
     * using the world transform makes this correct for a parented camera too. Same formula as
     * `ACamera.convertNDCToWorld2D`, with the world transform in place of the wrapped camera's pose.
     */
    ndcToWorld(ndc: Vec2): Vec2 {
        let worldToNDC = this.camera.projection.times(this.getWorldTransform().getMat4().getInverse());
        let w = worldToNDC.getInverse().times(new Vec4(ndc.x, ndc.y, 0.0, 1.0)).getHomogenized();
        return V2(w.x, w.y);
    }

    /**
     * Sets up the listeners that keep this node's transform and the wrapped camera's pose in sync (see the class
     * docs), plus one that re-signals the camera's projection changes as this node's `PROJECTION_UPDATED` event.
     * Called from the constructor.
     */
    _setCameraListeners() {
        const self = this;
        const TRANSFORM_SYNC_HANDLE = 'ACameraModel3D_transformSync_' + this.serializationLabel;
        const POSE_UPDATE_HANDLE = ACamera.CameraUpdateEvents.POSE_UPDATED + '_' + this.serializationLabel;
        const PROJECTION_UPDATE_HANDLE = ACamera.CameraUpdateEvents.PROJECTION_UPDATED + '_' + this.serializationLabel;
        this.unsubscribe(TRANSFORM_SYNC_HANDLE, false);
        this.unsubscribe(POSE_UPDATE_HANDLE, false);
        this.unsubscribe(PROJECTION_UPDATE_HANDLE, false);

        /*
        Mirror this node's local transform into the wrapped camera's pose, so `camera`'s pose-dependent math and
        direct users of `camera` (e.g. `forward`/`right`/`up`) see the current value -- and the other direction too,
        since some scenes and interaction modes set the pose on `camera` directly instead of through this model.
        See the class docs for why this doesn't loop.
         */
        /*
        Node to camera: syncs when `_transform` is replaced (the key listener) or when `signalTransformUpdate()` is
        called explicitly (the event listener, which skips the automatic events `autoTransformUpdate` sends). An
        in-place edit such as `prsa.position = ...` doesn't trigger a sync; it doesn't need one, since after a sync
        the transform and the camera's pose are the same object.
         */
        this.subscribe(new AGroupCallbackSwitch([
                this.addStateKeyListener("_transform", () => {
                    self.camera.setPose(self.transform);
                }),
                this.addTransformListener((_node, automatic?: boolean) => {
                    if (!automatic) {
                        self.camera.setPose(self.transform);
                    }
                }),
            ], TRANSFORM_SYNC_HANDLE),
            TRANSFORM_SYNC_HANDLE
        )
        self.camera.setPose(self.transform); // sync immediately too: the listeners only fire on future changes.
        this.subscribe(this.camera.addPoseListener(() => {
                self._transform = self.camera.getPose();
            }),
            POSE_UPDATE_HANDLE
        )
        this.subscribe(this.camera.addProjectionListener(() => {
                self.signalEvent(ACamera.CameraUpdateEvents.PROJECTION_UPDATED);
            }),
            PROJECTION_UPDATE_HANDLE
        );
    }

    /**
     * Creates a perspective camera model from a vertical field of view.
     * @param fovy vertical field of view, in radians
     * @param aspect width / height
     * @param near distance to the near plane (defaults to the app state's `zNear`)
     * @param far distance to the far plane (defaults to the app state's `zFar`)
     */
    static CreatePerspectiveFOV(fovy: number, aspect: number, near?: number, far?: number) {
        let appState = GetAppState();
        near = near ?? appState.zNear;
        far = far ?? appState.zFar;
        let camera = ACamera.CreatePerspectiveFOV(fovy, aspect, near, far)
        let cameraModel = new ACameraModel3D(camera);
        return cameraModel;
    }

    /**
     * Creates a perspective camera. Note that near and far are specified as distances, so positive looks forward, even though camera looks down negative z.
     * @param left the x coordinate of the left near edge of the frustum in eye coordinates
     * @param right the x coordinate of the right near edge of the frustum in eye coordinates
     * @param bottom the y coordinate of the bottom near frustum edge in eye coordinates
     * @param top the y coordinate of the top near frustum edge in eye coordinates
     * @param near the distance of the near plane in front of the camera (defaults to the app state's `zNear`)
     * @param far the distance of the far plane in front of the camera (defaults to the app state's `zFar`)
     */
    static CreatePerspectiveNearPlane(left: number, right: number, bottom: number, top: number, near?: number, far?: number) {
        let appState = GetAppState();
        near = near ?? appState.zNear;
        far = far ?? appState.zFar;
        let camera = ACamera.CreatePerspectiveNearPlane(left, right, bottom, top, near, far)
        return new ACameraModel3D(camera);
    }

    /**
     * Creates an orthographic camera. Note that near and far are specified as distances, so positive looks forward, even though camera looks down negative z.
     * @param left the x coordinate of the left edge of the frustum in eye coordinates
     * @param right the x coordinate of the right edge of the frustum in eye coordinates
     * @param bottom the y coordinate of the bottom frustum edge in eye coordinates
     * @param top the y coordinate of the top frustum edge in eye coordinates
     * @param near the distance of the near plane in front of the camera (defaults to the app state's `orthoZNear`)
     * @param far the distance of the far plane in front of the camera (defaults to the app state's `orthoZFar`)
     */
    static CreateOrthographic(left: number, right: number, bottom: number, top: number, near?: number, far?: number) {
        let appState = GetAppState();
        near = near ?? appState.orthoZNear;
        far = far ?? appState.orthoZFar;
        let camera = ACamera.CreateOrthographic(left, right, bottom, top, near, far)
        return new ACameraModel3D(camera);
    }
}

applyWithCamera(ACameraModel3D);
