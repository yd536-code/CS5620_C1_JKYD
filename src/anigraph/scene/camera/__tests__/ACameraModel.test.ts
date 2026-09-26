/**
 * Tests for the camera models: `ACameraModel3D` and `ACameraModel2D`, which share `WithCamera`'s projection-facing
 * members.
 *
 * `ACameraModel3D`: its pose/projection/listener behavior, seen from the outside (see the "parented cameras"
 * describe block below for how a parent's transform affects it). `ndcToWorld` should match a reference
 * NDC-to-world formula for an unparented camera (`worldPointFromNDCCursor` below, kept as the oracle, the same
 * pattern `RenderMatrix.test.ts` uses), and use the *world* transform for a parented one. `ACameraModel2D` gets
 * basic structural checks: constructible, and `WithCamera`'s members work against its own wrapped `ACamera`'s
 * projection state.
 *
 * Cameras are built by wrapping an `ACamera` constructed directly (`ACamera.CreatePerspectiveFOV`/
 * `CreateOrthographic`, as `ACamera.test.ts` does), not via `ACameraModel3D.CreatePerspectiveFOV`/`CreateOrthographic`
 * -- those call `GetAppState()` for default near/far, which is not installed in this test environment.
 */
// Import order matters: the engine has a circular import between `math` and the base classes, and it only resolves
// when a higher-level module is loaded before `../../../math` (the other scene tests follow the same rule).
import {AMeshModel2D} from "../../nodes/2d/mesh2d/AMeshModel2D";
import {AGroupNodeModel2D} from "../../nodeModel/AGroupNodeModel2D";
import {ACameraModel3D} from "../ACameraModel3D";
import {ACameraModel2D} from "../ACameraModel2D";
import {ACamera, Mat4, NodeTransform2D, NodeTransform3D, V2, V3, Vec2, Vec4} from "../../../math";
import {ACameraView} from "../ACameraView";
import {AGroupNodeModel3D} from "../../nodeModel/AGroupNodeModel3D";
import {AGroupNodeView} from "../../nodeView/AGroupNodeView";

/** Reference NDC-to-world formula (inverse of the camera's world-to-NDC matrix), the oracle for `camera.ndcToWorld`. */
function worldPointFromNDCCursor(camera: ACamera, ndcCursor: Vec2) {
    return camera.getWorldToNDC()
        .getInverse()
        .times(
            new Vec4(ndcCursor.x, ndcCursor.y, 0.0, 1.0)
        ).Point3D.xy;
}

