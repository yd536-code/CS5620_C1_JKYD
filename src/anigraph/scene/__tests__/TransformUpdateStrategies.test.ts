/**
 * Tests for the two transform-update strategies.
 *
 * - **Automatic** (`autoTransformUpdate = true`, the default): every change to a node's transform state
 *   (`transformStateKeys`, nested edits included) signals `TRANSFORM_UPDATE` right away, and views redraw.
 * - **Signaled** (`autoTransformUpdate = false`): transform edits signal nothing, and the views redraw once when
 *   `signalTransformUpdate()` (or `flushTransformUpdate()`) is called.
 *
 * Views follow the transform only through `TRANSFORM_UPDATE` (→ `onTransformUpdate()`). Their general state listener
 * skips the transform keys, and still calls `update()` for every other state change.
 */
// Import order matters: see the note in RenderMatrix.test.ts.
import {AMeshModel2D} from "../nodes/2d/mesh2d/AMeshModel2D";
import {AGroupNodeView} from "../nodeView/AGroupNodeView";
import {AGroupNodeModel2D} from "../nodeModel/AGroupNodeModel2D";
import {AModelGraph} from "../AModelGraph";
import {ATwoJSSceneView} from "../../rendering/twojs/ATwoJSSceneView";
import {ATwoJSGroupNodeView} from "../../rendering/twojs/ATwoJSGroupNodeView";
import {ATwoJSNodeView} from "../../rendering/twojs/ATwoJSNodeView";
import {ACameraModel3D} from "../camera/ACameraModel3D";
import * as THREE from "three";
import {ACamera, Mat3, NodeTransform3D, V2, V3} from "../../math";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

/** The render matrix the view should show for a 2D node: `transform` embedded with `z` as the z translation. */
function embedded2D(m: Mat3, z: number): number[] {
    const t = m.Mat4From2DH();
    t.m23 = z;
    const target = new THREE.Matrix4();
    t.assignTo(target);
    return target.elements.slice();
}

function expectMatrix(view: AGroupNodeView, expected: number[]) {
    const actual = view.threejs.matrix.elements.slice();
    for (let i = 0; i < 16; i++) {
        expect(actual[i]).toBeCloseTo(expected[i], 12);
    }
}

/** A 2D group node with a view, plus counters for the view's `update()` and `onTransformUpdate()` calls. */
function makeCountedView(autoTransformUpdate: boolean = true) {
    const model = new AGroupNodeModel2D();
    model.autoTransformUpdate = autoTransformUpdate;
    const view = new AGroupNodeView();
    view.setModel(model);
    const counts = {update: 0, onTransformUpdate: 0};
    const update = view.update.bind(view);
    view.update = () => {
        counts.update++;
        update();
    };
    const onTransformUpdate = view.onTransformUpdate.bind(view);
    view.onTransformUpdate = () => {
        counts.onTransformUpdate++;
        onTransformUpdate();
    };
    return {model, view, counts};
}

/** `model`'s current transform, as the `Mat3` the view should be showing. */
function matrixOf(model: AGroupNodeModel2D): Mat3 {
    return model.transform.getMatrix() as Mat3;
}

