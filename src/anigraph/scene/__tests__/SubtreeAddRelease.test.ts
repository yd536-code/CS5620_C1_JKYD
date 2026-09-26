/**
 * Tests for adding a subtree that was built before it joined the scene, and for releasing a subtree after it was
 * removed from the scene.
 *
 * Part 1: `AModelGraph` registers the added node *and all of its descendants*, in preorder, so every node in a
 * prebuilt subtree gets a view nested under its parent's view, whichever order the tree was built in.
 *
 * Part 2: `AModelGraph` watches each registered node's own `RELEASE` event, so a node released after being detached
 * from the graph is still removed from `modelMap`, still fires `NodeReleased` (once), and its views are still
 * released and removed from the scene view's `viewMap`.
 *
 * The scene-view tests construct real `AGLSceneView`/`ATwoJSSceneView` instances against a minimal fake controller,
 * the same technique `rendering/twojs/__tests__/ATwoJSSceneView.test.ts` uses. Only `controller.model` is needed
 * (plus the Two.js hit-test registry hooks).
 */
// Import order matters: see the note in RenderMatrix.test.ts.
import {AMeshModel2D} from "../nodes/2d/mesh2d/AMeshModel2D";
import {AGroupNodeModel2D} from "../nodeModel/AGroupNodeModel2D";
import {AModelGraph} from "../AModelGraph";
import {AGLSceneView} from "../AGLSceneView";
import {AGLNodeView} from "../nodeView/AGLNodeView";
import {ANodeModel} from "../nodeModel/ANodeModel";
import {ASceneModel} from "../ASceneModel";
import {ANodeModel2D} from "../nodeModel/ANodeModel2D";
import {ATwoJSSceneView} from "../../rendering/twojs/ATwoJSSceneView";
import {ATwoJSGroupNodeView} from "../../rendering/twojs/ATwoJSGroupNodeView";
import {ATwoJSNodeView} from "../../rendering/twojs/ATwoJSNodeView";
import {SceneGraphEvents} from "../../basictypes";
import type {AppState} from "../../appstate";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

/** A three-level tree, `parent → child → grandchild`, built entirely before anything is added to a graph. */
function makeTree() {
    const parent = new AGroupNodeModel2D();
    const child = new AGroupNodeModel2D();
    const grandchild = new AGroupNodeModel2D();
    parent.addChild(child);
    child.addChild(grandchild);
    return {parent, child, grandchild};
}

/** Records the uid of every node a graph signals `eventName` for, in order. */
function recordEvents(graph: AModelGraph, eventName: string): string[] {
    const uids: string[] = [];
    graph.addEventListener(eventName, (node: ANodeModel) => {
        uids.push(node.uid);
    });
    return uids;
}

/** A real `AGLSceneView` subscribed to `graph`, with `AGroupNodeModel2D → AGroupNodeView` registered by default. */
function makeGLSceneView(graph: AModelGraph): AGLSceneView {
    const fakeController: any = {model: {uid: "fakeSceneModel"}};
    const sceneView = new AGLSceneView(fakeController, graph);
    sceneView.initModelGraphSubscriptions();
    return sceneView;
}

/** A real `ATwoJSSceneView` subscribed to `graph`, with `AGroupNodeModel2D → ATwoJSGroupNodeView` registered. */
function makeTwoJSSceneView(graph: AModelGraph): ATwoJSSceneView {
    const fakeController: any = {
        model: {cameraModel: undefined},
        registerViewForHitTesting: () => {},
        unregisterViewForHitTesting: () => {},
    };
    const sceneView = new ATwoJSSceneView(fakeController);
    sceneView.addModelViewSpec(AGroupNodeModel2D, ATwoJSGroupNodeView as any);
    sceneView.setModelGraph(graph);
    sceneView.initModelGraphSubscriptions();
    return sceneView;
}

function glViewOf(sceneView: AGLSceneView, model: ANodeModel): AGLNodeView {
    const views = sceneView.getViewListForModel(model);
    expect(views).toHaveLength(1);
    return views[0] as AGLNodeView;
}

function twoViewOf(sceneView: ATwoJSSceneView, model: ANodeModel): ATwoJSNodeView {
    const views = sceneView.getViewListForModel(model);
    expect(views).toHaveLength(1);
    return views[0] as ATwoJSNodeView;
}

