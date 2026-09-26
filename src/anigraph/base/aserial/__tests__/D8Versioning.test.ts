import { ASerializable, ASerializableField, GetIndexedCopy, ASerializableFromJSON, ASerializableToJSON } from "../ASerializable";
import { AObject } from "../../aobject";

/**
 * A minimal schema
 * version + migrate hook. `AObjectVersion` defaults to `1` (inherited from
 * `AObject`); a class bumps it as an *own* static field when it restructures
 * its own serialized shape, and provides `static migrate(oldVersion, data)`
 * to translate old data forward.
 */
describe("schema versioning", () => {
    test("GetIndexedCopy writes _aserial_version using the class's current AObjectVersion", () => {
        @ASerializable("D8PlainVersionedNode")
        class D8PlainVersionedNode extends AObject {
            @ASerializableField label: string = "x";
        }
        const n = new D8PlainVersionedNode();
        const indexed = GetIndexedCopy(n);
        expect(indexed._aserial_version).toBe(1); // inherited default
    });

    test("a class with no AObjectVersion at all (never opted in) omits _aserial_version rather than fabricating one", () => {
        // Vec2/Color-style value classes -- not AObject-derived -- never set
        // AObjectVersion, so GetIndexedCopy should not invent a number for
        // them. Use a bare decorated class with no AObject ancestry.
        @ASerializable("D8UnversionedNode")
        class D8UnversionedNode {
            label: string = "x";
        }
        const n = new D8UnversionedNode();
        const indexed = GetIndexedCopy(n);
        expect(indexed._aserial_version).toBeUndefined();
    });

    test("a saved file with no _aserial_version at all still loads (treated as version 0, not rejected)", () => {
        @ASerializable("D8NoVersionField")
        class D8NoVersionField extends AObject {
            @ASerializableField label: string = "default";
        }
        // Simulate an unversioned save file: no _aserial_version key at all.
        const legacyJson = JSON.stringify({
            _aserial_class_id: "D8NoVersionField",
            _aserial_id: "#0",
            data: { label: "from legacy file" },
        });
        const revived = ASerializableFromJSON(legacyJson) as D8NoVersionField;
        expect(revived.label).toBe("from legacy file");
    });

    test("migrate() is called when the saved version is older than the class's current version, and its result is what gets constructed", () => {
        @ASerializable("D8MigratedNode")
        class D8MigratedNode extends AObject {
            static AObjectVersion = 2;
            @ASerializableField newName: string = "";

            static migrate(oldVersion: number, data: any): any {
                if (oldVersion < 2 && "oldName" in data) {
                    data.newName = data.oldName;
                    delete data.oldName;
                }
                return data;
            }
        }

        const legacyJson = JSON.stringify({
            _aserial_class_id: "D8MigratedNode",
            _aserial_id: "#0",
            _aserial_version: 1,
            data: { oldName: "renamed value" },
        });

        const revived = ASerializableFromJSON(legacyJson) as D8MigratedNode;
        expect(revived.newName).toBe("renamed value");
    });

    test("migrate() is NOT called when the saved version already matches the class's current version", () => {
        let migrateCalls = 0;

        @ASerializable("D8UpToDateNode")
        class D8UpToDateNode extends AObject {
            static AObjectVersion = 3;
            @ASerializableField value: number = 0;

            static migrate(oldVersion: number, data: any): any {
                migrateCalls++;
                return data;
            }
        }

        const n = new D8UpToDateNode();
        n.value = 42;
        const revived = ASerializableFromJSON(ASerializableToJSON(n)) as D8UpToDateNode;

        expect(revived.value).toBe(42);
        expect(migrateCalls).toBe(0);
    });

    test("a subclass bumping AObjectVersion does not affect its own ancestor's or siblings' version (own-property shadowing, not a shared mutation)", () => {
        @ASerializable("D8VersionBaseNode")
        class D8VersionBaseNode extends AObject {}

        @ASerializable("D8VersionBumpedChild")
        class D8VersionBumpedChild extends D8VersionBaseNode {
            static AObjectVersion = 5;
        }

        @ASerializable("D8VersionPlainChild")
        class D8VersionPlainChild extends D8VersionBaseNode {}

        expect(D8VersionBaseNode.AObjectVersion).toBe(1);
        expect(D8VersionBumpedChild.AObjectVersion).toBe(5);
        expect(D8VersionPlainChild.AObjectVersion).toBe(1);
    });
});
