import { AObjectNode, AObjectNodeEvents } from '../../../';

describe('AObjectNode addChild / parent', () => {
  test('addChild sets child.parent to the parent node', () => {
    const parent = new AObjectNode('parent');
    const child = new AObjectNode('child');
    parent.addChild(child);
    expect(child.parent).toBe(parent);
  });

  test('addChild adds node to children array', () => {
    const parent = new AObjectNode('parent');
    const child = new AObjectNode('child');
    parent.addChild(child);
    expect(parent.children.length).toBe(1);
    expect(parent.children[0].uid).toBe(child.uid);
  });

  test('root of a detached node is itself', () => {
    const node = new AObjectNode('lone');
    expect(node.root.uid).toBe(node.uid);
  });

  test('adding a child with an existing parent throws', () => {
    const p1 = new AObjectNode('p1');
    const p2 = new AObjectNode('p2');
    const child = new AObjectNode('child');
    p1.addChild(child);
    expect(() => p2.addChild(child)).toThrow();
  });
});

describe('AObjectNode tree traversal', () => {
  test('mapOverChildren visits all direct children', () => {
    const parent = new AObjectNode('parent');
    const c1 = new AObjectNode('c1');
    const c2 = new AObjectNode('c2');
    const c3 = new AObjectNode('c3');
    parent.addChild(c1);
    parent.addChild(c2);
    parent.addChild(c3);
    const visited = [];
    parent.mapOverChildren((c) => { visited.push(c.name); });
    expect(visited).toContain('c1');
    expect(visited).toContain('c2');
    expect(visited).toContain('c3');
    expect(visited.length).toBe(3);
  });

  test('mapOverDescendants visits all descendants recursively', () => {
    const root = new AObjectNode('root');
    const child = new AObjectNode('child');
    const grandchild = new AObjectNode('grandchild');
    root.addChild(child);
    child.addChild(grandchild);
    const visited = [];
    root.mapOverDescendants((d) => { visited.push(d.name); });
    expect(visited).toContain('child');
    expect(visited).toContain('grandchild');
    expect(visited.length).toBe(2);
  });

  test('mapOverDescendants on leaf node visits nothing', () => {
    const visited = [];
    new AObjectNode('leaf').mapOverDescendants((d) => { visited.push(d); });
    expect(visited.length).toBe(0);
  });
});

describe('AObjectNode events', () => {
  test('NewChild event fires on parent when child is added', () => {
    const parent = new AObjectNode('parent');
    let receivedChild = null;
    parent.addEventListener(AObjectNodeEvents.NewChild, (child) => {
      receivedChild = child;
    });
    const child = new AObjectNode('child');
    parent.addChild(child);
    expect(receivedChild).not.toBeNull();
    expect(receivedChild.uid).toBe(child.uid);
  });

  test('DescendantAdded fires on grandparent for deeply nested add', () => {
    const root = new AObjectNode('root');
    const child = new AObjectNode('child');
    root.addChild(child);
    let grandchild = null;
    root.addEventListener(AObjectNodeEvents.DescendantAdded, (desc) => {
      grandchild = desc;
    });
    const gc = new AObjectNode('gc');
    child.addChild(gc);
    expect(grandchild).not.toBeNull();
    expect(grandchild.uid).toBe(gc.uid);
  });

  test('ChildRemoved event fires when child is detached', () => {
    const parent = new AObjectNode('parent');
    const child = new AObjectNode('child');
    parent.addChild(child);
    let removed = null;
    parent.addEventListener(AObjectNodeEvents.ChildRemoved, (c) => { removed = c; });
    parent.removeChild(child);
    expect(removed).not.toBeNull();
    expect(removed.uid).toBe(child.uid);
  });
});

