/**
 * Tests for two members every backend shares through the `ASceneController` base: `getWorldCoordinatesOfCursorEvent`
 * (used by `AppSceneController2D`/`ATwoJSAppSceneController`) and `initSceneViews` (used by
 * `AGLSceneController`/`ATwoJSSceneController`; it loops over `this.model.modelGraphs` and calls the
 * backend-specific `createSceneView`).
 *
 * `ASceneController` is abstract with a heavy constructor (rendering context, interaction-mode map, ...), so
 * these call the real prototype methods against a minimal fake `this` shaped only with what each method actually
 * reads -- the same technique `ARenderPass.test.ts` uses for `render()`'s controller mock.
 */
import {ASceneController} from "../ASceneController";

describe("ASceneController.getWorldCoordinatesOfCursorEvent", () => {
    function call(fakeThis: any, event: any) {
        return ASceneController.prototype.getWorldCoordinatesOfCursorEvent.call(fakeThis, event);
    }

    test("returns cameraModel.ndcToWorld(event.ndcCursor) when the event has a cursor position", () => {
        const worldPoint = {x: 3, y: 4};
        const ndcToWorld = jest.fn(() => worldPoint);
        const fakeThis = {model: {cameraModel: {ndcToWorld}}};
        const event = {ndcCursor: {x: 0.5, y: -0.5}};

        const result = call(fakeThis, event);

        expect(result).toBe(worldPoint);
        expect(ndcToWorld).toHaveBeenCalledWith(event.ndcCursor);
    });

    test("returns undefined, and never calls ndcToWorld, when the event has no cursor position", () => {
        const ndcToWorld = jest.fn();
        const fakeThis = {model: {cameraModel: {ndcToWorld}}};
        const event = {ndcCursor: null};

        expect(call(fakeThis, event)).toBeUndefined();
        expect(ndcToWorld).not.toHaveBeenCalled();
    });
});

describe("ASceneController.initSceneViews", () => {
    test("calls createSceneView once per model graph, by name", () => {
        const calls: [string, any][] = [];
        const fakeThis = {
            model: {modelGraphs: {MAIN_MODEL_GRAPH: "mainGraph", HUD: "hudGraph"}},
            createSceneView: (name: string, graph: any) => calls.push([name, graph]),
        };

        ASceneController.prototype.initSceneViews.call(fakeThis);

        expect(calls).toEqual([["MAIN_MODEL_GRAPH", "mainGraph"], ["HUD", "hudGraph"]]);
    });

    test("a scene model with only the main graph makes exactly one call", () => {
        const calls: [string, any][] = [];
        const fakeThis = {
            model: {modelGraphs: {MAIN_MODEL_GRAPH: "mainGraph"}},
            createSceneView: (name: string, graph: any) => calls.push([name, graph]),
        };

        ASceneController.prototype.initSceneViews.call(fakeThis);

        expect(calls).toEqual([["MAIN_MODEL_GRAPH", "mainGraph"]]);
    });
});
