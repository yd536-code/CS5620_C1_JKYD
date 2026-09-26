/**
 * Tests for pushing values into the control panel (leva) store and for `addControlPanelListener`:
 * - `updateControlPanelValue` / `setControlPanelStateValue` push a color as `RGBuintAfloat`, not as a raw
 *   AniGraph `Color` (which would corrupt leva's swatch).
 * - `addControlPanelListener` callbacks receive the app state.
 */
// Import order matters: see the note in RenderMatrix.test.ts (in scene/__tests__).
import {AMeshModel2D} from "../../scene/nodes/2d/mesh2d/AMeshModel2D";
import {AAppState} from "../AAppState";
import {Color} from "../../math/Color";

new AMeshModel2D(); // priming reference only -- see the import-order note above.

class TestAppState extends AAppState {}

/** A stand-in for leva's store that records every value pushed into it. */
function makeStore() {
    const pushed: {[path: string]: any} = {};
    return {pushed, setValueAtPath(path: string, value: any) { pushed[path] = value; }};
}

describe("AAppState: color values pushed to the control panel", () => {
    test("setControlPanelStateValue pushes RGBuintAfloat for a Color", () => {
        const appState = new TestAppState();
        appState.addColorControl("Tint", Color.FromString("#ff0000"));
        const store = makeStore();
        appState._setControlPanelStore(store);
        const blue = Color.FromString("#0000ff");
        appState.setControlPanelStateValue("Tint", blue);
        expect(store.pushed["Tint"]).not.toBeInstanceOf(Color);
        expect(store.pushed["Tint"]).toEqual(blue.RGBuintAfloat);
        expect(appState.getState("Tint")).toBeInstanceOf(Color); // state still holds a Color (a valtio proxy of it)
    });

    test("updateControlPanelValue pushes RGBuintAfloat for a Color", () => {
        const appState = new TestAppState();
        appState.addColorControl("Tint", Color.FromString("#ff0000"));
        const store = makeStore();
        appState._setControlPanelStore(store);
        const green = Color.FromString("#00ff00");
        appState.setState("Tint", green);
        appState.updateControlPanelValue("Tint");
        expect(store.pushed["Tint"]).toEqual(green.RGBuintAfloat);
    });

    test("non-color values are pushed unchanged", () => {
        const appState = new TestAppState();
        appState.addSliderControl("Speed", 1, 0, 10, 0.1);
        const store = makeStore();
        appState._setControlPanelStore(store);
        appState.setControlPanelStateValue("Speed", 3);
        expect(store.pushed["Speed"]).toBe(3);
    });
});

describe("AAppState.addControlPanelListener", () => {
    test("the callback receives the app state", () => {
        const appState = new TestAppState();
        const received: any[] = [];
        appState.addControlPanelListener((a) => { received.push(a); });
        appState.updateControlPanel();
        expect(received).toEqual([appState]);
    });
});