describe("automatic strategy (autoTransformUpdate on)", () => {
    test("is the default", () => {
        expect(new AGroupNodeModel2D().autoTransformUpdate).toBe(true);
    });

    test("nested edits through prsa redraw the view right away", () => {
        const {model, view, counts} = makeCountedView();

        model.prsa.position = V2(1, 2);
        expectMatrix(view, embedded2D(matrixOf(model), 0));
        expect(counts.onTransformUpdate).toBeGreaterThanOrEqual(1);

        const before = counts.onTransformUpdate;
        model.prsa.position.x = 3;
        expectMatrix(view, embedded2D(matrixOf(model), 0));
        expect(counts.onTransformUpdate).toBeGreaterThan(before);

        const beforeRotation = counts.onTransformUpdate;
        model.prsa.rotation = 0.4;
        expectMatrix(view, embedded2D(matrixOf(model), 0));
        expect(counts.onTransformUpdate).toBeGreaterThan(beforeRotation);
    });

    test("replacing the transform redraws the view", () => {
        const {model, view, counts} = makeCountedView();
        const t = Mat3.Translation2D(V2(-4, 1));
        model.setTransform(t);
        expectMatrix(view, embedded2D(t, 0));
        expect(counts.onTransformUpdate).toBe(1);
    });

    test("transform edits reach the view only through onTransformUpdate, not the general state listener", () => {
        const {model, counts} = makeCountedView();
        model.prsa.position = V2(1, 2);
        model.setTransform(Mat3.Rotation(0.3));
        // AGroupNodeView keeps the default onTransformUpdate(), which calls update() once per transform event.
        expect(counts.update).toBe(counts.onTransformUpdate);
    });

    test("an explicit signalTransformUpdate() is harmless: it redraws the transform again", () => {
        const {model, view, counts} = makeCountedView();
        model.prsa.position = V2(1, 2);
        const before = counts.onTransformUpdate;
        model.signalTransformUpdate();
        expect(counts.onTransformUpdate).toBe(before + 1);
        expectMatrix(view, embedded2D(matrixOf(model), 0));
    });

    test("flushTransformUpdate() does nothing, since the edits already signaled", () => {
        const {model, counts} = makeCountedView();
        model.prsa.position = V2(1, 2);
        const before = counts.onTransformUpdate;
        model.flushTransformUpdate();
        expect(counts.onTransformUpdate).toBe(before);
    });

    test("zValue is part of the transform: a change redraws right away", () => {
        const {model, view, counts} = makeCountedView();
        const t = Mat3.Translation2D(V2(1, 2));
        model.setTransform(t);
        const before = counts.onTransformUpdate;
        model.zValue = -0.3;
        expectMatrix(view, embedded2D(t, -0.3));
        expect(counts.onTransformUpdate).toBe(before + 1);
    });

    test("the automatic event is marked as automatic; an explicit signal is not", () => {
        const model = new AGroupNodeModel2D();
        const flags: (boolean | undefined)[] = [];
        model.addTransformListener((_node, automatic) => {
            flags.push(automatic);
        });
        model.setTransform(Mat3.Rotation(0.2));
        model.signalTransformUpdate();
        expect(flags).toEqual([true, undefined]);
    });
});

describe("signaled strategy (autoTransformUpdate off)", () => {
    test("a batch of edits calls nothing and leaves the view as it was", () => {
        const {model, view, counts} = makeCountedView(false);
        const start = view.threejs.matrix.elements.slice();
        for (let i = 0; i < 10; i++) {
            model.prsa.position = V2(i, 2 * i);
            model.prsa.rotation = 0.1 * i;
        }
        model.setTransform(Mat3.Translation2D(V2(7, 8)));
        model.zValue = 0.5;
        expect(counts.update).toBe(0);
        expect(counts.onTransformUpdate).toBe(0);
        expect(view.threejs.matrix.elements.slice()).toEqual(start);
    });

    test("one signalTransformUpdate() after the batch redraws the view once", () => {
        const {model, view, counts} = makeCountedView(false);
        for (let i = 0; i < 10; i++) {
            model.prsa.position = V2(i, 2 * i);
        }
        model.zValue = 0.25;
        model.signalTransformUpdate();
        expect(counts.onTransformUpdate).toBe(1);
        expectMatrix(view, embedded2D(matrixOf(model), 0.25));
    });

    test("flushTransformUpdate() signals once", () => {
        const {model, view, counts} = makeCountedView(false);
        model.prsa.position = V2(3, 4);
        model.flushTransformUpdate();
        expect(counts.onTransformUpdate).toBe(1);
        expectMatrix(view, embedded2D(matrixOf(model), 0));
    });

    test("other state changes still reach the view", () => {
        const {model, counts} = makeCountedView(false);
        model.visible = false;
        expect(counts.update).toBe(1);
        model.addTag("someTag");
        expect(counts.update).toBeGreaterThan(1);
    });

    test("turning autoTransformUpdate back on signals once, so the view catches up", () => {
        const {model, view, counts} = makeCountedView(false);
        model.prsa.position = V2(5, 6);
        model.autoTransformUpdate = true;
        expect(counts.onTransformUpdate).toBe(1);
        expectMatrix(view, embedded2D(matrixOf(model), 0));
        // ...and later edits redraw automatically again.
        model.prsa.position = V2(-1, 0);
        expectMatrix(view, embedded2D(matrixOf(model), 0));
    });
});

