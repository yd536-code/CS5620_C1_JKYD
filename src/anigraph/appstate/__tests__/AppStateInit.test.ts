/**
 * `AppState.init()` runs exactly once, even though both `SetAppState` and `confirmInitialized` ask for it.
 */
// Import order matters: see the note in RenderMatrix.test.ts (in scene/__tests__).
import {AMeshModel2D} from "../../scene/nodes/2d/mesh2d/AMeshModel2D";
import {AppState} from "../AppState";
import {SetAppState} from "../AAppState";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

describe("AppState init", () => {
    test("init() is called once across SetAppState and confirmInitialized", async () => {
        let calls = 0;
        class CountingAppState extends AppState {
            init() { calls++; }
        }
        const appState = new CountingAppState({} as any); // no render windows, so nothing else to wait for
        SetAppState(appState);
        await appState.confirmInitialized();
        expect(calls).toBe(1);
    });
});
