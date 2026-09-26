/**
 * Tests for the arguments and timing of `AObjectNode`'s `NewParent` and `ChildRemoved` events.
 */
// Load a higher-level module first; the engine has a circular import that only resolves in this order.
import {AMeshModel2D, AObjectNode} from "../../../index";

new AMeshModel2D();

describe("AObjectNode NewParent / ChildRemoved listeners", () => {
  test("NewParent listeners get (newParent, undefined) on add and (null, oldParent) on removal", () => {
    const parent = new AObjectNode();
    const child = new AObjectNode();
    const calls: any[][] = [];
    child.addNewParentListener((newParent, oldParent) => calls.push([newParent, oldParent]));
    parent.addChild(child);
    parent.removeChild(child);
    expect(calls.length).toBe(2);
    expect(calls[0][0]).toBe(parent);
    expect(calls[0][1]).toBeUndefined();
    expect(calls[1][0]).toBeNull();
    expect(calls[1][1]).toBe(parent);
  });

  test("synchronous listeners fire before addChild/removeChild return", () => {
    const parent = new AObjectNode();
    const child = new AObjectNode();
    let newParentCalls = 0;
    let removedCalls = 0;
    child.addNewParentListener(() => { newParentCalls++; }, undefined, true);
    parent.addChildRemovedListener(() => { removedCalls++; }, undefined, true);
    parent.addChild(child);
    expect(newParentCalls).toBe(1);
    parent.removeChild(child);
    expect(newParentCalls).toBe(2);
    expect(removedCalls).toBe(1);
  });
});
