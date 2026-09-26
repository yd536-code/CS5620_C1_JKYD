/**
 * Parity tests for `FlyController3D`/`OrbitController3D` against reference copies (oracles) of the equivalent
 * `onKeyDown`/`onWheelMove`/`onDragMove` camera math written inline in an interaction mode (the same "keep a
 * reference implementation next to the test" pattern `RenderMatrix.test.ts`/`ACameraModel.test.ts` use). The
 * controllers must match the reference math bit for bit.
 */
// Import order matters: see the note in RenderMatrix.test.ts (in scene/__tests__).
import {AMeshModel2D} from "../../../../scene/nodes/2d/mesh2d/AMeshModel2D";
import {ACameraModel3D} from "../../../../scene/camera/ACameraModel3D";
import {AInteraction, AMockInteractionEvent} from "../../../../interaction";
import {ACamera, Mat4, NodeTransform3D, Quaternion, V2, V3, Vec2} from "../../../../math";
import {FlyController3D} from "../FlyController3D";
import {OrbitController3D} from "../OrbitController3D";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

function makeCameraModel(pose: NodeTransform3D) {
    const camera = ACamera.CreatePerspectiveFOV(Math.PI / 3, 16 / 9, 0.1, 100);
    const cameraModel = new ACameraModel3D(camera);
    cameraModel.setPose(pose);
    return cameraModel;
}

function mockKeyEvent(keysDown: Record<string, boolean>, key: string = '') {
    const interaction = {keysDownState: keysDown} as any;
    const interactionObj = new AInteraction(AMockInteractionEvent.GetMockElement());
    const event = new AMockInteractionEvent(interactionObj, V2(0, 0), false, false, false, {} as any);
    (event as any)._key = key;
    return {event, interaction};
}

function mockWheelEvent(deltaY: number) {
    const interactionObj = new AInteraction(AMockInteractionEvent.GetMockElement());
    const event = new AMockInteractionEvent(interactionObj, V2(0, 0), false, false, false, {deltaY} as any);
    const interaction = {} as any;
    return {event, interaction};
}

function mockDragInteraction() {
    const state: Record<string, any> = {};
    return {
        getInteractionState: (name: string) => state[name],
        setInteractionState: (name: string, v: any) => { state[name] = v; },
    } as any;
}

function mockDragEvent(ndcCursor: Vec2 | null) {
    const interactionObj = new AInteraction(AMockInteractionEvent.GetMockElement());
    const event = new AMockInteractionEvent(interactionObj, ndcCursor ?? V2(0, 0), false, false, false, {} as any);
    if (ndcCursor === null) (event as any)._cursorPosition = null;
    return event;
}

// ── Oracles: reference copies of the inline interaction-mode camera math ──────────────────────────────────────

function oracleOnWheelMove(camera: ACamera, deltaY: number) {
    let zoom = deltaY;
    let cameraPose = camera.getPoseAsNodeTransform();
    let movedir = cameraPose.rotation.getLocalZ();
    camera.setPosition(cameraPose.position.plus(movedir.times(0.0005 * zoom)));
}

function oracleOnKeyDown(camera: ACamera, keysDownState: Record<string, boolean>, speed: number) {
    if (keysDownState['w']) {
        camera.nodeTransform.position = camera.nodeTransform.position.plus(camera.forward.times(speed));
    }
    if (keysDownState['a']) {
        camera.nodeTransform.position = camera.nodeTransform.position.plus(camera.right.times(-speed));
    }
    if (keysDownState['s']) {
        camera.nodeTransform.position = camera.nodeTransform.position.plus(camera.forward.times(-speed));
    }
    if (keysDownState['d']) {
        camera.nodeTransform.position = camera.nodeTransform.position.plus(camera.right.times(speed));
    }
    if (keysDownState['r']) {
        camera.nodeTransform.position = camera.nodeTransform.position.plus(camera.up.times(speed));
    }
    if (keysDownState['f']) {
        camera.nodeTransform.position = camera.nodeTransform.position.plus(camera.up.times(-speed));
    }
}