describe("ACameraModel3D (renamed from ACameraModel)", () => {
    test("wraps a given ACamera: its transform mirrors the wrapped camera's pose", () => {
        const camera = ACamera.CreatePerspectiveFOV(Math.PI / 3, 16 / 9, 0.1, 100);
        const cameraModel = new ACameraModel3D(camera);
        const pose = NodeTransform3D.LookAt(V3(1, 2, 3), V3(0, 0, 0), V3(0, 0, 1));
        cameraModel.setPose(pose);
        expect(cameraModel.transform.getMat4().elements).toEqual(cameraModel.camera.getPose().getMat4().elements);
        expect(cameraModel.pose).toBe(cameraModel.camera.pose);
    });

    test("setTransform routes through the wrapped camera's pose, keeping _transform in sync via the pose listener", () => {
        const camera = ACamera.CreatePerspectiveFOV(Math.PI / 3, 1, 0.1, 100);
        const cameraModel = new ACameraModel3D(camera);
        const pose = NodeTransform3D.LookAt(V3(0, -5, 0), V3(0, 0, 0), V3(0, 0, 1));
        cameraModel.setTransform(pose);
        expect(cameraModel.camera.pose.getMat4().elements).toEqual(pose.getMat4().elements);
        // _transform is protected; this checks the sync the pose listener performs, the same thing
        // RenderMatrix.test.ts's peers check for other node kinds.
        expect((cameraModel as any)._transform.getMat4().elements).toEqual(pose.getMat4().elements);
    });

    test("a pose set directly on the wrapped camera (bypassing the model) still reaches _transform and getRenderMatrix", () => {
        // Scenes and interaction modes often call `sceneModel.camera.setPose(...)` / `sceneModel.camera.pose = ...`
        // directly (e.g. in initCamera()), never touching `cameraModel.setTransform`/`setPose`. A one-way
        // `_transform` -> `camera` mirror would leave `_transform` (and so `getRenderMatrix()`/
        // `getWorldRenderMatrix()`, which `ACameraView` renders from) stuck at identity, and the scene would render
        // black.
        const camera = ACamera.CreatePerspectiveFOV(Math.PI / 3, 1, 0.1, 100);
        const cameraModel = new ACameraModel3D(camera);
        const pose = NodeTransform3D.LookAt(V3(0, -1, 1), V3(0, 0, 0), V3(0, 0, 1));
        camera.setPose(pose); // NOT cameraModel.setPose/setTransform -- direct, as the live call sites do.
        expect(cameraModel.transform.getMat4().elements).toEqual(pose.getMat4().elements);
        expect(cameraModel.getRenderMatrix().elements).toEqual(pose.getMat4().elements);
    });

    test("setPosition moves the camera without disturbing its orientation", () => {
        const camera = ACamera.CreatePerspectiveFOV(Math.PI / 3, 1, 0.1, 100);
        const cameraModel = new ACameraModel3D(camera);
        const pose = NodeTransform3D.LookAt(V3(1, 0, 0), V3(0, 0, 0), V3(0, 0, 1));
        cameraModel.setPose(pose);
        const rotationBefore = cameraModel.camera.pose.getMat4().elements.slice();
        cameraModel.setPosition(V3(5, 5, 5));
        expect(cameraModel.camera.pose.getPosition().elements).toEqual(V3(5, 5, 5).elements);
        // Rotation-only submatrix (upper-left 3x3, ignoring the translation column) is unchanged.
        const rotationAfter = cameraModel.camera.pose.getMat4().elements;
        for (const i of [0, 1, 2, 4, 5, 6, 8, 9, 10]) {
            expect(rotationAfter[i]).toBeCloseTo(rotationBefore[i], 10);
        }
    });

    test("ndcToWorld matches the reference worldPointFromNDCCursor formula", () => {
        const camera = ACamera.CreateOrthographic(-2, 2, -1, 1, 0.1, 100);
        const cameraModel = new ACameraModel3D(camera);
        cameraModel.setPose(NodeTransform3D.LookAt(V3(0, 0, 5), V3(0, 0, 0), V3(0, 1, 0)));
        for (const ndc of [V2(0, 0), V2(0.5, -0.5), V2(-1, 1)]) {
            const viaModel = cameraModel.ndcToWorld(ndc);
            const viaOldFormula = worldPointFromNDCCursor(cameraModel.camera, ndc);
            expect(viaModel.x).toBeCloseTo(viaOldFormula.x, 10);
            expect(viaModel.y).toBeCloseTo(viaOldFormula.y, 10);
        }
    });

    test("projection, forward/right/up, and onCanvasResize delegate to the wrapped ACamera (WithCamera members)", () => {
        const camera = ACamera.CreatePerspectiveFOV(Math.PI / 3, 1, 0.1, 100);
        const cameraModel = new ACameraModel3D(camera);
        expect(cameraModel.projection.elements).toEqual(cameraModel.camera.projection.elements);
        expect(cameraModel.forward.elements).toEqual(cameraModel.camera.forward.elements);
        expect(cameraModel.right.elements).toEqual(cameraModel.camera.right.elements);
        expect(cameraModel.up.elements).toEqual(cameraModel.camera.up.elements);
        cameraModel.onCanvasResize(200, 100);
        expect(cameraModel.camera.aspect).toBeCloseTo(2, 10);
    });

    test("addCameraProjectionListener hears setProjection (replacing the wrapped camera's projection)", () => {
        const camera = ACamera.CreatePerspectiveFOV(Math.PI / 3, 1, 0.1, 100);
        const cameraModel = new ACameraModel3D(camera);
        let calls = 0;
        cameraModel.addCameraProjectionListener(() => {
            calls++;
        }, "test-listener");
        cameraModel.setProjection(Mat4.Identity());
        expect(calls).toBeGreaterThan(0);
    });

    test("setPosition2D does not exist on ACameraModel3D", () => {
        const camera = ACamera.CreatePerspectiveFOV(Math.PI / 3, 1, 0.1, 100);
        const cameraModel = new ACameraModel3D(camera);
        expect((cameraModel as any).setPosition2D).toBeUndefined();
    });
});