describe("Two.js views", () => {
    function makeTwoJSView() {
        const fakeController: any = {
            model: {cameraModel: undefined},
            registerViewForHitTesting: () => {},
            unregisterViewForHitTesting: () => {},
        };
        const sceneView = new ATwoJSSceneView(fakeController);
        sceneView.addModelViewSpec(AGroupNodeModel2D, ATwoJSGroupNodeView as any);
        const graph = new AModelGraph("graph");
        sceneView.setModelGraph(graph);
        sceneView.initModelGraphSubscriptions();
        const model = new AGroupNodeModel2D();
        graph.addNode(model);
        const view = sceneView.getViewListForModel(model)[0] as ATwoJSNodeView;
        const counts = {update: 0, updateTransform: 0};
        const update = view.update.bind(view);
        view.update = () => {
            counts.update++;
            update();
        };
        const updateTransform = view.updateTransform.bind(view);
        view.updateTransform = () => {
            counts.updateTransform++;
            updateTransform();
        };
        return {model, view, counts};
    }

    test("a transform change re-applies the transform once, without calling update()", () => {
        const {model, view, counts} = makeTwoJSView();
        model.setTransform(Mat3.Translation2D(V2(10, 20)));
        expect(counts.updateTransform).toBe(1);
        expect(counts.update).toBe(0);
        expect(view.twoGroup.translation.x).toBeCloseTo(10, 12);
        expect(view.twoGroup.translation.y).toBeCloseTo(20, 12);
    });

    test("with autoTransformUpdate off, the transform waits for the signal", () => {
        const {model, view, counts} = makeTwoJSView();
        model.autoTransformUpdate = false;
        model.prsa.position = V2(3, 4);
        expect(counts.updateTransform).toBe(0);
        model.signalTransformUpdate();
        expect(counts.updateTransform).toBe(1);
        expect(view.twoGroup.translation.x).toBeCloseTo(3, 12);
    });
});

describe("ACameraModel3D pose sync", () => {
    function makeCameraModel() {
        const camera = ACamera.CreatePerspectiveFOV(Math.PI / 3, 1, 0.1, 100);
        const cameraModel = new ACameraModel3D(camera);
        let setPoseCalls = 0;
        const setPose = camera.setPose.bind(camera);
        camera.setPose = (pose: any) => {
            setPoseCalls++;
            setPose(pose);
        };
        return {cameraModel, camera, calls: () => setPoseCalls};
    }

    test("replacing the transform syncs the camera's pose, and the sync settles", () => {
        const {cameraModel, camera, calls} = makeCameraModel();
        const pose = NodeTransform3D.LookAt(V3(0, -5, 0), V3(0, 0, 0), V3(0, 0, 1));
        cameraModel.setTransform(pose);
        expect(camera.pose.getMat4().elements).toEqual(pose.getMat4().elements);
        expect(calls()).toBeGreaterThanOrEqual(1);
        expect(calls()).toBeLessThanOrEqual(3);
    });

    test("an explicit signalTransformUpdate() syncs the camera's pose", () => {
        const {cameraModel, calls} = makeCameraModel();
        const before = calls();
        cameraModel.signalTransformUpdate();
        expect(calls()).toBe(before + 1);
    });

    test("a nested edit does not call camera.setPose", () => {
        const {cameraModel, calls} = makeCameraModel();
        const before = calls();
        (cameraModel.transform as NodeTransform3D).position = V3(1, 2, 3);
        expect(calls()).toBe(before);
    });
});
