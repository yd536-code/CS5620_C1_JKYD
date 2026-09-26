/**
 * `CreateAppState` called a second time returns the existing app state instead of throwing.
 * This can happen on hot reload, or when a scene creates the app state twice.
 */
// Import order matters: see the note in RenderMatrix.test.ts (in scene/__tests__).
import {AMeshModel2D} from "../../scene/nodes/2d/mesh2d/AMeshModel2D";
import {CreateAppState} from "../AppState";
import {CheckAAppState} from "../AAppState";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

describe("CreateAppState", () => {
    test("a second call returns the same app state, warns, and doesn't throw", () => {
        const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
        const sceneModel: any = {};
        const first = CreateAppState(sceneModel);
        expect(CheckAAppState()).toBe(first);
        let second: any;
        expect(() => { second = CreateAppState(sceneModel); }).not.toThrow();
        expect(second).toBe(first);
        expect(warn).toHaveBeenCalledTimes(1);
        warn.mockRestore();
    });
});
