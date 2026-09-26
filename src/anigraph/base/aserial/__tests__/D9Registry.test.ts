import { ASerializable, AUnregisterSerializable, GetASerializableClassByName } from "../ASerializable";

/**
 * Registry
 * collisions are loud, and re-registering the exact same class (as HMR
 * does on every edit-save cycle) doesn't accumulate a numbered alias.
 */
describe("registry hardening", () => {
    test("re-decorating the exact same class definition (HMR-style reload) keeps the same name, no suffix", () => {
        function defineOnce() {
            @ASerializable("D9SameClassReload")
            class D9SameClassReload {
                value = 1;
            }
            return D9SameClassReload;
        }
        const first = defineOnce();
        const second = defineOnce();

        expect((first as any).ASerializationClassID).toBe("D9SameClassReload");
        expect((second as any).ASerializationClassID).toBe("D9SameClassReload");
        // The registry should now point at the *second* (most recent) definition.
        expect(GetASerializableClassByName("D9SameClassReload")).toBe(second);
    });

    test("two genuinely different classes claiming the same name still both get registered, warning instead of silently colliding", () => {
        const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

        @ASerializable("D9GenuineCollision")
        class D9First {
            a = 1;
        }
        @ASerializable("D9GenuineCollision")
        class D9Second {
            b = 2;
        }

        expect((D9First as any).ASerializationClassID).toBe("D9GenuineCollision");
        expect((D9Second as any).ASerializationClassID).not.toBe("D9GenuineCollision");
        expect((D9Second as any).ASerializationClassID).toMatch(/^D9Second/);
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining("another, different class is already registered")
        );

        warnSpy.mockRestore();
    });

    test("AUnregisterSerializable removes a class's registration", () => {
        @ASerializable("D9ToUnregister")
        class D9ToUnregister {}

        expect(GetASerializableClassByName("D9ToUnregister")).toBe(D9ToUnregister);
        AUnregisterSerializable("D9ToUnregister");
        expect(GetASerializableClassByName("D9ToUnregister")).toBeUndefined();
    });
});
