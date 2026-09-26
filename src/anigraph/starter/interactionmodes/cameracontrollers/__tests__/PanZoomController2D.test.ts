/**
 * Behavior tests for `PanZoomController2D`.
 * Unlike `CameraControllers.test.ts` (`FlyController3D`/`OrbitController3D`, which are checked against reference
 * copies of equivalent code), there is no reference implementation to use as a parity oracle. Instead, each test
 * pins the controller's output against an independent, literal re-derivation of the formula it is documented to
 * use (the same "keep an oracle next to the real implementation" discipline, applied to a spec instead of old
 * code). The first two describe blocks below cover the default (`pixelSpace: false`, AGL/NDC) mode: a dedicated
 * describe block pins a property that mode's correctness relies on -- two drags of the same relative motion pan
 * by the same amount, regardless of the camera's current (already-panned) position -- true because `ndcToWorld`
 * (`ACameraModel2D`'s own override) is an affine map whose linear part does not depend on
 * where the camera currently is, so a *difference* of two evaluations of it is position-independent. See
 * `scene/camera/__tests__/ACameraModel.test.ts` for direct tests of that override. The last describe block
 * covers `pixelSpace: true` (used by Two.js): its pan delta is computed differently (raw
 * `event.cursorPosition`, divided by the current zoom) but goes through the *same* position-update line, so
 * those tests focus on what's actually different -- the delta itself, and its zoom-scaling.
 */
// Import order matters: see the note in RenderMatrix.test.ts (in scene/__tests__) and CameraControllers.test.ts.
import {AMeshModel2D} from "../../../../scene/nodes/2d/mesh2d/AMeshModel2D";
import {ACameraModel2D} from "../../../../scene/camera/ACameraModel2D";
import {AInteraction, AMockInteractionEvent} from "../../../../interaction";
import {ACamera, Mat3, NodeTransform2D, V2, V4, Vec2, Vec4} from "../../../../math";
import {PanZoomController2D} from "../PanZoomController2D";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

function makeCameraModel() {
    const camera = ACamera.CreateOrthographic(-2, 2, -1, 1, 0.1, 100);
    return new ACameraModel2D(camera);
}

/** `ACamera.convertNDCToWorld2D`'s formula, re-derived literally (not called) so this is a real oracle, not a
 * tautological re-check of the code under test. Valid as an oracle for `cameraModel.ndcToWorld` specifically in
 * the tests below that start each drag from a fresh (identity-pose, unparented) `makeCameraModel()`: there,
 * `ACameraModel2D.ndcToWorld`'s own override (world-transform-aware, see `ACameraModel2D.ts`) and this formula
 * agree, because the node's world transform *is* identity before any pan has moved it -- a within-one-drag delta
 * never sees the camera at any other position, since the position only changes once, at the end of `onDragMove`. */