function oracleOnDragMove(camera: ACamera, lastCursor: Vec2, ndcCursor: Vec2, orbitSpeed: number) {
    let mouseMovement = ndcCursor.minus(lastCursor);
    let rotationX = -mouseMovement.x * orbitSpeed;
    let rotationY = mouseMovement.y * orbitSpeed;
    let qX = Quaternion.FromAxisAngle(camera.up, rotationX);
    let qY = Quaternion.FromAxisAngle(camera.right, rotationY);
    let newPose = camera.nodeTransform.clone();
    newPose = new NodeTransform3D(qX.appliedTo(newPose.position), qX.times(newPose.rotation));
    newPose = new NodeTransform3D(qY.appliedTo(newPose.position), qY.times(newPose.rotation));
    camera.setPose(newPose);
}

const startPose = NodeTransform3D.LookAt(V3(1, 2, 3), V3(0, 0, 0), V3(0, 0, 1));

describe("FlyController3D parity with the reference onWheelMove", () => {
    test("dolly forward/backward along the camera's local Z matches the oracle", () => {
        const cameraModel = makeCameraModel(startPose);
        const oracleCamera = ACamera.CreatePerspectiveFOV(Math.PI / 3, 16 / 9, 0.1, 100);
        oracleCamera.setPose(startPose);

        const controller = new FlyController3D(cameraModel);
        const {event, interaction} = mockWheelEvent(120);
        controller.onWheelMove!(event, interaction);
        oracleOnWheelMove(oracleCamera, 120);

        expect(cameraModel.camera.getPose().getMat4().elements).toEqual(oracleCamera.getPose().getMat4().elements);
    });
});

describe("FlyController3D parity with the reference onKeyDown", () => {
    test.each([
        ['w', {w: true}],
        ['a', {a: true}],
        ['s', {s: true}],
        ['d', {d: true}],
        ['r', {r: true}],
        ['f', {f: true}],
        ['w+d (combined)', {w: true, d: true}],
    ])('%s', (_label, keysDown) => {
        const cameraModel = makeCameraModel(startPose);
        const oracleCamera = ACamera.CreatePerspectiveFOV(Math.PI / 3, 16 / 9, 0.1, 100);
        oracleCamera.setPose(startPose);

        const controller = new FlyController3D(cameraModel);
        const {event, interaction} = mockKeyEvent(keysDown);
        controller.onKeyDown!(event, interaction);
        oracleOnKeyDown(oracleCamera, keysDown, 0.2);

        expect(cameraModel.camera.getPose().getMat4().elements).toEqual(oracleCamera.getPose().getMat4().elements);
    });

    test("movementSpeed is configurable and actually used", () => {
        const cameraModel = makeCameraModel(startPose);
        const controller = new FlyController3D(cameraModel, 5.0);
        const {event, interaction} = mockKeyEvent({w: true});
        controller.onKeyDown!(event, interaction);

        const oracleCamera = ACamera.CreatePerspectiveFOV(Math.PI / 3, 16 / 9, 0.1, 100);
        oracleCamera.setPose(startPose);
        oracleOnKeyDown(oracleCamera, {w: true}, 5.0);

        expect(cameraModel.camera.getPose().getMat4().elements).toEqual(oracleCamera.getPose().getMat4().elements);
    });
});