/** Asserts `model`'s AGL render object is nested directly inside `parent`'s. */
function expectGLNested(sceneView: AGLSceneView, model: ANodeModel, parent: ANodeModel) {
    expect(glViewOf(sceneView, model).threejs.parent).toBe(glViewOf(sceneView, parent).threejs);
}

function expectTwoNested(sceneView: ATwoJSSceneView, model: ANodeModel, parent: ANodeModel) {
    expect(twoViewOf(sceneView, model).twoGroup.parent).toBe(twoViewOf(sceneView, parent).twoGroup);
}

// ── Part 1: adding a prebuilt subtree ─────────────────────────────────────────────────────────────────────────

describe("AModelGraph: adding a subtree that already has descendants", () => {
    test("registers every node of the subtree in modelMap", () => {
        const graph = new AModelGraph("graph");
        const {parent, child, grandchild} = makeTree();
        graph.addNode(parent);
        expect(graph.hasModel(parent)).toBe(true);
        expect(graph.hasModel(child)).toBe(true);
        expect(graph.hasModel(grandchild)).toBe(true);
    });

    test("signals NodeAdded for every node of the subtree, in preorder (parents before children)", () => {
        const graph = new AModelGraph("graph");
        const added = recordEvents(graph, SceneGraphEvents.NodeAdded);
        const {parent, child, grandchild} = makeTree();
        graph.addNode(parent);
        expect(added).toEqual([parent.uid, child.uid, grandchild.uid]);
    });

    test("adding one leaf still signals NodeAdded exactly once", () => {
        const graph = new AModelGraph("graph");
        const parent = new AGroupNodeModel2D();
        graph.addNode(parent);
        const added = recordEvents(graph, SceneGraphEvents.NodeAdded);
        const leaf = new AGroupNodeModel2D();
        parent.addChild(leaf);
        expect(added).toEqual([leaf.uid]);
    });
});

describe("AGLSceneView: views for a prebuilt subtree", () => {
    test("every node gets exactly one view, nested under its parent's view", () => {
        const graph = new AModelGraph("graph");
        const sceneView = makeGLSceneView(graph);
        const {parent, child, grandchild} = makeTree();
        graph.addNode(parent);

        expect(glViewOf(sceneView, parent).threejs.parent).toBe(sceneView.threejs);
        expectGLNested(sceneView, child, parent);
        expectGLNested(sceneView, grandchild, child);
    });

    test("reparenting under a node that is not in the scene yet, then adding that node, attaches the view", () => {
        const graph = new AModelGraph("graph");
        const sceneView = makeGLSceneView(graph);
        const x = new AGroupNodeModel2D();
        graph.addNode(x);
        const newParent = new AGroupNodeModel2D(); // not in the graph yet

        x.reparent(newParent);
        graph.addNode(newParent);

        expectGLNested(sceneView, x, newParent);
    });

    test("regression: reparenting a subtree within the scene keeps one view per node, still nested", () => {
        const graph = new AModelGraph("graph");
        const sceneView = makeGLSceneView(graph);
        const a = new AGroupNodeModel2D();
        const b = new AGroupNodeModel2D();
        graph.addNode(a);
        graph.addNode(b);
        const x = new AGroupNodeModel2D();
        const y = new AGroupNodeModel2D();
        a.addChild(x);
        x.addChild(y);

        x.reparent(b);

        expectGLNested(sceneView, x, b);
        expectGLNested(sceneView, y, x);
    });

    test("regression: building the tree incrementally after the root is added still works", () => {
        const graph = new AModelGraph("graph");
        const sceneView = makeGLSceneView(graph);
        const parent = new AGroupNodeModel2D();
        graph.addNode(parent);
        const child = new AGroupNodeModel2D();
        parent.addChild(child);
        const grandchild = new AGroupNodeModel2D();
        child.addChild(grandchild);

        expectGLNested(sceneView, child, parent);
        expectGLNested(sceneView, grandchild, child);
    });
});