describe('AObjectNode release', () => {
  // Regression test: `release()` used to call `mapOverAncestors` (to fire
  // `DescendantReleased`) AFTER `_removeChild` had already set
  // `this._parent = null` -- so the walk always found zero ancestors and
  // `DescendantReleased` never reached anything, for any release, ever.
  // This silently broke `AModelGraph`'s uid-keyed `modelMap`/a scene view's
  // `viewMap` cleanup, which matters once something (e.g. loading a saved
  // scene) legitimately re-adds a node reusing a released node's exact `uid`.
  test('DescendantReleased fires on ancestors at every depth', () => {
    const root = new AObjectNode('root');
    const mid = new AObjectNode('mid');
    const leaf = new AObjectNode('leaf');
    root.addChild(mid);
    mid.addChild(leaf);

    let rootReleased = null;
    let midReleased = null;
    root.addEventListener(AObjectNodeEvents.DescendantReleased, (d) => { rootReleased = d; });
    mid.addEventListener(AObjectNodeEvents.DescendantReleased, (d) => { midReleased = d; });

    leaf.release();

    expect(rootReleased).not.toBeNull();
    expect(rootReleased.uid).toBe(leaf.uid);
    expect(midReleased).not.toBeNull();
    expect(midReleased.uid).toBe(leaf.uid);
  });

  test('DescendantRemoved fires before DescendantReleased (some listeners -- e.g. a scene view removing a node from its parent before disposing its view -- depend on this order)', () => {
    const root = new AObjectNode('root');
    const leaf = new AObjectNode('leaf');
    root.addChild(leaf);

    const order = [];
    root.addEventListener(AObjectNodeEvents.DescendantRemoved, () => order.push('Removed'));
    root.addEventListener(AObjectNodeEvents.DescendantReleased, () => order.push('Released'));

    leaf.release();

    expect(order).toEqual(['Removed', 'Released']);
  });

  test('a uid-keyed registry correctly re-registers after release + re-add with the same uid', () => {
    // Mirrors AModelGraph._addModel/_releaseModel: a fresh node reusing a
    // just-released node's uid (as scene Save/Load does) must not be
    // silently treated as "already registered".
    const root = new AObjectNode('root');
    const registry = {};
    root.addEventListener(AObjectNodeEvents.DescendantAdded, (d) => {
      if (!(d.uid in registry)) registry[d.uid] = d;
    });
    root.addEventListener(AObjectNodeEvents.DescendantReleased, (d) => {
      delete registry[d.uid];
    });

    const a = new AObjectNode('a');
    const uid = a.uid;
    root.addChild(a);
    a.release();
    expect(registry[uid]).toBeUndefined();

    const b = new AObjectNode('b');
    b.uid = uid;
    root.addChild(b);
    expect(registry[uid]).toBe(b);
  });
});

describe('AObjectNode space compatibility (nodeSpace)', () => {
  // A minimal, dimension-agnostic stand-in for `ANodeModel2D`/`ANodeModel3D`: only `nodeSpace` matters to
  // `_addChild`'s check, so these fakes exercise the generic mechanism in `AObjectNode` without pulling in the
  // real node-model classes (see `NodeSpaceCompatibility.test.ts`, in `scene/__tests__`, for the integration test
  // against those). `AObjectNode._addChild` is the single place every
  // `addChild` (graph-root or node-to-node, at any depth) funnels through, so tagging space here -- rather than on
  // `AModelGraph.addChild` -- catches mixing at any depth, not just at the graph root.
  class FakeSpaceNode extends AObjectNode {
    constructor(name, space) {
      super(name);
      this._space = space;
    }
    get nodeSpace() { return this._space; }
  }

  test('a space-tagged node can be added as a child of a same-space parent', () => {
    const parent = new FakeSpaceNode('parent', '2D');
    const child = new FakeSpaceNode('child', '2D');
    expect(() => parent.addChild(child)).not.toThrow();
    expect(child.parent).toBe(parent);
  });

  test('adding a differently-spaced child throws, and the child is left unattached', () => {
    const parent = new FakeSpaceNode('parent', '2D');
    const child = new FakeSpaceNode('child', '3D');
    expect(() => parent.addChild(child)).toThrow();
    expect(child.parent).toBeNull();
    expect(parent.children.length).toBe(0);
  });

  test('the check is symmetric: a 2D child under a 3D parent also throws', () => {
    const parent = new FakeSpaceNode('parent', '3D');
    const child = new FakeSpaceNode('child', '2D');
    expect(() => parent.addChild(child)).toThrow();
  });

  test('a space-untagged node (e.g. a plain AObjectNode, or AModelGraph, which sets no nodeSpace) accepts a space-tagged child', () => {
    const root = new AObjectNode('root');
    const child2D = new FakeSpaceNode('child2D', '2D');
    expect(() => root.addChild(child2D)).not.toThrow();
  });

  test('a space-tagged parent accepts a space-untagged child', () => {
    const parent = new FakeSpaceNode('parent', '3D');
    const plainChild = new AObjectNode('plainChild');
    expect(() => parent.addChild(plainChild)).not.toThrow();
  });

  test('mismatched nodes two levels deep are also rejected (the gap a graph-root-only check would miss)', () => {
    const root = new FakeSpaceNode('root', '2D');
    const mid = new FakeSpaceNode('mid', '2D');
    root.addChild(mid);
    const wrongSpaceLeaf = new FakeSpaceNode('leaf', '3D');
    expect(() => mid.addChild(wrongSpaceLeaf)).toThrow();
  });

  test('reparent() (remove + add under the hood) also rejects a space mismatch on the new parent', () => {
    const parent2D = new FakeSpaceNode('parent2D', '2D');
    const parent3D = new FakeSpaceNode('parent3D', '3D');
    const child = new FakeSpaceNode('child', '2D');
    parent2D.addChild(child);
    expect(() => child.reparent(parent3D)).toThrow();
  });
});

describe('AObjectNode removeChild', () => {
  test('removed child is no longer in children', () => {
    const parent = new AObjectNode('parent');
    const child = new AObjectNode('child');
    parent.addChild(child);
    parent.removeChild(child);
    expect(parent.children.length).toBe(0);
  });

  test('removed child.parent becomes null', () => {
    const parent = new AObjectNode('parent');
    const child = new AObjectNode('child');
    parent.addChild(child);
    parent.removeChild(child);
    expect(child.parent).toBeNull();
  });
});
