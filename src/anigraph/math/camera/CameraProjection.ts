import * as THREE from "three";
import {Mat4} from "../linalg";
import type {ACameraClass} from "./ACamera";

/**
 * The math for one kind of camera projection (orthographic or perspective): turns the frustum settings stored on
 * {@link ACameraClass} (`lrbt`, `zNear`, `zFar`, `zoom`) into a projection matrix and a matching `THREE.Camera`.
 * The settings themselves stay on the camera, since other code (e.g., `onCanvasResize`, `aspect`,
 * {@link ACameraElement}) reads them directly.
 *
 * Implementations have no state of their own: every camera of a kind shares one instance
 * (`ACameraClass.ORTHOGRAPHIC_PROJECTION`/`PERSPECTIVE_PROJECTION`), picked by the camera's `projectionType`.
 */
export interface CameraProjectionKind {
    /**
     * The projection matrix for `camera`'s current `lrbt`/`zNear`/`zFar`/`zoom`. Only the orthographic case is
     * affected by `zoom` (through `_nearPlaneWH`); the perspective case uses `lrbt` directly.
     * @param camera The camera whose current frustum settings to use.
     * @returns A new projection matrix.
     */
    matrix(camera: ACameraClass<any>): Mat4;

    /**
     * Builds a `THREE.Camera` of the matching kind from `camera`'s current state. The two kinds differ here: the
     * perspective case copies `camera`'s current projection matrix and pose onto the new `THREE.PerspectiveCamera`,
     * while the orthographic case builds a `THREE.OrthographicCamera` from `lrbt`/`zNear`/`zFar` (ignoring `zoom`)
     * and leaves its pose at the identity. Callers that need the right pose and projection overwrite them afterward,
     * as `ACameraView.update()` does for every camera.
     * @param camera The camera to build a `THREE.Camera` for.
     * @returns A new `THREE.Camera`.
     */
    createThreeJSCamera(camera: ACameraClass<any>): THREE.Camera;
}

/** Orthographic projection: builds its matrix from the near plane's center and size, scaled by `1/zoom`. */
export class OrthographicProjection implements CameraProjectionKind {
    matrix(camera: ACameraClass<any>): Mat4 {
        const center = camera._nearPlaneCenter;
        const wh = camera._nearPlaneWH.times(0.5);
        return Mat4.ProjectionOrtho(center.x - wh.x, center.x + wh.x, center.y - wh.y, center.y + wh.y, camera.zNear, camera.zFar);
    }

    createThreeJSCamera(camera: ACameraClass<any>): THREE.Camera {
        return new THREE.OrthographicCamera(camera.lrbt[0], camera.lrbt[1], camera.lrbt[3], camera.lrbt[2], camera.zNear, camera.zFar);
    }
}

/** Perspective projection: builds its matrix from `lrbt` directly, so (unlike orthographic) `zoom` has no effect on it. */
export class PerspectiveProjection implements CameraProjectionKind {
    matrix(camera: ACameraClass<any>): Mat4 {
        return Mat4.PerspectiveFromNearPlane(camera.lrbt[0], camera.lrbt[1], camera.lrbt[2], camera.lrbt[3], camera.zNear, camera.zFar);
    }

    createThreeJSCamera(camera: ACameraClass<any>): THREE.Camera {
        const perspective = new THREE.PerspectiveCamera();
        camera.getProjection().assignTo(perspective.projectionMatrix);
        camera.getProjectionInverse().assignTo(perspective.projectionMatrixInverse);
        camera.transform.getMat4().assignTo(perspective.matrix);
        camera.transform.getMat4().assignTo(perspective.matrixWorld);
        perspective.matrixWorldInverse.copy(perspective.matrixWorld).invert();
        return perspective;
    }
}