describe("ACameraModel2D (the camera of every ASceneModel2D scene)", () => {
    test("constructs with a default wrapped camera and a native 2D transform, independent of the camera's own pose", () => {
        const cameraModel = new ACameraModel2D();
        expect(cameraModel.transform).toBeInstanceOf(NodeTransform2D);
        expect(cameraModel.camera).toBeInstanceOf(ACamera);
    });

    test("wraps a given camera's frustum, independent of the node's own (default identity) pose", () => {
        const camera = ACamera.CreateOrthographic(-3, 3, -2, 2, 0.1, 100);
        const cameraModel = new ACameraModel2D(camera);
        // toBeCloseTo, not toEqual: onCanvasResize-free CreateOrthographic still round-trips lrbt through a
        // projection matrix and back, so floating-point noise (not a logic difference) can appear in the last
        // few bits -- the same subtlety ACamera.test.ts documents for CreatePerspectiveFOV.
        cameraModel.camera.lrbt.forEach((v, i) => expect(v).toBeCloseTo([-3, 3, -2, 2][i], 10));
        expect(cameraModel.transform).toBeInstanceOf(NodeTransform2D);
    });

    test("ndcToWorld, projection, and forward/right/up (WithCamera members) work the same way as on ACameraModel3D", () => {
        const camera = ACamera.CreateOrthographic(-2, 2, -1, 1, 0.1, 100);
        const cameraModel = new ACameraModel2D(camera);
        const viaModel = cameraModel.ndcToWorld(V2(0.5, 0.5));
        const viaOldFormula = worldPointFromNDCCursor(cameraModel.camera, V2(0.5, 0.5));
        expect(viaModel.x).toBeCloseTo(viaOldFormula.x, 10);
        expect(viaModel.y).toBeCloseTo(viaOldFormula.y, 10);
        expect(cameraModel.projection.elements).toEqual(cameraModel.camera.projection.elements);
    });

    test("setting the node's own transform does not move the wrapped camera's pose (the two are not synced for 2D)", () => {
        const cameraModel = new ACameraModel2D();
        const poseBefore = cameraModel.camera.pose.getMat4().elements.slice();
        cameraModel.setTransform(new NodeTransform2D());
        expect(cameraModel.camera.pose.getMat4().elements).toEqual(poseBefore);
    });

    /**
     * `PanZoomController2D` moves `ACameraModel2D`'s own node pose (the `ndcToWorld` tests above only exercise the
     * identity-pose case). `WithCamera`'s generic `ndcToWorld` reads the wrapped `ACamera`'s pose, which
     * `ACameraModel2D` never moves (previous test), so it would go stale after a pan -- the same problem
     * `ACameraModel3D.ndcToWorld`'s own world-transform-aware override avoids for a parented 3D camera.
     * `ACameraModel2D` overrides it for the same reason: any scene using both panning (the 2D starter's default)
     * and `ASceneController.getWorldCoordinatesOfCursorEvent` (`cameraModel.ndcToWorld`) for click-to-world
     * picking -- a common pattern -- would otherwise get a wrong world point back after the very first pan.
     */
    test("ndcToWorld reflects a pan (the node's own transform), not just the wrapped camera's unmoved pose", () => {
        const camera = ACamera.CreateOrthographic(-2, 2, -1, 1, 0.1, 100);
        const cameraModel = new ACameraModel2D(camera);
        const ndc = V2(0.3, -0.2);
        const beforePan = cameraModel.ndcToWorld(ndc);

        cameraModel.prsa.position = V2(1, 2);

        // Oracle: panning an (unrotated, unscaled) orthographic camera by (dx, dy) shifts the world point seen at
        // any fixed screen location by exactly (dx, dy) -- a pure translation of the view.
        const afterPan = cameraModel.ndcToWorld(ndc);
        expect(afterPan.x).toBeCloseTo(beforePan.x + 1, 10);
        expect(afterPan.y).toBeCloseTo(beforePan.y + 2, 10);
    });

    test("ndcToWorld uses the camera's world transform when parented, not just its own local one", () => {
        const parent = new ACameraModel2D();
        parent.prsa.position = V2(5, -3);
        const child = new ACameraModel2D(ACamera.CreateOrthographic(-2, 2, -1, 1, 0.1, 100));
        parent.addChild(child);
        const ndc = V2(0.1, 0.4);

        const viaChild = child.ndcToWorld(ndc);
        // Oracle: the same formula, computed directly against the child's *world* transform (== the parent's pose
        // here, since the child's own local pose is identity) and the child's own projection.
        const worldToNDC = child.camera.projection.times(child.getWorldRenderMatrix().getInverse());
        const expected = worldToNDC.getInverse().times(new Vec4(ndc.x, ndc.y, 0.0, 1.0)).getHomogenized();
        expect(viaChild.x).toBeCloseTo(expected.x, 10);
        expect(viaChild.y).toBeCloseTo(expected.y, 10);
        // And it must differ from what the *local*-pose (identity) formula would give, since the parent's pose is not identity.
        const viaLocalFormula = worldPointFromNDCCursor(child.camera, ndc);
        expect(Math.abs(viaChild.x - viaLocalFormula.x) + Math.abs(viaChild.y - viaLocalFormula.y)).toBeGreaterThan(1e-6);
    });
});

