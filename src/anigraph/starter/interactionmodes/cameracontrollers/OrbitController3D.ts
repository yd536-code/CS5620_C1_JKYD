import type {AInteractionEvent} from "../../../interaction";
import type {ADragInteraction} from "../../../interaction/ADragInteraction";
import {NodeTransform3D, Quaternion, Vec3} from "../../../math";
import type {CameraModelInterface} from "../../../scene/camera";
import type {ANodeModel} from "../../../scene/nodeModel";
import type {ACameraController} from "./ACameraController";

/**
 * Drag-to-rotate camera controls for a 3D camera: dragging horizontally rotates the camera about its up axis and
 * dragging vertically rotates it about its right axis. Both the camera's position and its orientation are rotated
 * about the point `orbitCenter` (the world origin by default), so the camera orbits that point and its distance to
 * it stays the same. Used by {@link ADebugInteractionMode}.
 */
export class OrbitController3D implements ACameraController {
    /** The camera model this controller moves. The interaction modes that own a controller re-point this at the
     * scene's current camera model each time they use the controller, so replacing the scene's camera works. */
    cameraModel: CameraModelInterface & ANodeModel;
    /** Rotation, in radians, per unit of cursor movement in normalized device coordinates. */
    orbitSpeed: number = 1;
    /** The point, in world coordinates, that the camera orbits. Defaults to the world origin `(0, 0, 0)`. */
    orbitCenter: Vec3;

    constructor(cameraModel: CameraModelInterface & ANodeModel, orbitSpeed?: number) {
        this.cameraModel = cameraModel;
        this.orbitCenter = new Vec3();
        if (orbitSpeed !== undefined) this.orbitSpeed = orbitSpeed;
    }

    /** The wrapped `ACamera` of `cameraModel`. */
    get camera() {
        return this.cameraModel.camera;
    }

    onDragStart(event: AInteractionEvent, interaction: ADragInteraction): void {
        interaction.setInteractionState('lastCursor', event.ndcCursor);
    }

    onDragMove(event: AInteractionEvent, interaction: ADragInteraction): void {
        if (!event.ndcCursor) {
            return;
        }
        let mouseMovement = event.ndcCursor.minus(interaction.getInteractionState('lastCursor'));
        interaction.setInteractionState('lastCursor', event.ndcCursor);
        let rotationX = -mouseMovement.x * this.orbitSpeed;
        let rotationY = mouseMovement.y * this.orbitSpeed;
        let qX = Quaternion.FromAxisAngle(this.camera.up, rotationX);
        let qY = Quaternion.FromAxisAngle(this.camera.right, rotationY);
        let newPose = this.camera.nodeTransform.clone();
        newPose = new NodeTransform3D(this._rotatePointAboutCenter(qX, newPose.position), qX.times(newPose.rotation));
        newPose = new NodeTransform3D(this._rotatePointAboutCenter(qY, newPose.position), qY.times(newPose.rotation));
        this.camera.setPose(newPose);
    }

    /**
     * Rotates the point `p` by `q` about `orbitCenter` instead of about the origin: move `orbitCenter` to the origin
     * (subtract it), rotate, then move it back (add it). In matrix form this is `T(c) * R * T(-c)`.
     *
     * When `orbitCenter` is exactly the origin, the subtraction and addition are skipped. They would not change the
     * result, but adding `+0` can turn a `-0` coordinate into `+0`, and skipping them keeps the output bit-for-bit
     * identical to rotating about the origin directly.
     * @param q the rotation to apply
     * @param p the point to rotate (e.g. the camera's position)
     * @returns the rotated point
     */
    private _rotatePointAboutCenter(q: Quaternion, p: Vec3): Vec3 {
        const c = this.orbitCenter;
        if (c.x === 0 && c.y === 0 && c.z === 0) {
            return q.appliedTo(p);
        }
        return q.appliedTo(p.minus(c)).plus(c);
    }

    onDragEnd(event: AInteractionEvent, interaction: ADragInteraction): void {
    }
}
