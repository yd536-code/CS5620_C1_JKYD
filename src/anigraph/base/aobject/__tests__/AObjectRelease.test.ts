/**
 * Tests that `AObject.release()` removes the state listeners added to the object, that `removeListener` tolerates
 * unknown handles, and the `stateSnapshot` getter.
 */
// Load a higher-level module first; the engine has a circular import that only resolves in this order.
import {AMeshModel2D, AObjectNode} from "../../../index";

new AMeshModel2D();

describe("AObject.release and state listeners", () => {
  test("no state callbacks run after release()", () => {
    const obj = new AObjectNode();
    let keyCalls = 0;
    let anyCalls = 0;
    const keySwitch = obj.addStateKeyListener("name", () => { keyCalls++; });
    const anySwitch = obj.addStateListener(() => { anyCalls++; });
    obj.name = "first";
    expect(keyCalls).toBe(1);
    expect(anyCalls).toBe(1);
    obj.release();
    obj.name = "second";
    expect(keyCalls).toBe(1);
    expect(anyCalls).toBe(1);
    expect(keySwitch.active).toBe(false);
    expect(anySwitch.active).toBe(false);
  });

  test("removeListener with an unknown handle warns instead of throwing", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const obj = new AObjectNode();
    expect(() => obj.removeListener("no-such-handle")).not.toThrow();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  test("deactivating a listener that release() already removed doesn't warn or throw", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const obj = new AObjectNode();
    const sw = obj.addStateKeyListener("name", () => {});
    obj.release();
    expect(() => sw.deactivate()).not.toThrow();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  test("activate() on an already-active state listener doesn't register it twice", () => {
    const obj = new AObjectNode();
    let calls = 0;
    const sw = obj.addStateKeyListener("name", () => { calls++; });
    sw.activate();
    obj.name = "once";
    expect(calls).toBe(1);
  });

  test("reusing a state listener's handle replaces the old listener", () => {
    const obj = new AObjectNode();
    const calls: string[] = [];
    const oldSw = obj.addStateKeyListener("name", () => { calls.push("old"); }, "h");
    const newSw = obj.addStateKeyListener("name", () => { calls.push("new"); }, "h");
    obj.name = "changed";
    expect(calls).toEqual(["new"]);
    expect(oldSw.active).toBe(false);
    expect(newSw.active).toBe(true);
  });

  test("stateSnapshot returns a snapshot of state", () => {
    const obj = new AObjectNode();
    obj.name = "snap";
    expect(obj.stateSnapshot.name).toBe("snap");
  });
});
