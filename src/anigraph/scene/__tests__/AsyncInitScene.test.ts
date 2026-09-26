/**
 * Initialization waits for an async `initScene`.
 *
 * - `ASceneModel.confirmInitialized` awaits `initScene`. The model counts as initialized, and its clock starts,
 *   only after an async `initScene` has finished.
 * - The promise from `ASceneController.confirmInitialized` resolves only after the controller has finished
 *   initializing (model first, then views and rendering).
 *
 * Uses deferred promises, not timers: importing the engine starts a fetch that fails under jsdom, and waiting on a
 * timer lets that rejection land mid-test.
 */
import {ASceneModel} from "../ASceneModel";
import {ASceneController} from "../ASceneController";
import type {AppState} from "../../appstate";
import {Mutex} from "async-mutex";

function deferred() {
    let resolve!: () => void;
    const promise = new Promise<void>(r => { resolve = r; });
    return {promise, resolve};
}

/** Lets pending promise callbacks run. */
async function flush(n: number = 10) {
    for (let i = 0; i < n; i++) { await Promise.resolve(); }
}

class AsyncSceneModel extends ASceneModel {
    gate = deferred();
    sceneBuilt = false;
    async PreloadAssets() {} // skip shader loading (no network in tests)
    initCamera(...args: any[]): void {}
    async initScene(...args: any[]) {
        await this.gate.promise;
        this.sceneBuilt = true;
    }
    initAppState(appState: AppState): void {}
    timeUpdate(...args: any[]): void {}
}

describe("ASceneModel.confirmInitialized awaits an async initScene", () => {
    test("isInitialized stays false, and the clock paused, until initScene resolves", async () => {
        const warn = jest.spyOn(console, "warn").mockImplementation(() => {}); // no camera in this test scene
        const model = new AsyncSceneModel("scene");
        let done = false;
        const p = model.confirmInitialized().then(() => { done = true; });
        await flush();
        expect(model.sceneBuilt).toBe(false);
        expect(model.isInitialized).toBe(false);
        expect(model.clock.paused).toBe(true);
        expect(done).toBe(false);

        model.gate.resolve();
        await p;
        expect(model.sceneBuilt).toBe(true);
        expect(model.isInitialized).toBe(true);
        expect(model.clock.paused).toBe(false);
        warn.mockRestore();
    });
});

describe("ASceneController.confirmInitialized waits for initialization", () => {
    test("the returned promise resolves only after the model and the controller are initialized", async () => {
        const modelGate = deferred();
        const renderingGate = deferred();
        const order: string[] = [];
        const fakeThis: any = {
            _initMutex: new Mutex(),
            get initMutex() { return this._initMutex; },
            _isInitialized: false,
            _clock: {play: () => order.push("clock")},
            model: {confirmInitialized: async () => { await modelGate.promise; order.push("model"); }},
            initSceneViews: () => order.push("views"),
            initModelViewSpecs: () => order.push("specs"),
            initRendering: async () => { await renderingGate.promise; order.push("rendering"); },
        };
        let done = false;
        const p = ASceneController.prototype.confirmInitialized.call(fakeThis).then(() => { done = true; });
        await flush();
        expect(done).toBe(false);

        modelGate.resolve();
        await flush();
        expect(order).toEqual(["model", "views", "specs"]);
        expect(done).toBe(false);

        renderingGate.resolve();
        await p;
        expect(order).toEqual(["model", "views", "specs", "rendering", "clock"]);
        expect(fakeThis._isInitialized).toBe(true);
    });
});