/**
 * `WithCamera.addCameraChangeListener` must fire on a **nested** mutation of the live transform object returned by
 * `prsa` (e.g. `pose.position = ...`, exactly what `PanZoomController2D` does), not only on a *wholesale*
 * reassignment of `_transform`. Listening with `addTransformListener` would not be enough: that is an *event* fired
 * only by `signalTransformUpdate()`, itself only triggered by `autoTransformUpdate`'s own `_transform`-key
 * subscription, which a nested mutation does not trigger. So the pose half uses `addStateListener`, which catches
 * nested mutations (the same mechanism `ANodeView`'s generic render-sync relies on).
 *
 * `ACameraModel3D` callers (such as `ABackgroundQuadModel3D`) would not notice the difference, because
 * `ACameraModel3D`'s pose-mirror (`_setCameraListeners`) always reassigns `_transform` wholesale
 * (`self._transform = self.camera.getPose()`) whenever the wrapped camera's pose changes. `ACameraModel2D` has no
 * such intermediary -- `PanZoomController2D` mutates `_transform` directly and nestedly -- and `ATwoJSSceneView`'s
 * camera sync relies on this listener firing for exactly that case.
 */
describe("WithCamera.addCameraChangeListener", () => {
    test("fires on a nested mutation of the transform object returned by prsa, not just a wholesale reassignment", () => {
        const cameraModel = new ACameraModel2D();
        let calls = 0;
        cameraModel.addCameraChangeListener(() => { calls++; });

        cameraModel.prsa.position = V2(5, 0);

        expect(calls).toBeGreaterThan(0);
    });

    test("still fires on a wholesale setTransform, and on a projection change", () => {
        const cameraModel = new ACameraModel2D();
        let calls = 0;
        cameraModel.addCameraChangeListener(() => { calls++; });

        cameraModel.setTransform(cameraModel.prsa.clone());
        expect(calls).toBeGreaterThan(0);

        const callsAfterTransform = calls;
        cameraModel.camera.zoom = 2;
        expect(calls).toBeGreaterThan(callsAfterTransform);
    });
});

