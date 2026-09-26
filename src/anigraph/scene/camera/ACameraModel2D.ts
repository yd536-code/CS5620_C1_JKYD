/**
 * @file The camera for 2D scenes.
 */
import {ASerializable} from "../../base";
import {ANodeModel2D} from "../nodeModel/ANodeModel2D";
import {ACamera} from "../../math";
import {V2, Vec2, Vec4} from "../../math/linalg";
import {GetAppState} from "../../appstate";
import {applyWithCamera, CameraModelInterface} from "./WithCamera";

/** Adds the {@link CameraModelInterface} members that `applyWithCamera` copies onto the class (see `WithCamera.ts`). */
export interface ACameraModel2D extends CameraModelInterface {
}

/**
 * A 2D scene's camera, as a 2D scene-graph node. `ASceneModel2D`'s orthographic camera setup creates one, and
 * `PanZoomController2D` pans and zooms it.
 *
 * The camera's pose is this node's own 2D transform (inherited from {@link ANodeModel2D}); move the camera by
 * editing its transform like any other node. The wrapped {@link ACamera} (`camera`) is used only for projection
 * (frustum, `zoom`, resizing). Its own pose is 3D, is not connected to this node's transform, and stays at its
 * default, so `forward`/`right`/`up` from {@link CameraModelInterface} describe that default pose, not this node's.
 */
@ASerializable("ACameraModel2D")
export class ACameraModel2D extends ANodeModel2D {
    protected _camera!: ACamera;

    /** @param camera the `ACamera` that provides the projection; a default `ACamera` is created if omitted */
    constructor(camera?: ACamera, ...args: any[]) {
        super();
        this._camera = camera ?? new ACamera();
        // Re-signal the wrapped camera's projection changes as this node's `PROJECTION_UPDATED` event, which is what
        // `addCameraProjectionListener` listens to (see `WithCamera.ts`). `ACameraModel3D` does the same.
        const self = this;
        this.subscribe(this._camera.addProjectionListener(() => {
                self.signalEvent(ACamera.CameraUpdateEvents.PROJECTION_UPDATED);
            }),
            ACamera.CameraUpdateEvents.PROJECTION_UPDATED + '_' + this.serializationLabel
        );
    }

    /**
     * Converts a cursor position in normalized device coordinates to a world-space point, using the projection and
     * this node's *world* transform (embedded as a `Mat4` with `getWorldRenderMatrix()`), so the result follows the
     * camera's pan and zoom. {@link ASceneController.getWorldCoordinatesOfCursorEvent} uses this.
     */
    ndcToWorld(ndc: Vec2): Vec2 {
        let worldToNDC = this.camera.projection.times(this.getWorldRenderMatrix().getInverse());
        let w = worldToNDC.getInverse().times(new Vec4(ndc.x, ndc.y, 0.0, 1.0)).getHomogenized();
        return V2(w.x, w.y);
    }

    /**
     * Creates an orthographic camera model for a 2D scene.
     * @param left the x coordinate of the left edge of the frustum in eye coordinates
     * @param right the x coordinate of the right edge of the frustum in eye coordinates
     * @param bottom the y coordinate of the bottom frustum edge in eye coordinates
     * @param top the y coordinate of the top frustum edge in eye coordinates
     * @param near the distance of the near plane (in front of the camera)
     * @param far the distance of the far plane (in front of the camera)
     * @returns the new camera model. Near and far default to the app state's `orthoZNear`/`orthoZFar`.
     */
    static CreateOrthographic(left: number, right: number, bottom: number, top: number, near?: number, far?: number) {
        let appState = GetAppState();
        near = near ?? appState.orthoZNear;
        far = far ?? appState.orthoZFar;
        let camera = ACamera.CreateOrthographic(left, right, bottom, top, near, far);
        return new ACameraModel2D(camera);
    }
}

applyWithCamera(ACameraModel2D);
