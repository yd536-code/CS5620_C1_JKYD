/**
 * Tests for the members both backends share through the `ARenderWindow` base: `isRendering`,
 * `startRendering`/`stopRendering`, `aspect`, and `_registerResizeListener` (which each backend's constructor calls).
 *
 * `ARenderWindow` is abstract and its `isRendering` field is an `@AObjectState` (backed by a `valtio` proxy on
 * `this.state`, set up by the real `AObject` constructor). These tests build a fake instance via
 * `Object.create(ARenderWindow.prototype)` (the same technique `ASceneView.test.ts` uses for another abstract
 * class with several backend-specific members) with a plain object standing in for `state` -- sufficient for the
 * decorator's own `get`/`set` (`this.state[key]`), without needing a real `valtio` proxy or the rest of `AObject`'s
 * construction.
 */
import {ARenderWindow} from "../ARenderWindow";

function fakeRenderWindow(overrides: any = {}): any {
    return Object.assign(Object.create(ARenderWindow.prototype), {state: {}, ...overrides});
}

describe("ARenderWindow.startRendering / stopRendering", () => {
    test("startRendering sets isRendering and calls render() exactly once", () => {
        const calls: number[] = [];
        const w = fakeRenderWindow({render: () => calls.push(1)});

        w.startRendering();

        expect(w.isRendering).toBe(true);
        expect(calls).toEqual([1]);
    });

    test("startRendering is a no-op if already rendering", () => {
        const calls: number[] = [];
        const w = fakeRenderWindow({render: () => calls.push(1)});
        w.isRendering = true;

        w.startRendering();

        expect(calls).toEqual([]);
    });

    test("stopRendering sets isRendering to false", () => {
        const w = fakeRenderWindow();
        w.isRendering = true;

        w.stopRendering();

        expect(w.isRendering).toBe(false);
    });
});

describe("ARenderWindow.aspect", () => {
    test("returns 1 when no container has been set yet", () => {
        const w = fakeRenderWindow();
        expect(w.aspect).toBe(1);
    });

    test("returns the container's clientWidth/clientHeight ratio once one is set", () => {
        const w = fakeRenderWindow({_container: {clientWidth: 800, clientHeight: 400}});
        expect(w.aspect).toBe(2);
    });
});

describe("ARenderWindow._registerResizeListener", () => {
    test("notifies sceneController.onWindowResize(self) on a window resize event", () => {
        const calls: any[] = [];
        const w = fakeRenderWindow({_sceneController: {onWindowResize: (rw: any) => calls.push(rw)}});

        w._registerResizeListener();
        window.dispatchEvent(new Event("resize"));

        expect(calls).toEqual([w]);
    });
});
