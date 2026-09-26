import {ASceneModel} from "../ASceneModel";
import {ANodeModel2D} from "../nodeModel/ANodeModel2D";
import {BezierTween} from "../../geometry/BezierTween";
import type {AppState} from "../../appstate";

/**
 * Minimal concrete `ASceneModel`. Every abstract hook is a no-op: these tests only use the scene's clock and graph.
 */
class TestSceneModel extends ASceneModel {
    protected initScene(...args: any[]): void {}
    initAppState(appState: AppState): void {}
    initCamera(...args: any[]): void {}
    timeUpdate(...args: any[]): void {}
}

class TestNode extends ANodeModel2D {}

/**
 * Sets the scene clock's time and waits for its listeners. The clock's time listeners are batched (valtio notifies
 * them in a microtask after the change), so awaiting a few resolved promises is enough. This deliberately doesn't wait
 * on a timer: importing the engine starts a fetch that fails under jsdom, and a timer would let that failure land in
 * the middle of a test.
 * @param scene
 * @param t
 */
async function setTime(scene: ASceneModel, t: number){
    scene.clock.time = t;
    for(let i=0;i<5;i++){
        await Promise.resolve();
    }
}

/** A scene with its clock at time 0 and one node added to it. */
function sceneWithNode(){
    const scene = new TestSceneModel("scene");
    scene.clock.time = 0;
    const node = new TestNode();
    scene.addNode(node);
    return {scene, node};
}

describe("ANodeModel.addTimedAction", () => {
    test("sceneClock is the scene model's clock, for top-level and nested nodes, and undefined when detached", () => {
        const {scene, node} = sceneWithNode();
        const child = new TestNode();
        node.addChild(child);
        expect(node.sceneClock).toBe(scene.clock);
        expect(child.sceneClock).toBe(scene.clock);
        expect(new TestNode().sceneClock).toBeUndefined();
    });

    test("throws a helpful error for a node that isn't in a scene", () => {
        const node = new TestNode();
        expect(() => node.addTimedAction(() => {}, 1)).toThrow(/isn't in a scene/);
    });

    test("reports progress on the scene clock, ends with exactly 1, then calls the done callback once", async () => {
        const {scene, node} = sceneWithNode();
        const progress: number[] = [];
        const done = jest.fn();
        const handle = node.addTimedAction((p) => progress.push(p), 2, done);
        expect(handle).toBeDefined();
        expect(node.hasSubscription(handle as string)).toBe(true);

        await setTime(scene, 0.5);
        await setTime(scene, 1.0);
        expect(progress).toEqual([0.25, 0.5]);
        expect(done).not.toHaveBeenCalled();

        await setTime(scene, 2.5);
        expect(progress).toEqual([0.25, 0.5, 1]);
        expect(done).toHaveBeenCalledTimes(1);
        expect(node.hasSubscription(handle as string)).toBe(false);

        await setTime(scene, 3.0);
        expect(progress).toHaveLength(3);
        expect(done).toHaveBeenCalledTimes(1);
    });

    test("applies the tween, including to the final value", async () => {
        const {scene, node} = sceneWithNode();
        const tween = new BezierTween(0.33, -0.6, 0.66, 1.6);
        const progress: number[] = [];
        node.addTimedAction((p) => progress.push(p), 1, undefined, tween);
        await setTime(scene, 0.5);
        await setTime(scene, 1.5);
        expect(progress[0]).toBeCloseTo(tween.eval(0.5));
        expect(progress[1]).toBeCloseTo(tween.eval(1));
    });

    test("a handle keeps a second copy from starting while the first runs", async () => {
        const {scene, node} = sceneWithNode();
        const first = jest.fn();
        const second = jest.fn();
        expect(node.addTimedAction(first, 1, undefined, undefined, "spin")).toBe("spin");
        expect(node.addTimedAction(second, 1, undefined, undefined, "spin")).toBeUndefined();
        await setTime(scene, 0.5);
        expect(first).toHaveBeenCalledTimes(1);
        expect(second).not.toHaveBeenCalled();

        // Once the first finishes, the handle is free again.
        await setTime(scene, 1.5);
        expect(node.addTimedAction(second, 1, undefined, undefined, "spin")).toBe("spin");
        await setTime(scene, 2.0);
        expect(second).toHaveBeenCalledWith(0.5);
    });

    test("unsubscribing the handle cancels the action without calling the done callback", async () => {
        const {scene, node} = sceneWithNode();
        const callback = jest.fn();
        const done = jest.fn();
        node.addTimedAction(callback, 1, done, undefined, "pulse");
        await setTime(scene, 0.25);
        node.unsubscribe("pulse");
        await setTime(scene, 0.5);
        await setTime(scene, 2);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(done).not.toHaveBeenCalled();
    });

    test("releasing the node stops its timed actions", async () => {
        const {scene, node} = sceneWithNode();
        const callback = jest.fn();
        const done = jest.fn();
        node.addTimedAction(callback, 1, done);
        await setTime(scene, 0.25);
        node.release();
        await setTime(scene, 0.5);
        await setTime(scene, 2);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(done).not.toHaveBeenCalled();
    });
});

describe("ASceneModel.addTimedAction", () => {
    test("uses the same implementation: final progress 1, handle dedupe, subscription removed when done", async () => {
        const scene = new TestSceneModel("scene");
        scene.clock.time = 0;
        const progress: number[] = [];
        expect(scene.addTimedAction((p) => progress.push(p), 1, undefined, undefined, "entrance")).toBe("entrance");
        expect(scene.addTimedAction(() => {}, 1, undefined, undefined, "entrance")).toBeUndefined();
        await setTime(scene, 0.5);
        await setTime(scene, 1.25);
        expect(progress).toEqual([0.5, 1]);
        expect(scene.hasSubscription("entrance")).toBe(false);
    });
});