describe("ATwoJSSceneView: views for a prebuilt subtree", () => {
    test("every node gets exactly one view, nested under its parent's view", () => {
        const graph = new AModelGraph("graph");
        const sceneView = makeTwoJSSceneView(graph);
        const {parent, child, grandchild} = makeTree();
        graph.addNode(parent);

        expect(twoViewOf(sceneView, parent).twoGroup.parent).toBe(sceneView.twoGroup);
        expectTwoNested(sceneView, child, parent);
        expectTwoNested(sceneView, grandchild, child);
    });

    test("regression: reparenting a subtree within the scene keeps one view per node, still nested", () => {
        const graph = new AModelGraph("graph");
        const sceneView = makeTwoJSSceneView(graph);
        const a = new AGroupNodeModel2D();
        const b = new AGroupNodeModel2D();
        graph.addNode(a);
        graph.addNode(b);
        const x = new AGroupNodeModel2D();
        const y = new AGroupNodeModel2D();
        a.addChild(x);
        x.addChild(y);

        x.reparent(b);

        expectTwoNested(sceneView, x, b);
        expectTwoNested(sceneView, y, x);
    });
});

// ── Part 2: releasing a detached subtree ──────────────────────────────────────────────────────────────────────

describe("AModelGraph: releasing a subtree after it was removed from the graph", () => {
    test("every node leaves modelMap and signals NodeReleased", () => {
        const graph = new AModelGraph("graph");
        const {parent, child, grandchild} = makeTree();
        graph.addNode(parent);
        graph.removeChild(parent);
        const released = recordEvents(graph, SceneGraphEvents.NodeReleased);

        parent.release();

        expect(graph.hasModel(parent)).toBe(false);
        expect(graph.hasModel(child)).toBe(false);
        expect(graph.hasModel(grandchild)).toBe(false);
        expect([...released].sort()).toEqual([parent.uid, child.uid, grandchild.uid].sort());
    });

    test("releasing a subtree that is still in the graph signals NodeReleased exactly once per node", () => {
        const graph = new AModelGraph("graph");
        const {parent, child, grandchild} = makeTree();
        graph.addNode(parent);
        const released = recordEvents(graph, SceneGraphEvents.NodeReleased);

        parent.release();

        expect([...released].sort()).toEqual([parent.uid, child.uid, grandchild.uid].sort());
    });
});

describe("AGLSceneView: releasing a detached subtree", () => {
    test("releases its views and removes them from viewMap", () => {
        const graph = new AModelGraph("graph");
        const sceneView = makeGLSceneView(graph);
        const {parent, child, grandchild} = makeTree();
        graph.addNode(parent);
        graph.removeChild(parent);

        parent.release();

        for (const node of [parent, child, grandchild]) {
            expect(sceneView.getViewListForModel(node)).toHaveLength(0);
        }
    });

    test("a new node that reuses a released node's uid gets a new view (as Save/Load revival does)", () => {
        const graph = new AModelGraph("graph");
        const sceneView = makeGLSceneView(graph);
        const original = new AGroupNodeModel2D();
        graph.addNode(original);
        const oldView = glViewOf(sceneView, original);
        graph.removeChild(original);
        original.release();

        const revived = new AGroupNodeModel2D();
        revived.uid = original.uid;
        expect(revived.uid).toBe(original.uid);
        graph.addNode(revived);

        const newView = glViewOf(sceneView, revived);
        expect(newView).not.toBe(oldView);
        expect(newView.threejs.parent).toBe(sceneView.threejs);
    });
});

class TestSceneModel extends ASceneModel {
    protected initScene(...args: any[]): void {}
    initAppState(appState: AppState): void {}
    initCamera(...args: any[]): void {}
    timeUpdate(...args: any[]): void {}
}
class TestNode extends ANodeModel2D {}
const isTestNode = (n: any): n is TestNode => n instanceof TestNode;

describe("ASceneModel.bindNodeEvent with subtrees", () => {
    test("binds nodes that join the scene as descendants of a prebuilt subtree", () => {
        const scene = new TestSceneModel("scene");
        let fired = 0;
        scene.bindNodeEvent(isTestNode, "TEST_EVENT", () => {
            fired++;
        });
        const group = new TestNode();
        const inner = new TestNode();
        group.addChild(inner);
        scene.addNode(group);

        inner.signalEvent("TEST_EVENT");
        expect(fired).toBe(1);
    });

    test("unbinds a node released after it was removed from the scene", () => {
        const scene = new TestSceneModel("scene");
        const node = new TestNode();
        scene.addNode(node);
        let fired = 0;
        scene.bindNodeEvent(isTestNode, "TEST_EVENT", () => {
            fired++;
        });
        const handles = () => Object.keys((scene as any)._subscriptions).filter(k => k.startsWith("bindNodeEvent:"));
        expect(handles()).toHaveLength(1);

        scene.modelGraph.removeChild(node);
        node.release();

        expect(handles()).toHaveLength(0);
    });
});
