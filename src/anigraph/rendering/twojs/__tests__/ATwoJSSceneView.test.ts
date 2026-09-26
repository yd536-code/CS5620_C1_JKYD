/**
 * Tests for `ATwoJSSceneView`'s camera-to-viewport sync:
 * applying `model.cameraModel`'s position/zoom to the scene view's root
 * `twoGroup`. Constructs `ATwoJSSceneView` directly against a minimal fake controller (`{model: {cameraModel}}`)
 * rather than a real `ASceneController`/`ASceneModel` -- the same "call the real class against a fake `this`/host"
 * technique `ASceneController.test.ts` and `ARenderPass.test.ts` use, since nothing this class's constructor or
 * `_syncTwoGroupToCamera` reads needs anything more than `controller.model.cameraModel`.
 *
 * The core requirement every test here is built around: the *default* camera (identity pose, `zoom = 1`, exactly
 * what `ATwoJSAppSceneModel.initCamera` already builds for every existing Two.js scene) must render as a true
 * no-op -- `translation = (0,0)`, `scale = 1` -- because Two.js scenes typically
 * store object positions directly in raw canvas pixels, assuming exactly that. See `ATwoJSSceneView.ts`'s own
 * file header for the full reasoning behind the `translation = -position * zoom` mapping this pins.
 */
// Import order matters: see the note in RenderMatrix.test.ts (in scene/__tests__).
import {AMeshModel2D} from "../../../scene/nodes/2d/mesh2d/AMeshModel2D";
import {ACameraModel2D} from "../../../scene/camera/ACameraModel2D";
import {V2} from "../../../math";
import {ATwoJSSceneView} from "../ATwoJSSceneView";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

function makeView(cameraModel: ACameraModel2D): ATwoJSSceneView {
    const fakeController: any = {model: {cameraModel}};
    return new ATwoJSSceneView(fakeController);
}

describe("ATwoJSSceneView camera sync", () => {
    test("the default camera (identity pose, zoom = 1) renders as a true identity: translation (0,0), scale 1", () => {
        const cameraModel = new ACameraModel2D();
        const view = makeView(cameraModel);
        expect(view.twoGroup.translation.x).toBe(0);
        expect(view.twoGroup.translation.y).toBe(0);
        expect(view.twoGroup.scale).toBe(1);
    });

    test("panning the camera moves twoGroup.translation by -position (at zoom = 1)", () => {
        const cameraModel = new ACameraModel2D();
        const view = makeView(cameraModel);
        cameraModel.prsa.position = V2(10, 20);
        expect(view.twoGroup.translation.x).toBeCloseTo(-10, 10);
        expect(view.twoGroup.translation.y).toBeCloseTo(-20, 10);
    });

    test("zooming sets twoGroup.scale to the camera's zoom, and rescales translation too", () => {
        const cameraModel = new ACameraModel2D();
        const view = makeView(cameraModel);
        cameraModel.prsa.position = V2(10, 0);
        cameraModel.camera.zoom = 2;
        expect(view.twoGroup.scale).toBe(2);
        expect(view.twoGroup.translation.x).toBeCloseTo(-20, 10); // -position * zoom = -10 * 2
    });

    test("the sync is live: it updates on every future pose/projection change, not just once at construction", () => {
        const cameraModel = new ACameraModel2D();
        const view = makeView(cameraModel);
        expect(view.twoGroup.translation.x).toBe(0);

        cameraModel.prsa.position = V2(5, 0);
        expect(view.twoGroup.translation.x).toBeCloseTo(-5, 10);

        cameraModel.prsa.position = V2(-3, 0);
        expect(view.twoGroup.translation.x).toBeCloseTo(3, 10);
    });

    test("a scene with no camera model at all does not throw (defensive: mirrors onModelNodeAdded's own silent-skip philosophy)", () => {
        const fakeController: any = {model: {cameraModel: undefined}};
        expect(() => new ATwoJSSceneView(fakeController)).not.toThrow();
    });

    /**
     * Pins the zoom-pivot property the class's own file header documents, rather than just asserting it in prose:
     * with `translation = -position * zoom`, a world point `p` renders at screen `zoom * (p - position)`. A
     * zoom-only change (position fixed) therefore fixes exactly the point where `p == position` -- which renders
     * at screen `(0, 0)`, the canvas corner, not anywhere the point started -- and *moves* every other world
     * point's screen position outward from that corner, proportional to how far it already was from `position`.
     * Not "zoom to canvas center" or "zoom to cursor" -- pinned as-is (see the file header's "known, unpolished"
     * note).
     */
    test("zoom pivots on the world point at the camera's own position (screen (0,0)), not the canvas center -- a world point elsewhere visibly moves", () => {
        const cameraModel = new ACameraModel2D();
        const view = makeView(cameraModel);
        // A world point's screen position, computed from the view's *actual* live translation/scale -- not a
        // redefinition of the formula under test.
        const screenPos = (worldPoint: {x: number, y: number}) => ({
            x: view.twoGroup.translation.x + view.twoGroup.scale * worldPoint.x,
            y: view.twoGroup.translation.y + view.twoGroup.scale * worldPoint.y,
        });

        // Camera stays at the default position (0,0); a world point away from it, e.g. (400, 300).
        const worldPoint = V2(400, 300);
        const before = screenPos(worldPoint); // zoom = 1: screen (400, 300)
        cameraModel.camera.zoom = 2;
        const after = screenPos(worldPoint); // zoom = 2: screen (800, 600) -- moved, not held in place

        expect(before).toEqual({x: 400, y: 300});
        expect(after).toEqual({x: 800, y: 600});

        // The world point at the camera's own position (the origin here) is the one that does NOT move --
        // it renders at the canvas corner, (0, 0), at any zoom.
        const cameraWorldPos = cameraModel.prsa.position;
        const pivot = screenPos(cameraWorldPos);
        expect(pivot).toEqual({x: 0, y: 0});
    });
});
