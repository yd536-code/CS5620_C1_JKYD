/**
 * Tests that a callback switch's `active` flag matches whether its callback is really registered, however the
 * callback was removed, and that an {@link AGroupCallbackSwitch}'s `active` is the OR of its children's.
 */
// Load a higher-level module first; the engine has a circular import that only resolves in this order.
import {AMeshModel2D, AObject, AGroupCallbackSwitch, AEventCallbackDict} from "../../../index";

new AMeshModel2D();

describe("callback switch active flags", () => {
  test("removeCallback marks the switch inactive", () => {
    const dict = new AEventCallbackDict("e");
    const sw = dict.addCallback(() => {}, "h");
    expect(sw.active).toBe(true);
    dict.removeCallback("h");
    expect(sw.active).toBe(false);
  });

  test("removeEventListener marks the switch inactive", () => {
    const obj = new AObject();
    const sw = obj.addEventListener("e", () => {}, "h");
    obj.removeEventListener("e", "h");
    expect(sw.active).toBe(false);
  });

  test("a one-time listener's switch is inactive after it fires", () => {
    const obj = new AObject();
    let n = 0;
    const sw = obj.addOneTimeEventListener("e", () => { n++; });
    obj.signalEvent("e");
    obj.signalEvent("e");
    expect(n).toBe(1);
    expect(sw.active).toBe(false);
  });

  test("replacing a callback by reusing its handle deactivates the old switch, and the old switch can't remove the new callback", () => {
    const obj = new AObject();
    let calls: string[] = [];
    const oldSw = obj.addEventListener("e", () => calls.push("old"), "h");
    const newSw = obj.addEventListener("e", () => calls.push("new"), "h");
    expect(oldSw.active).toBe(false);
    oldSw.deactivate();
    obj.signalEvent("e");
    expect(calls).toEqual(["new"]);
    expect(newSw.active).toBe(true);
  });

  test("a group switch's active flag is the OR of its children's", () => {
    const obj = new AObject();
    const a = obj.addEventListener("a", () => {});
    const b = obj.addEventListener("b", () => {});
    const group = new AGroupCallbackSwitch([a, b]);
    expect(group.active).toBe(true);
    group.deactivate();
    expect(group.active).toBe(false);
    a.activate();
    expect(group.active).toBe(true);
    group.activate();
    obj.removeEventListener("a", a.handle);
    expect(group.active).toBe(true);
    obj.removeEventListener("b", b.handle);
    expect(group.active).toBe(false);
  });

  test("a subscription whose callback was removed elsewhere can be reactivated", () => {
    const obj = new AObject();
    const holder = new AObject();
    let n = 0;
    const sw = obj.addEventListener("e", () => { n++; }, "h");
    holder.subscribe(sw, "sub");
    obj.removeEventListener("e", "h");
    holder.activateSubscription("sub");
    obj.signalEvent("e");
    expect(n).toBe(1);
  });
});
