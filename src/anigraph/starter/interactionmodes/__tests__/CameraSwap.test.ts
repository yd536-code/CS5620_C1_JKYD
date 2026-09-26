/**
 * Tests that the built-in camera interaction modes follow the scene's *current* camera model. A mode's camera
 * controllers are created the first time they are used; if the scene later replaces its camera model, the
 * controllers must move the new camera, not the one they saw first.
 *
 * The modes are built without a real scene controller: each test gives the mode a stand-in owner that only has a
 * `cameraModel`, which is all `ASceneInteractionMode.cameraModel` reads.
 */
// Import order matters: see the note in RenderMatrix.test.ts (in scene/__tests__).
import {AMeshModel2D} from "../../../scene/nodes/2d/mesh2d/AMeshModel2D";
import {ACameraModel3D} from "../../../scene/camera/ACameraModel3D";
import {ACameraModel2D} from "../../../scene/camera/ACameraModel2D";
import {AInteraction, AMockInteractionEvent} from "../../../interaction";
import {ACamera, NodeTransform3D, V2, V3, Vec2} from "../../../math";
import {ADebugInteractionMode} from "../ADebugInteractionMode";
import {APanZoomInteractionMode2D} from "../APanZoomInteractionMode2D";
import {ATwoJSDebugInteractionMode} from "../../App2DTwoJS/interactionmodes/ATwoJSDebugInteractionMode";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

const startPose = NodeTransform3D.LookAt(V3(1, 2, 3), V3(0, 0, 0), V3(0, 0, 1));

function make3DCameraModel() {
    const cameraModel = new ACameraModel3D(ACamera.CreatePerspectiveFOV(Math.PI / 3, 16 / 9, 0.1, 100));
    cameraModel.setPose(startPose);
    return cameraModel;
}

function make2DCameraModel() {
    return new ACameraModel2D(ACamera.CreateOrthographic(-2, 2, -1, 1, 0.1, 100));
}

/** Gives `mode` a stand-in owner whose `cameraModel` can be swapped. */
function setOwner(mode: any, owner: { cameraModel: any }) {
    mode._owner = owner;
}

function mockDragInteraction() {
    const state: Record<string, any> = {};
    return {
        getInteractionState: (name: string) => state[name],
        setInteractionState: (name: string, v: any) => { state[name] = v; },
    } as any;
}

function mockEvent(cursor: Vec2, domEvent: any = {}) {
    const interactionObj = new AInteraction(AMockInteractionEvent.GetMockElement());
    return new AMockInteractionEvent(interactionObj, cursor, false, false, false, domEvent);
}

/** Drags from the center of the canvas by a small amount. */
function drag(mode: ADebugInteractionMode) {
    const interaction = mockDragInteraction();
    mode.onDragStart(mockEvent(V2(0, 0)), interaction);
    mode.onDragMove(mockEvent(V2(0.3, -0.2)), interaction);
}

function poseElements(cameraModel: ACameraModel3D) {
    return cameraModel.camera.getPose().getMat4().elements.slice();
}

describe("camera interaction modes follow a replaced camera model", () => {
    test("ADebugInteractionMode: after the camera model is replaced, a drag moves the new camera, not the old one", () => {
        const mode = new ADebugInteractionMode();
        const owner = {cameraModel: make3DCameraModel()};
        setOwner(mode, owner);
        drag(mode); // creates the controllers with the first camera
        const oldCamera = owner.cameraModel;

        const newCamera = make3DCameraModel();
        owner.cameraModel = newCamera;
        const oldBefore = poseElements(oldCamera);
        const newBefore = poseElements(newCamera);
        drag(mode);

        expect(poseElements(oldCamera)).toEqual(oldBefore);
        expect(poseElements(newCamera)).not.toEqual(newBefore);
        expect(mode.orbitController.cameraModel).toBe(newCamera);
        expect(mode.flyController.cameraModel).toBe(newCamera);
    });

    test("ADebugInteractionMode: settings made before the swap are kept", () => {
        const mode = new ADebugInteractionMode();
        const owner = {cameraModel: make3DCameraModel()};
        setOwner(mode, owner);
        mode.cameraOrbitSpeed = 2.5;
        mode.cameraMovementSpeed = 3;
        owner.cameraModel = make3DCameraModel();
        expect(mode.cameraOrbitSpeed).toBe(2.5);
        expect(mode.cameraMovementSpeed).toBe(3);
    });

    test.each([
        ["APanZoomInteractionMode2D", () => new APanZoomInteractionMode2D()],
        ["ATwoJSDebugInteractionMode", () => new ATwoJSDebugInteractionMode()],
    ])("%s: after the camera model is replaced, the wheel zooms the new camera", (_name, makeMode) => {
        const mode = makeMode();
        const owner = {cameraModel: make2DCameraModel()};
        setOwner(mode, owner);
        mode.onWheelMove(mockEvent(V2(0, 0), {deltaY: -100}), {} as any); // creates the controller
        const oldCamera = owner.cameraModel;
        const oldZoom = oldCamera.camera.zoom;

        const newCamera = make2DCameraModel();
        owner.cameraModel = newCamera;
        const newZoom = newCamera.camera.zoom;
        mode.onWheelMove(mockEvent(V2(0, 0), {deltaY: -100}), {} as any);

        expect(oldCamera.camera.zoom).toBe(oldZoom);
        expect(newCamera.camera.zoom).toBeGreaterThan(newZoom);
    });
});
