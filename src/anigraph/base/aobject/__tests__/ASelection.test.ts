/**
 * Tests for when {@link ASelection} calls its enter, update and exit callbacks.
 */
// Load a higher-level module first; the engine has a circular import that only resolves in this order.
import {AMeshModel2D, ASelection} from "../../../index";

new AMeshModel2D();

type Item = {uid: string};

function makeSelection() {
  const counts = {enter: 0, update: 0, exit: 0};
  const sel = new ASelection<Item>(
    undefined,
    () => { counts.enter++; },
    () => { counts.update++; },
    () => { counts.exit++; }
  );
  return {sel, counts};
}

describe("ASelection callbacks", () => {
  const a = {uid: "a"};
  const b = {uid: "b"};

  test("set(items, false) changes the selection without calling callbacks", () => {
    const {sel, counts} = makeSelection();
    sel.set([a], false);
    sel.set([a, b], false);
    sel.set([b], false);
    sel.set([], false);
    expect(counts).toEqual({enter: 0, update: 0, exit: 0});
    sel.set([a, b], false);
    expect(sel.keys().sort()).toEqual(["a", "b"]);
  });

  test("set(items) calls enter, exit and update callbacks", () => {
    const {sel, counts} = makeSelection();
    sel.set([a]);
    expect(counts).toEqual({enter: 1, update: 0, exit: 0});
    sel.set([b]);
    expect(counts).toEqual({enter: 2, update: 0, exit: 1});
    sel.set([b]);
    expect(counts).toEqual({enter: 2, update: 1, exit: 1});
  });

  test("select() on an already-selected item doesn't call the enter callback", () => {
    const {sel, counts} = makeSelection();
    sel.select(a);
    sel.select(a);
    expect(counts.enter).toBe(1);
    expect(sel.nSelected).toBe(1);
  });

  test("deselect() on an item that isn't selected doesn't call the exit callback", () => {
    const {sel, counts} = makeSelection();
    sel.deselect(a);
    expect(counts.exit).toBe(0);
    sel.select(a);
    sel.deselect(a);
    sel.deselect(a);
    expect(counts.exit).toBe(1);
    expect(sel.nSelected).toBe(0);
  });
});
