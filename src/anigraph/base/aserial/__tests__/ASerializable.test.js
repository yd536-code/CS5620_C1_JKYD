import { ASerializableToJSON, ASerializableFromJSON } from "../ASerializable";
import { AObjectNode } from "../../aobject";
import { Vec2, Color } from "../../../math";

describe("ASerializableToJSON / ASerializableFromJSON round trip", () => {
  test("a decorated value type round-trips with its own class, not a plain object", () => {
    const v = new Vec2(3, 4);
    const revived = ASerializableFromJSON(ASerializableToJSON(v));
    expect(revived).toBeInstanceOf(Vec2);
    expect(revived.x).toBe(3);
    expect(revived.y).toBe(4);
  });

  test("a nested decorated field (Color inside a plain object) revives correctly", () => {
    const payload = { color: Color.FromRGBA(0.1, 0.2, 0.3, 1) };
    const revived = ASerializableFromJSON(ASerializableToJSON(payload));
    expect(revived.color).toBeInstanceOf(Color);
    expect(revived.color.r).toBeCloseTo(0.1);
  });
});

describe("AObjectNode.fromJSON recursive graph repair", () => {
  function buildTree() {
    const root = new AObjectNode("root");
    const mid = new AObjectNode("mid");
    const leaf = new AObjectNode("leaf");
    root.addChild(mid);
    mid.addChild(leaf);
    return { root, mid, leaf };
  }

  test("_parent is correct at every depth after a round trip, not just the first level", () => {
    const { root } = buildTree();
    const revivedRoot = ASerializableFromJSON(ASerializableToJSON(root));
    const revivedMid = revivedRoot.children[0];
    const revivedLeaf = revivedMid.children[0];

    expect(revivedMid.parent).toBe(revivedRoot);
    expect(revivedLeaf.parent).toBe(revivedMid);
  });

  test("_root points at the true top-level revived node at every depth, not each node's own stale self-reference", () => {
    const { root } = buildTree();
    const revivedRoot = ASerializableFromJSON(ASerializableToJSON(root));
    const revivedMid = revivedRoot.children[0];
    const revivedLeaf = revivedMid.children[0];

    expect(revivedRoot.root).toBe(revivedRoot);
    expect(revivedMid.root).toBe(revivedRoot);
    expect(revivedLeaf.root).toBe(revivedRoot);
  });

  test("revived children are ref()'d, matching normal addChild construction -- getAncestorList/mapOverAncestors work post-revival", () => {
    const { root } = buildTree();
    const revivedRoot = ASerializableFromJSON(ASerializableToJSON(root));
    const revivedMid = revivedRoot.children[0];
    const revivedLeaf = revivedMid.children[0];

    const ancestors = revivedLeaf.getAncestorList();
    expect(ancestors).toEqual([revivedMid, revivedRoot]);
  });

  test("a node with more than one child revives every child's _parent/_root correctly", () => {
    const root = new AObjectNode("root");
    const a = new AObjectNode("a");
    const b = new AObjectNode("b");
    root.addChild(a);
    root.addChild(b);

    const revivedRoot = ASerializableFromJSON(ASerializableToJSON(root));
    expect(revivedRoot.children.length).toBe(2);
    for (const child of revivedRoot.children) {
      expect(child.parent).toBe(revivedRoot);
      expect(child.root).toBe(revivedRoot);
    }
  });
});
