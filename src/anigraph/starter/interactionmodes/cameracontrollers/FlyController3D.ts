import type {AInteractionEvent} from "../../../interaction";
import type {AKeyboardInteraction} from "../../../interaction/DOM/AKeyboardInteraction";
import type {AWheelInteraction} from "../../../interaction/AWheelInteraction";
import type {CameraModelInterface} from "../../../scene/camera";
import type {ANodeModel} from "../../../scene/nodeModel";
import type {ACameraController} from "./ACameraController";

/**
 * "Fly" camera controls for a 3D camera: while W/A/S/D/R/F are held, each key event moves the camera by
 * `movementSpeed` along its forward/right/up axes (W forward, S back, A left, D right, R up, F down), and the mouse
 * wheel dollies the camera along its local z axis. Used by {@link ADebugInteractionMode}.
 */
export class FlyController3D implements ACameraController {
    /** The camera model this controller moves. The interaction modes that own a controller re-point this at the
     * scene's current camera model each time they use the controller, so replacing the scene's camera works. */
    cameraModel: CameraModelInterface & ANodeModel;
    /** Distance the camera moves per key event, in world units. */
    movementSpeed: number = 0.2;
    /** Dolly distance per unit of wheel `deltaY`. */
    wheelSpeed: number = 0.0005;

    constructor(cameraModel: CameraModelInterface & ANodeModel, movementSpeed?: number) {
        this.cameraModel = cameraModel;
        if (movementSpeed !== undefined) this.movementSpeed = movementSpeed;
    }

    /** The wrapped `ACamera` of `cameraModel`. */
    get camera() {
        return this.cameraModel.camera;
    }

    onWheelMove(event: AInteractionEvent, interaction: AWheelInteraction) {
        let zoom = (event.DOMEvent as WheelEvent).deltaY;
        let cameraPose = this.camera.getPoseAsNodeTransform();
        let movedir = cameraPose.rotation.getLocalZ();
        this.camera.setPosition(cameraPose.position.plus(movedir.times(this.wheelSpeed * zoom)));
    }

    onKeyDown(event: AInteractionEvent, interaction: AKeyboardInteraction) {
        if (interaction.keysDownState['w']) {
            this.camera.nodeTransform.position = this.camera.nodeTransform.position.plus(this.camera.forward.times(this.movementSpeed));
        }
        if (interaction.keysDownState['a']) {
            this.camera.nodeTransform.position = this.camera.nodeTransform.position.plus(this.camera.right.times(-this.movementSpeed));
        }
        if (interaction.keysDownState['s']) {
            this.camera.nodeTransform.position = this.camera.nodeTransform.position.plus(this.camera.forward.times(-this.movementSpeed));
        }
        if (interaction.keysDownState['d']) {
            this.camera.nodeTransform.position = this.camera.nodeTransform.position.plus(this.camera.right.times(this.movementSpeed));
        }
        if (interaction.keysDownState['r']) {
            this.camera.nodeTransform.position = this.camera.nodeTransform.position.plus(this.camera.up.times(this.movementSpeed));
        }
        if (interaction.keysDownState['f']) {
            this.camera.nodeTransform.position = this.camera.nodeTransform.position.plus(this.camera.up.times(-this.movementSpeed));
        }
    }
}