describe("OrbitController3D parity with the reference onDragStart/onDragMove", () => {
    test("a drag rotates the camera exactly as the reference math does", () => {
        const cameraModel = makeCameraModel(startPose);
        const oracleCamera = ACamera.CreatePerspectiveFOV(Math.PI / 3, 16 / 9, 0.1, 100);
        oracleCamera.setPose(startPose);

        const controller = new OrbitController3D(cameraModel);
        const dragInteraction = mockDragInteraction();
        const startEvent = mockDragEvent(V2(0, 0));
        controller.onDragStart!(startEvent, dragInteraction);

        const moveEvent = mockDragEvent(V2(0.3, -0.2));
        controller.onDragMove!(moveEvent, dragInteraction);
        oracleOnDragMove(oracleCamera, V2(0, 0), V2(0.3, -0.2), 1);

        expect(cameraModel.camera.getPose().getMat4().elements).toEqual(oracleCamera.getPose().getMat4().elements);
    });

    test("a null ndcCursor is a no-op, matching the reference guard", () => {
        const cameraModel = makeCameraModel(startPose);
        const before = cameraModel.camera.getPose().getMat4().elements.slice();

        const controller = new OrbitController3D(cameraModel);
        const dragInteraction = mockDragInteraction();
        controller.onDragStart!(mockDragEvent(V2(0, 0)), dragInteraction);
        controller.onDragMove!(mockDragEvent(null), dragInteraction);

        expect(cameraModel.camera.getPose().getMat4().elements).toEqual(before);
    });
});

describe("OrbitController3D meaning (independent of the quaternion convention)", () => {
    test("a drag rotates the camera's whole pose about the origin: M' = Rot(right, dy) * Rot(up, -dx) * M", () => {
        const cameraModel = makeCameraModel(startPose);
        const camera = cameraModel.camera;
        const up0 = camera.up.clone(), right0 = camera.right.clone();
        const M0 = camera.getPose().getMat4();

        const controller = new OrbitController3D(cameraModel);
        const dragInteraction = mockDragInteraction();
        controller.onDragStart!(mockDragEvent(V2(0, 0)), dragInteraction);
        controller.onDragMove!(mockDragEvent(V2(0.3, -0.2)), dragInteraction);

        const speed = controller.orbitSpeed;
        const expected = Mat4.RotationAxisAngle(right0.getNormalized(), -0.2 * speed)
            .times(Mat4.RotationAxisAngle(up0.getNormalized(), -0.3 * speed))
            .times(M0);
        const actual = camera.getPose().getMat4();
        for (let i = 0; i < 16; i++) {
            expect(Math.abs(actual.elements[i] - expected.elements[i])).toBeLessThan(1e-9);
        }
    });
});

describe("OrbitController3D orbits about orbitCenter", () => {
    test("a drag about a non-zero orbitCenter keeps the camera's distance to that center: M' = T(c) R T(-c) M", () => {
        const cameraModel = makeCameraModel(startPose);
        const camera = cameraModel.camera;
        const up0 = camera.up.clone(), right0 = camera.right.clone();
        const M0 = camera.getPose().getMat4();
        const center = V3(2, -1, 0.5);
        const distanceBefore = camera.getPoseAsNodeTransform().position.minus(center).L2();

        const controller = new OrbitController3D(cameraModel);
        controller.orbitCenter = center;
        const dragInteraction = mockDragInteraction();
        controller.onDragStart!(mockDragEvent(V2(0, 0)), dragInteraction);
        controller.onDragMove!(mockDragEvent(V2(0.3, -0.2)), dragInteraction);

        const distanceAfter = camera.getPoseAsNodeTransform().position.minus(center).L2();
        expect(distanceAfter).toBeCloseTo(distanceBefore, 9);

        const speed = controller.orbitSpeed;
        const expected = Mat4.Translation3D(center)
            .times(Mat4.RotationAxisAngle(right0.getNormalized(), -0.2 * speed))
            .times(Mat4.RotationAxisAngle(up0.getNormalized(), -0.3 * speed))
            .times(Mat4.Translation3D(center.times(-1)))
            .times(M0);
        const actual = camera.getPose().getMat4();
        for (let i = 0; i < 16; i++) {
            expect(Math.abs(actual.elements[i] - expected.elements[i])).toBeLessThan(1e-9);
        }
    });
});
