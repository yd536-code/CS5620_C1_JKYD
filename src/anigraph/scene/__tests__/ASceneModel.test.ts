import {ASceneModel} from "../ASceneModel";
import {ANodeModel2D} from "../nodeModel/ANodeModel2D";
import {ANodeModel} from "../nodeModel/ANodeModel";
import type {AppState} from "../../appstate";

/**
 * Minimal concrete `ASceneModel` -- every abstract hook is a no-op, since
 * these tests only exercise `getNodesOfType`/`bindNodeEvent`, not
 * initialization/rendering.
 */
class TestSceneModel extends ASceneModel {
    protected initScene(...args: any[]): void {}
    initAppState(appState: AppState): void {}
    initCamera(...args: any[]): void {}
    timeUpdate(...args: any[]): void {}
}

class TestNodeA extends ANodeModel2D {}
class TestNodeB extends ANodeModel2D {}
abstract class TestAbstractNode extends ANodeModel2D {}
class TestConcreteNode extends TestAbstractNode {}

const isTestNodeA = (n: any): n is TestNodeA => n instanceof TestNodeA;

describe("ASceneModel.getNodesOfType", () => {
    test("returns an empty array for an empty scene", () => {
        const scene = new TestSceneModel("scene");
        expect(scene.getNodesOfType(TestNodeA)).toEqual([]);
    });

    test("returns only nodes of the matching type, among mixed types", () => {
        const scene = new TestSceneModel("scene");
        const a1 = new TestNodeA();
        const a2 = new TestNodeA();
        const b1 = new TestNodeB();
        scene.addNode(a1);
        scene.addNode(a2);
        scene.addNode(b1);

        const as = scene.getNodesOfType(TestNodeA);
        expect(as).toHaveLength(2);
        expect(as).toContain(a1);
        expect(as).toContain(a2);
        expect(scene.getNodesOfType(TestNodeB)).toEqual([b1]);
    });

    test("finds nodes nested under a group node", () => {
        const scene = new TestSceneModel("scene");
        const group = new TestNodeA();
        scene.addNode(group);
        const child = new TestNodeB();
        group.addChild(child);

        expect(scene.getNodesOfType(TestNodeB)).toEqual([child]);
        expect(scene.getNodesOfType(TestNodeA)).toEqual([group]);
    });

    test("accepts an abstract base class as `ctor`", () => {
        const scene = new TestSceneModel("scene");
        const node = new TestConcreteNode();
        scene.addNode(node);
        expect(scene.getNodesOfType(TestAbstractNode)).toEqual([node]);
    });
});

