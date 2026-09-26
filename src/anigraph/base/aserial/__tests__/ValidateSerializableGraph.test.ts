import {
  ASerializable,
  AUnregisterSerializable,
  ValidateSerializableGraph,
} from "../ASerializable";

/**
 * `ValidateSerializableGraph`'s three checks, each proven with a fixture
 * that would actually go wrong if this diagnostic didn't exist -- and a
 * clean-graph case proving it doesn't cry wolf on ordinary, correct data.
 */
describe("ValidateSerializableGraph", () => {
  test("a clean graph of decorated instances reports no issues", () => {
    @ASerializable("VSGCleanFixture")
    class VSGCleanFixture {
      label = "";
    }
    const a = new VSGCleanFixture();
    a.label = "a";
    const graph = { items: [a, { nested: a }] };

    expect(ValidateSerializableGraph(graph)).toEqual([]);
    AUnregisterSerializable("VSGCleanFixture");
  });

  test("flags a decorated class that violates the construction contract", () => {
    @ASerializable("VSGBadContractFixture")
    class VSGBadContractFixture {
      constructor(public required: string) {}
    }
    const instance = new VSGBadContractFixture("x");

    const issues = ValidateSerializableGraph({ instance });
    expect(issues).toHaveLength(1);
    expect(issues[0].classId).toBe("VSGBadContractFixture");
    expect(issues[0].message).toMatch(/required constructor argument/);

    AUnregisterSerializable("VSGBadContractFixture");
  });

  test("flags a nested class instance with no own @ASerializable decoration", () => {
    class VSGUndecoratedFixture {
      value = 1;
    }
    const graph = { child: new VSGUndecoratedFixture() };

    const issues = ValidateSerializableGraph(graph);
    expect(issues).toHaveLength(1);
    expect(issues[0].path).toBe("root.child");
    expect(issues[0].classId).toBe("VSGUndecoratedFixture");
    expect(issues[0].message).toMatch(/no own @ASerializable decoration/);
  });

  test("does not flag an undecorated subclass's own instance data walked as a plain object", () => {
    // A plain object literal should never be flagged -- only something
    // that looks like a real class instance (a non-Object.prototype
    // prototype chain).
    const graph = { plain: { x: 1, y: 2 } };
    expect(ValidateSerializableGraph(graph)).toEqual([]);
  });

  test("flags a reference cycle running purely through plain (undecorated) objects", () => {
    const a: any = { name: "a" };
    const b: any = { name: "b", other: a };
    a.other = b;

    const issues = ValidateSerializableGraph({ root: a });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => /cycle/.test(i.message))).toBe(true);
  });

  test("does not flag a cycle that runs through a decorated instance -- GetIndexedCopy handles that, so it's not a save-time error", () => {
    @ASerializable("VSGCyclicFixture")
    class VSGCyclicFixture {
      other: VSGCyclicFixture | null = null;
    }
    const a = new VSGCyclicFixture();
    const b = new VSGCyclicFixture();
    a.other = b;
    b.other = a;

    expect(ValidateSerializableGraph(a)).toEqual([]);
    AUnregisterSerializable("VSGCyclicFixture");
  });

  test("does not flag a shared (non-cyclic) reference to the same decorated instance twice", () => {
    @ASerializable("VSGSharedFixture")
    class VSGSharedFixture {
      label = "shared";
    }
    const shared = new VSGSharedFixture();
    const graph = { a: shared, b: shared };

    expect(ValidateSerializableGraph(graph)).toEqual([]);
    AUnregisterSerializable("VSGSharedFixture");
  });
});
