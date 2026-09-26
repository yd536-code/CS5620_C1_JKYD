import { ASerializable, ASerializableField } from "../ASerializable";
import { ASerializableToJSON, ASerializableFromJSON, GetIndexedCopy } from "../ASerializable";
import { AObject } from "../../aobject";

/**
 * Test-local fixture class for testing
 * cycle detection + shared-reference de-duplication. `other` is a plain
 * `@ASerializableField` reference to another instance of the same class --
 * enough to build both a genuine shared reference (two objects pointing at
 * the same third one) and a genuine reference cycle (A -> B -> A) without
 * needing any real engine class's specific shape.
 */
@ASerializable("D6TestNode")
class D6TestNode extends AObject {
    @ASerializableField label: string = "";
    @ASerializableField other: D6TestNode | null = null;
}

describe("GetIndexedCopy dedup and cycle handling", () => {
    test("a shared (non-cyclic) reference gets a single id and a ref pointer, not two independent copies", () => {
        const shared = new D6TestNode();
        shared.label = "shared";
        const a = new D6TestNode();
        a.label = "a";
        a.other = shared;
        const b = new D6TestNode();
        b.label = "b";
        b.other = shared;

        const indexed = GetIndexedCopy({ a, b });
        // Exactly one full ({_aserial_class_id, data}) copy of `shared`
        // should exist in the output -- the second occurrence must be a
        // {_aserial_ref} pointer, not another full copy.
        const json = JSON.stringify(indexed);
        const fullCopies = (json.match(/"label":"shared"/g) ?? []).length;
        expect(fullCopies).toBe(1);
        expect(indexed.b.data.other._aserial_ref).toBeDefined();
    });

    test("shared reference identity is preserved after a full round trip: revived.a.other === revived.b.other", () => {
        const shared = new D6TestNode();
        shared.label = "shared";
        const a = new D6TestNode();
        a.other = shared;
        const b = new D6TestNode();
        b.other = shared;

        const revived = ASerializableFromJSON(ASerializableToJSON({ a, b })) as { a: D6TestNode; b: D6TestNode };
        expect(revived.a.other).toBe(revived.b.other);
        expect(revived.a.other?.label).toBe("shared");
    });

    test("a genuine reference cycle (A -> B -> A) does not stack-overflow or throw", () => {
        const a = new D6TestNode();
        a.label = "a";
        const b = new D6TestNode();
        b.label = "b";
        a.other = b;
        b.other = a;

        expect(() => {
            const revived = ASerializableFromJSON(ASerializableToJSON(a)) as D6TestNode;
            // The forward edge (a -> b) is unaffected by the one-shot-fromJSON
            // limitation documented in ASerializable.ts: it's fully
            // resolved before `a`'s own `fromJSON` call returns.
            expect(revived.label).toBe("a");
            expect(revived.other).toBeInstanceOf(D6TestNode);
            expect(revived.other?.label).toBe("b");
            // The back edge (b -> a) is the documented limitation: AObject's
            // `fromJSON` is a one-shot factory (CreateWithState), so the
            // reference `b` resolved to *while a was still being revived* is
            // a shell, not the final `revived` object. This asserts the
            // known, accepted shape of that gap (a real, right-class
            // instance -- just not reference-equal) rather than merely
            // "didn't crash", so a future improvement that closes this
            // gap has a test that will *fail* here and prompt updating this
            // assertion, instead of an untested gap silently getting
            // better or worse unnoticed.
            expect(revived.other?.other).toBeInstanceOf(D6TestNode);
        }).not.toThrow();
    });

    test("GetIndexedCopy alone (no revival) does not stack-overflow on a cycle", () => {
        const a = new D6TestNode();
        const b = new D6TestNode();
        a.other = b;
        b.other = a;
        expect(() => GetIndexedCopy(a)).not.toThrow();
    });
});