describe("ASceneModel.bindNodeEvent", () => {
    test("binds an already-present matching node and fires the handler on its event", () => {
        const scene = new TestSceneModel("scene");
        const node = new TestNodeA();
        scene.addNode(node);
        let fired = 0;
        scene.bindNodeEvent(isTestNodeA, "TEST_EVENT", () => {
            fired++;
        });

        node.signalEvent("TEST_EVENT");
        expect(fired).toBe(1);
    });

    test("binds a node added after the call (subscribe-on-add)", () => {
        const scene = new TestSceneModel("scene");
        let fired = 0;
        scene.bindNodeEvent(isTestNodeA, "TEST_EVENT", () => {
            fired++;
        });

        const node = new TestNodeA();
        scene.addNode(node);
        node.signalEvent("TEST_EVENT");
        expect(fired).toBe(1);
    });

    test("does not bind nodes that fail the predicate", () => {
        const scene = new TestSceneModel("scene");
        const other = new TestNodeB();
        scene.addNode(other);
        let fired = 0;
        scene.bindNodeEvent(isTestNodeA, "TEST_EVENT", () => {
            fired++;
        });

        other.signalEvent("TEST_EVENT");
        expect(fired).toBe(0);
    });

    test("unsubscribes on release (NodeReleased), not merely on removal from the graph", () => {
        const scene = new TestSceneModel("scene");
        const node = new TestNodeA();
        scene.addNode(node);
        let fired = 0;
        scene.bindNodeEvent(isTestNodeA, "TEST_EVENT", () => {
            fired++;
        });

        node.signalEvent("TEST_EVENT");
        expect(fired).toBe(1);

        node.release();
        node.signalEvent("TEST_EVENT");
        expect(fired).toBe(1); // unchanged: the subscription was torn down by NodeReleased
    });

    test("a plain reparent (remove + re-add, no release) does not duplicate the handler", () => {
        const scene = new TestSceneModel("scene");
        const group = new TestNodeA();
        scene.addNode(group);
        const node = new TestNodeA();
        group.addChild(node);

        let fired = 0;
        scene.bindNodeEvent(isTestNodeA, "TEST_EVENT", () => {
            fired++;
        });

        // Reparent: remove from `group` and re-add directly under the scene,
        // with no `release()` in between. This re-fires NodeAdded (and, per
        // AModelGraph._addModel, unconditionally) for a node that was never
        // released -- `bindNodeEvent` must not double-bind it.
        group.removeChild(node);
        scene.addNode(node);

        node.signalEvent("TEST_EVENT");
        expect(fired).toBe(1);
    });

    test("does not leak subscriptions across repeated add/release of same-shaped nodes", () => {
        const scene = new TestSceneModel("scene");
        const fireCounts: number[] = [];
        scene.bindNodeEvent(isTestNodeA, "TEST_EVENT", () => {
            fireCounts.push(fireCounts.length);
        });

        for (let i = 0; i < 3; i++) {
            const node = new TestNodeA();
            scene.addNode(node);
            node.signalEvent("TEST_EVENT");
            node.release();
            node.signalEvent("TEST_EVENT"); // no longer bound -- must not fire again
        }

        expect(fireCounts).toHaveLength(3);
    });

    test("releasing several matching nodes in a batch (e.g. a scene's clear-all loop) tears down every subscription -- none leak", () => {
        const scene = new TestSceneModel("scene");
        const nodes = [new TestNodeA(), new TestNodeA(), new TestNodeA()];
        for (const n of nodes) {
            scene.addNode(n);
        }

        let fired = 0;
        scene.bindNodeEvent(isTestNodeA, "TEST_EVENT", () => {
            fired++;
        });

        for (const n of nodes) {
            n.signalEvent("TEST_EVENT");
        }
        expect(fired).toBe(3);

        // Batch-release, exactly as `clearAll()` does: iterate a plain array
        // of siblings (all direct children of the same model graph, not
        // nested under one another) and call `release()` on each
        // independently, one after another in the same synchronous loop.
        for (const n of nodes) {
            n.release();
        }

        fired = 0;
        for (const n of nodes) {
            n.signalEvent("TEST_EVENT");
        }
        expect(fired).toBe(0);
    });

    test("a node added the way loadSceneFromJSON adds a revived object is bound, and a later edit (not just the load's own retrace) retraces too", () => {
        const scene = new TestSceneModel("scene");
        let fired = 0;
        scene.bindNodeEvent(isTestNodeA, "TEST_EVENT", () => {
            fired++;
        });

        // loadSceneFromJSON addNode's each revived object directly, with no
        // explicit per-object subscribe call of its own -- only NodeAdded
        // firing (from addNode) should bind it. The load itself finishes
        // with one explicit retraceRays() call, so the real risk this
        // covers is a *later* edit (e.g. the user drags the loaded object)
        // going unbound because nothing subscribed to it.
        const revived = new TestNodeA();
        scene.addNode(revived);

        revived.signalEvent("TEST_EVENT");
        expect(fired).toBe(1);
    });

    test("two separate bindNodeEvent calls for the same eventName do not clobber each other", () => {
        const scene = new TestSceneModel("scene");
        const node = new TestNodeA();
        scene.addNode(node);

        let firedFirst = 0;
        let firedSecond = 0;
        scene.bindNodeEvent(isTestNodeA, "TEST_EVENT", () => {
            firedFirst++;
        });
        scene.bindNodeEvent(isTestNodeA, "TEST_EVENT", () => {
            firedSecond++;
        });

        node.signalEvent("TEST_EVENT");
        expect(firedFirst).toBe(1);
        expect(firedSecond).toBe(1);
    });
});

/** The uids of `nodes`, so a failing assertion prints short strings instead of whole (cyclic) node objects. */
function uids(nodes: {uid: string}[]): string[] {
    return nodes.map((n) => n.uid);
}

describe("ASceneModel.getNodeModelsForModelGraph", () => {
    test("uses the model graph object it is given, not the main graph", () => {
        const scene = new TestSceneModel("scene");
        const hud = scene.createModelGraph("HUD");
        const mainNode = new TestNodeA();
        const hudNode = new TestNodeB();
        scene.addNode(mainNode);
        hud.addChild(hudNode);

        expect(uids(scene.getNodeModelsForModelGraph(hud))).toEqual([hudNode.uid]);
        expect(uids(scene.getNodeModelsForModelGraph("HUD"))).toEqual([hudNode.uid]);
        expect(uids(scene.getNodeModelsForModelGraph())).toContain(mainNode.uid);
        expect(uids(scene.getNodeModelsForModelGraph())).not.toContain(hudNode.uid);
    });

    test("returns only node models, including nested ones", () => {
        const scene = new TestSceneModel("scene");
        const group = new TestNodeA();
        const child = new TestNodeB();
        scene.addNode(group);
        group.addChild(child);
        const result = scene.getNodeModelsForModelGraph();
        expect(uids(result)).toEqual(expect.arrayContaining([group.uid, child.uid]));
        expect(result.every((node) => node instanceof ANodeModel)).toBe(true);
    });
});