describe("parented cameras (pose is simply the node's own transform)", () => {
    /** Builds a parent/child ACameraModel3D pair, as a multi-pass scene with a second camera might set them up:
     * the parent has an explicit LookAt pose, the child is parented with no explicit pose of its own (so its
     * local transform stays the default identity). */
    function buildParentedCameras() {
        const parent = new ACameraModel3D(ACamera.CreatePerspectiveFOV(Math.PI / 3, 1, 0.1, 100));
        parent.setPose(NodeTransform3D.LookAt(V3(0, -1, 1), V3(0, 0, 0), V3(0, 0, 1)));
        const child = new ACameraModel3D(ACamera.CreateOrthographic(-0.5, 0.5, -0.5, 0.5, 0.1, 100));
        parent.addChild(child);
        return {parent, child};
    }

    test("an unposed child's world transform equals its parent's local transform (identity composed with a pose)", () => {
        const {parent, child} = buildParentedCameras();
        expect(child.getWorldTransform().elements).toEqual(parent.transform.getMat4().elements);
    });

    test("getWorldRenderMatrix reflects the parent's pose; getRenderMatrix (local) does not", () => {
        const {parent, child} = buildParentedCameras();
        expect(child.getWorldRenderMatrix().elements).toEqual(parent.transform.getMat4().elements);
        expect(child.getRenderMatrix().elements).not.toEqual(parent.transform.getMat4().elements);
        expect(child.getRenderMatrix().elements).toEqual(new NodeTransform3D().getMat4().elements);
    });

    test("a child's own pose still composes with its parent's, when the child has one", () => {
        const {parent, child} = buildParentedCameras();
        const childPose = new NodeTransform3D();
        childPose.setPosition(V3(0, 0, 2));
        child.setPose(childPose);
        const expected = parent.transform.getMat4().times(child.transform.getMat4());
        expect(child.getWorldRenderMatrix().elements).toEqual(expected.elements);
    });

    test("ndcToWorld uses the child's world transform, not its (identity) local one", () => {
        const {parent, child} = buildParentedCameras();
        const ndc = V2(0.25, -0.25);
        const viaChild = child.ndcToWorld(ndc);
        // Oracle: the same formula, computed directly against the parent's pose (== child's world pose here,
        // since the child's own local pose is identity) and the child's own projection.
        const worldToNDC = child.camera.projection.times(parent.transform.getMat4().getInverse());
        const expected = worldToNDC.getInverse().times(new Vec4(ndc.x, ndc.y, 0.0, 1.0)).getHomogenized();
        expect(viaChild.x).toBeCloseTo(expected.x, 10);
        expect(viaChild.y).toBeCloseTo(expected.y, 10);
        // And it must differ from what the *local*-pose formula would give, since the parent's pose is not identity.
        const viaLocalFormula = worldPointFromNDCCursor(child.camera, ndc);
        expect(Math.abs(viaChild.x - viaLocalFormula.x) + Math.abs(viaChild.y - viaLocalFormula.y)).toBeGreaterThan(1e-6);
    });

    test("an unparented camera's world and local render matrices are identical (the common case is unaffected)", () => {
        const camera = new ACameraModel3D(ACamera.CreatePerspectiveFOV(Math.PI / 3, 1, 0.1, 100));
        camera.setPose(NodeTransform3D.LookAt(V3(2, 2, 2), V3(0, 0, 0), V3(0, 0, 1)));
        expect(camera.getWorldRenderMatrix().elements).toEqual(camera.getRenderMatrix().elements);
    });

    test("direct consumers of the wrapped camera (forward/right/up, camera.pose) still see this node's own pose", () => {
        const camera = new ACameraModel3D(ACamera.CreatePerspectiveFOV(Math.PI / 3, 1, 0.1, 100));
        const pose = NodeTransform3D.LookAt(V3(0, -5, 0), V3(0, 0, 0), V3(0, 0, 1));
        camera.setPose(pose);
        expect(camera.camera.pose.getMat4().elements).toEqual(pose.getMat4().elements);
        expect(camera.forward.elements).toEqual(camera.camera.forward.elements);
    });
});

// Sanity: these imports are otherwise unused directly, but importing them first is what makes the module
// resolution order above work (see the file-level comment).
void AMeshModel2D;
void AGroupNodeModel2D;