function ndcToWorldOracle(camera: ACamera, ndc: Vec2): Vec2 {
    const w = camera.PV.getInverse().times(new Vec4(ndc.x, ndc.y, 0.0, 1.0)).getHomogenized();
    return V2(w.x, w.y);
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

describe("PanZoomController2D.onWheelMove", () => {
    test("scrolling down (deltaY > 0) zooms out (decreases camera.zoom)", () => {
        const cameraModel = makeCameraModel();
        const startZoom = cameraModel.camera.zoom;
        const controller = new PanZoomController2D(cameraModel);
        const {event, interaction} = mockWheelEvent(120);
        controller.onWheelMove(event, interaction);
        expect(cameraModel.camera.zoom).toBeCloseTo(startZoom - 120 * controller.zoomSpeed, 10);
    });

    test("scrolling up (deltaY < 0) zooms in (increases camera.zoom)", () => {
        const cameraModel = makeCameraModel();
        const startZoom = cameraModel.camera.zoom;
        const controller = new PanZoomController2D(cameraModel);
        const {event, interaction} = mockWheelEvent(-120);
        controller.onWheelMove(event, interaction);
        expect(cameraModel.camera.zoom).toBeCloseTo(startZoom + 120 * controller.zoomSpeed, 10);
    });

    test("zoom clamps at minZoom rather than going to zero or negative", () => {
        const cameraModel = makeCameraModel();
        const controller = new PanZoomController2D(cameraModel);
        const {event, interaction} = mockWheelEvent(1e9);
        controller.onWheelMove(event, interaction);
        expect(cameraModel.camera.zoom).toBe(controller.minZoom);
    });

    test("zoomSpeed is configurable via the constructor and actually used", () => {
        const cameraModel = makeCameraModel();
        const startZoom = cameraModel.camera.zoom;
        const controller = new PanZoomController2D(cameraModel, 0.01);
        const {event, interaction} = mockWheelEvent(10);
        controller.onWheelMove(event, interaction);
        expect(cameraModel.camera.zoom).toBeCloseTo(startZoom - 10 * 0.01, 10);
    });
});

describe("PanZoomController2D.onDragStart/onDragMove", () => {
    test("a drag pans the camera by the negative of the ndcToWorld delta, matching the oracle formula", () => {
        const cameraModel = makeCameraModel();
        const startPosition = cameraModel.prsa.position.clone();

        const controller = new PanZoomController2D(cameraModel);
        const dragInteraction = mockDragInteraction();
        controller.onDragStart(mockDragEvent(V2(0, 0)), dragInteraction);
        controller.onDragMove(mockDragEvent(V2(0.3, -0.2)), dragInteraction);

        const worldDelta = ndcToWorldOracle(cameraModel.camera, V2(0.3, -0.2)).minus(ndcToWorldOracle(cameraModel.camera, V2(0, 0)));
        const expected = startPosition.minus(worldDelta);
        expect(cameraModel.prsa.position.x).toBeCloseTo(expected.x, 10);
        expect(cameraModel.prsa.position.y).toBeCloseTo(expected.y, 10);
    });

    test("dragging back to the start cursor undoes the pan exactly (round trip)", () => {
        const cameraModel = makeCameraModel();
        const startPosition = cameraModel.prsa.position.clone();

        const controller = new PanZoomController2D(cameraModel);
        const dragInteraction = mockDragInteraction();
        controller.onDragStart(mockDragEvent(V2(0, 0)), dragInteraction);
        controller.onDragMove(mockDragEvent(V2(0.5, 0.4)), dragInteraction);
        controller.onDragMove(mockDragEvent(V2(0, 0)), dragInteraction);

        const end = cameraModel.prsa.position;
        expect(end.x).toBeCloseTo(startPosition.x, 10);
        expect(end.y).toBeCloseTo(startPosition.y, 10);
    });

    test("a null ndcCursor is a no-op, matching OrbitController3D's guard", () => {
        const cameraModel = makeCameraModel();
        const before = cameraModel.prsa.position.clone();

        const controller = new PanZoomController2D(cameraModel);
        const dragInteraction = mockDragInteraction();
        controller.onDragStart(mockDragEvent(V2(0, 0)), dragInteraction);
        controller.onDragMove(mockDragEvent(null), dragInteraction);

        const after = cameraModel.prsa.position;
        expect(after.x).toBe(before.x);
        expect(after.y).toBe(before.y);
    });

    test("onDragMove without a preceding onDragStart is a no-op (no prior cursor to diff against)", () => {
        const cameraModel = makeCameraModel();
        const before = cameraModel.prsa.position.clone();

        const controller = new PanZoomController2D(cameraModel);
        controller.onDragMove(mockDragEvent(V2(0.3, 0.2)), mockDragInteraction());

        const after = cameraModel.prsa.position;
        expect(after.x).toBe(before.x);
        expect(after.y).toBe(before.y);
    });

    test("still pans correctly when the model's transform representation is Mat3, not NodeTransform2D (convertTransformToPRSA guard)", () => {
        const cameraModel = makeCameraModel();
        cameraModel.convertTransformToMatrix();
        expect(cameraModel.transform).not.toBeInstanceOf(NodeTransform2D);
        // prsa throws on a Mat3 node, so read the starting position from the matrix.
        const startPosition = (cameraModel.transform.getMatrix() as Mat3).c2.Point2D;

        const controller = new PanZoomController2D(cameraModel);
        const dragInteraction = mockDragInteraction();
        controller.onDragStart(mockDragEvent(V2(0, 0)), dragInteraction);
        controller.onDragMove(mockDragEvent(V2(0.3, -0.2)), dragInteraction);

        const worldDelta = ndcToWorldOracle(cameraModel.camera, V2(0.3, -0.2)).minus(ndcToWorldOracle(cameraModel.camera, V2(0, 0)));
        const expected = startPosition.minus(worldDelta);
        const end = cameraModel.prsa.position;
        expect(end.x).toBeCloseTo(expected.x, 10);
        expect(end.y).toBeCloseTo(expected.y, 10);
    });
});

describe("panning by the same relative motion twice pans by the same amount, regardless of the camera's current position", () => {
    test("a second, identical relative drag pans by the same increment as the first, even though the camera has already moved", () => {
        const cameraModel = makeCameraModel();
        const controller = new PanZoomController2D(cameraModel);

        const drag1 = mockDragInteraction();
        controller.onDragStart(mockDragEvent(V2(0, 0)), drag1);
        controller.onDragMove(mockDragEvent(V2(0.2, 0.1)), drag1);
        const afterFirstDrag = cameraModel.prsa.position.clone();

        // Same *relative* motion (another 0.2, 0.1 in ndc), starting from wherever the cursor now is -- the
        // camera's own pose has changed (afterFirstDrag != the original position), and ndcToWorld now reflects
        // that (ACameraModel2D.ndcToWorld uses the node's own world transform), but its linear part still doesn't
        // depend on the camera's current position, so this second drag should move the camera by the same amount.
        const drag2 = mockDragInteraction();
        controller.onDragStart(mockDragEvent(V2(0.2, 0.1)), drag2);
        controller.onDragMove(mockDragEvent(V2(0.4, 0.2)), drag2);
        const afterSecondDrag = cameraModel.prsa.position;

        const firstIncrement = afterFirstDrag; // started from the default (0,0) position
        const secondIncrement = afterSecondDrag.minus(afterFirstDrag);
        expect(secondIncrement.x).toBeCloseTo(firstIncrement.x, 10);
        expect(secondIncrement.y).toBeCloseTo(firstIncrement.y, 10);
    });
});

describe("PanZoomController2D with pixelSpace: true (Two.js)", () => {
    test("defaults to pixelSpace: false when the third constructor argument is omitted", () => {
        const controller = new PanZoomController2D(makeCameraModel());
        expect(controller.pixelSpace).toBe(false);
    });

    test("a drag pans by exactly the raw cursorPosition delta at zoom = 1 (no ndcToWorld/projection math involved)", () => {
        const cameraModel = makeCameraModel();
        const startPosition = cameraModel.prsa.position.clone();
        expect(cameraModel.camera.zoom).toBe(1);

        const controller = new PanZoomController2D(cameraModel, undefined, true);
        const dragInteraction = mockDragInteraction();
        controller.onDragStart(mockDragEvent(V2(100, 50)), dragInteraction);
        controller.onDragMove(mockDragEvent(V2(140, 30)), dragInteraction);

        // Raw pixel delta (40, -20), divided by zoom = 1 -- unchanged -- then subtracted (same sign convention
        // as the NDC mode: content follows the cursor).
        const end = cameraModel.prsa.position;
        expect(end.x).toBeCloseTo(startPosition.x - 40, 10);
        expect(end.y).toBeCloseTo(startPosition.y - (-20), 10);
    });

    test("the same pixel drag pans by half as much at zoom = 2 (dividing by the current zoom is what keeps 1 screen pixel of drag = 1 screen pixel of visible pan)", () => {
        const cameraModel = makeCameraModel();
        cameraModel.camera.zoom = 2;
        const startPosition = cameraModel.prsa.position.clone();

        const controller = new PanZoomController2D(cameraModel, undefined, true);
        const dragInteraction = mockDragInteraction();
        controller.onDragStart(mockDragEvent(V2(0, 0)), dragInteraction);
        controller.onDragMove(mockDragEvent(V2(100, 0)), dragInteraction);

        const end = cameraModel.prsa.position;
        // 100px delta / zoom 2 = 50 position units, then subtracted.
        expect(end.x).toBeCloseTo(startPosition.x - 50, 10);
        expect(end.y).toBeCloseTo(startPosition.y, 10);
    });

    test("a null cursorPosition is a no-op, matching the NDC mode's guard", () => {
        const cameraModel = makeCameraModel();
        const before = cameraModel.prsa.position.clone();

        const controller = new PanZoomController2D(cameraModel, undefined, true);
        const dragInteraction = mockDragInteraction();
        controller.onDragStart(mockDragEvent(V2(0, 0)), dragInteraction);
        controller.onDragMove(mockDragEvent(null), dragInteraction);

        const after = cameraModel.prsa.position;
        expect(after.x).toBe(before.x);
        expect(after.y).toBe(before.y);
    });

    test("onWheelMove is identical in both modes -- zoom has no pixelSpace branch", () => {
        const ndcCameraModel = makeCameraModel();
        const pixelCameraModel = makeCameraModel();
        const ndcController = new PanZoomController2D(ndcCameraModel);
        const pixelController = new PanZoomController2D(pixelCameraModel, undefined, true);

        const {event, interaction} = mockWheelEvent(120);
        ndcController.onWheelMove(event, interaction);
        pixelController.onWheelMove(event, interaction);

        expect(pixelCameraModel.camera.zoom).toBe(ndcCameraModel.camera.zoom);
    });
});
