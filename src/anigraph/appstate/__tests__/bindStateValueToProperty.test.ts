import {AAppState} from "../AAppState";

class TestAppState extends AAppState {}

describe("AAppState.bindStateValueToProperty", () => {
    test("assigns the new value to target[key] and then calls signal with the target", () => {
        const appState = new TestAppState();
        const target = {degree: 3};
        const seen: number[] = [];
        appState.bindStateValueToProperty("Degree", target, "degree", {signal: (t) => seen.push(t.degree)});

        appState.setState("Degree", 5);
        expect(target.degree).toBe(5);
        expect(seen).toEqual([5]); // signal ran after the assignment, not before
    });

    test("works without a signal option", () => {
        const appState = new TestAppState();
        const target = {speed: 1};
        appState.bindStateValueToProperty("Speed", target, "speed");
        appState.setState("Speed", 2.5);
        expect(target.speed).toBe(2.5);
    });

    test("transform maps the raw control value before assignment", () => {
        const appState = new TestAppState();
        const target = {count: 0};
        appState.bindStateValueToProperty("Count", target, "count", {transform: (v) => Math.round(v)});
        appState.setState("Count", 4.6);
        expect(target.count).toBe(5);
    });

    test("only reacts to its own control's name", () => {
        const appState = new TestAppState();
        const target = {a: 0, b: 0};
        appState.bindStateValueToProperty("A", target, "a");
        appState.setState("B", 9);
        expect(target).toEqual({a: 0, b: 0});
    });

    test("returned switch deactivates the binding", () => {
        const appState = new TestAppState();
        const target = {v: 0};
        const sw = appState.bindStateValueToProperty("V", target, "v");
        appState.setState("V", 1);
        sw.deactivate();
        appState.setState("V", 2);
        expect(target.v).toBe(1);
    });
});