describe("new ACameraModel3D() with no argument", () => {
    // `AObject.fromJSON` (used when loading a saved scene) builds objects with `new this()`, so a camera model has to
    // be constructible with no arguments.
    test("wraps a default ACamera and keeps the pose sync working", () => {
        const cameraModel = new ACameraModel3D();
        expect(cameraModel.camera).toBeInstanceOf(ACamera);
        expect(cameraModel.transform).toBe(cameraModel.camera.pose);
        cameraModel.setPosition(V3(1, 2, 3));
        expect(cameraModel.camera.pose.getPosition().elements).toEqual(V3(1, 2, 3).elements);
    });

    test("fromJSON's path (CreateWithState) works", () => {
        expect(() => ACameraModel3D.CreateWithState({})).not.toThrow();
    });

    test("a three.js camera other than a PerspectiveCamera still throws, with a clear message", () => {
        expect(() => new ACameraModel3D({} as any)).toThrow(/ACameraModel3D/);
    });
});

/**
 * `addCameraProjectionListener` and `signalCameraProjectionUpdate`. They used to disagree: the listener listened
 * to the wrapped `ACamera`'s `_projection` key, while the signal went out as an event on the camera model, so a
 * signal never reached a listener. The listener's switch was also thrown away, so it could not be removed. Both now
 * use the camera model's `PROJECTION_UPDATED` event, which the model also sends whenever the wrapped camera's
 * projection is replaced.
 */
describe.each([
    ["ACameraModel3D", () => new ACameraModel3D(ACamera.CreatePerspectiveFOV(Math.PI / 3, 1, 0.1, 100))],
    ["ACameraModel2D", () => new ACameraModel2D()],
])("%s projection listeners", (_name, makeCamera) => {
    test("setProjection reaches the listener exactly once", () => {
        const cameraModel = makeCamera();
        const listener = jest.fn();
        cameraModel.addCameraProjectionListener(listener);
        cameraModel.setProjection(Mat4.Identity());
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(cameraModel);
    });

    test("signalCameraProjectionUpdate reaches the listener", () => {
        const cameraModel = makeCamera();
        const listener = jest.fn();
        cameraModel.addCameraProjectionListener(listener);
        cameraModel.signalCameraProjectionUpdate();
        expect(listener).toHaveBeenCalledTimes(1);
    });

    test("the returned switch unsubscribes the listener", () => {
        const cameraModel = makeCamera();
        const listener = jest.fn();
        const sw = cameraModel.addCameraProjectionListener(listener);
        expect(sw.active).toBe(true);
        sw.deactivate();
        expect(sw.active).toBe(false);
        cameraModel.setProjection(Mat4.Identity());
        cameraModel.signalCameraProjectionUpdate();
        expect(listener).not.toHaveBeenCalled();
    });

    test("addCameraChangeListener hears signalCameraProjectionUpdate too, and its group switch turns both halves off", () => {
        const cameraModel = makeCamera();
        const listener = jest.fn();
        const group = cameraModel.addCameraChangeListener(listener);
        cameraModel.signalCameraProjectionUpdate();
        expect(listener).toHaveBeenCalledTimes(1);
        expect(group.active).toBe(true);
        group.deactivate();
        expect(group.active).toBe(false);
        cameraModel.setProjection(Mat4.Identity());
        cameraModel.signalCameraProjectionUpdate();
        expect(listener).toHaveBeenCalledTimes(1);
    });
});

describe("ACameraView", () => {
    test("renders a 2D camera model and follows its projection changes", () => {
        const cameraModel = new ACameraModel2D();
        const view = ACameraView.Create(cameraModel);
        cameraModel.setProjection(Mat4.Scale3D(2));
        expect(view.threeJSCamera.projectionMatrix.elements[0]).toBeCloseTo(2, 12);
    });

    test("releasing the view removes its projection listener", () => {
        const cameraModel = new ACameraModel3D(ACamera.CreatePerspectiveFOV(Math.PI / 3, 1, 0.1, 100));
        const view = ACameraView.Create(cameraModel);
        const update = jest.spyOn(view, "update");
        view.release();
        cameraModel.signalCameraProjectionUpdate();
        expect(update).not.toHaveBeenCalled();
    });

    test("dispose() detaches the three.js camera from its parent", () => {
        const parentView = new AGroupNodeView();
        parentView.setModel(new AGroupNodeModel3D());
        const view = ACameraView.Create(new ACameraModel2D());
        parentView.threejs.add(view.threejs);
        view.dispose();
        expect(view.threejs.parent).toBeNull();
    });
});
