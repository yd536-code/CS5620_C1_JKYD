/**
 * `@ALabel` / `GetClassLabel`: labeling a class is separate from registering it for
 * serialization. Views, controllers, interaction modes, graphics, etc. get a label but are not registered, so they
 * aren't held to `@ASerializable`'s zero-argument-constructor contract. A class with no label of its own falls back to
 * its own class name -- never to an ancestor's label.
 */
import "../../../";
import {ALabel, ASerializable, GETSERIALIZABLES, GetClassLabel, AUnregisterSerializable, ASerializableFromJSON, ASerializableToJSON} from "../ASerializable";
import {ASceneInteractionMode} from "../../../scene/interactionmodes/ASceneInteractionMode";
import {AInteractionModeMap} from "../../../interaction/AInteractionModeMap";
import {VertexArray2D} from "../../../geometry/VertexArray2D";
import {AModelViewClassMap, AMVClassSpec} from "../../amvc/AModelViewClassSpec";
import {ANodeModel3D} from "../../../scene/nodeModel/ANodeModel3D";

const fs = require("fs");
const path = require("path");

describe("GetClassLabel", () => {
    test("returns a class's own @ALabel", () => {
        @ALabel("FancyName")
        class LabeledThing {}
        expect(GetClassLabel(LabeledThing)).toBe("FancyName");
    });

    test("@ALabel() with no argument uses the class name", () => {
        @ALabel()
        class DefaultLabeledThing {}
        expect(GetClassLabel(DefaultLabeledThing)).toBe("DefaultLabeledThing");
    });

    test("an undecorated subclass gets its own class name, not its parent's label", () => {
        @ALabel("ParentLabel")
        class LabeledParent {}
        class UnlabeledChild extends LabeledParent {}
        expect(GetClassLabel(UnlabeledChild)).toBe("UnlabeledChild");
    });

    test("@ASerializable's label is read the same way", () => {
        @ASerializable("ALabelTest_SerializableThing")
        class SerializableThing {}
        expect(GetClassLabel(SerializableThing)).toBe("ALabelTest_SerializableThing");
        AUnregisterSerializable("ALabelTest_SerializableThing");
    });

    test("warnIfMissing logs once per class, only when falling back", () => {
        const info = jest.spyOn(console, "info").mockImplementation(() => {});
        class QuietlyUnlabeled {}
        @ALabel("HasOne")
        class Labeled {}
        GetClassLabel(QuietlyUnlabeled, true);
        GetClassLabel(QuietlyUnlabeled, true);
        GetClassLabel(Labeled, true);
        expect(info).toHaveBeenCalledTimes(1);
        expect(info.mock.calls[0][0]).toContain("QuietlyUnlabeled has no @ALabel");
        info.mockRestore();
    });
});

describe("@ALabel does not register for serialization", () => {
    test("a labeled class is not in the registry and triggers no constructor-contract warning", () => {
        const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
        @ALabel("ALabelTest_NeedsArgs")
        class NeedsArgs {
            constructor(public a: number, public b: number) {}
        }
        expect(GETSERIALIZABLES()["ALabelTest_NeedsArgs"]).toBeUndefined();
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
        expect(new NeedsArgs(1, 2).a).toBe(1);
    });
});

describe("interaction modes without their own @ALabel", () => {
    // This used to be the failure mode: both modes inherited "ASceneInteractionMode" as their name and the second
    // overwrote the first in the mode map.
    test("each gets its own class name, so two of them don't collide in the mode map", () => {
        const info = jest.spyOn(console, "info").mockImplementation(() => {});
        const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
        class StudentModeA extends ASceneInteractionMode {}
        class StudentModeB extends ASceneInteractionMode {}
        const a = new StudentModeA();
        const b = new StudentModeB();
        expect(a.name).toBe("StudentModeA");
        expect(b.name).toBe("StudentModeB");
        expect(StudentModeA.InteractionModeClassName()).toBe("StudentModeA");

        const map = new AInteractionModeMap(undefined as any);
        map.defineMode(a.name, a);
        map.defineMode(b.name, b);
        expect(map.modes["StudentModeA"]).toBe(a);
        expect(map.modes["StudentModeB"]).toBe(b);
        expect(warn).not.toHaveBeenCalledWith(expect.stringContaining("redefining interaction mode"));
        info.mockRestore();
        warn.mockRestore();
    });

    test("a labeled mode still uses its label", () => {
        @ALabel("My Labeled Mode")
        class LabeledMode extends ASceneInteractionMode {}
        expect(new LabeledMode().name).toBe("My Labeled Mode");
    });

    test("redefining a mode name reports both classes", () => {
        const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
        class FirstMode extends ASceneInteractionMode {}
        class SecondMode extends ASceneInteractionMode {}
        const map = new AInteractionModeMap(undefined as any);
        map.defineMode("Main", new FirstMode());
        map.defineMode("Main", new SecondMode());
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('"Main" (was FirstMode, now SecondMode)'));
        warn.mockRestore();
    });
});

describe("model-view spec lookup (AModelViewClassMap.getSpecForModel)", () => {
    // Labels used to be inherited, so an undecorated model subclass (e.g. CharacterModel3D) looked up its parent's
    // spec. getSpecForModel keeps that working with an explicit fallback to the nearest labeled ancestor.
    @ASerializable("ALabelTest_ParentModel")
    class ParentModel extends ANodeModel3D {}
    class UndecoratedChildModel extends ParentModel {}
    @ASerializable("ALabelTest_DecoratedChildModel")
    class DecoratedChildModel extends ParentModel {}
    class ParentView {}
    class ChildView {}

    afterAll(() => {
        AUnregisterSerializable("ALabelTest_ParentModel");
        AUnregisterSerializable("ALabelTest_DecoratedChildModel");
    });

    test("an undecorated subclass with no spec of its own falls back to its parent's spec", () => {
        const map = new AModelViewClassMap([new AMVClassSpec(ParentModel, ParentView as any)]);
        expect(map.getSpecForModel(UndecoratedChildModel)?.viewClass).toBe(ParentView);
    });

    test("an exact spec for the subclass wins over the parent's", () => {
        const map = new AModelViewClassMap([
            new AMVClassSpec(ParentModel, ParentView as any),
            new AMVClassSpec(UndecoratedChildModel, ChildView as any),
        ]);
        expect(map.getSpecForModel(UndecoratedChildModel)?.viewClass).toBe(ChildView);
        expect(map.getSpecForModel(ParentModel)?.viewClass).toBe(ParentView);
    });

    test("a decorated subclass with no spec of its own still gets none (unchanged behavior)", () => {
        const map = new AModelViewClassMap([new AMVClassSpec(ParentModel, ParentView as any)]);
        expect(map.getSpecForModel(DecoratedChildModel)).toBeUndefined();
    });

    test("lookup by label string is unchanged", () => {
        const map = new AModelViewClassMap([new AMVClassSpec(ParentModel, ParentView as any)]);
        expect(map.getSpecForModel("ALabelTest_ParentModel")?.viewClass).toBe(ParentView);
    });
});

describe("VertexArray2D", () => {
    test("has an explicit fromJSON (no false-positive contract warning) and still round-trips", () => {
        expect(typeof (VertexArray2D as any).fromJSON).toBe("function");
        const va = new VertexArray2D();
        const revived = ASerializableFromJSON(ASerializableToJSON(va));
        expect(revived).toBeInstanceOf(VertexArray2D);
    });
});

/**
 * Regression guard for the whole point of the ALabel change: importing every engine and scene module that uses
 * `@ASerializable`/`@ALabel` produces no zero-argument-constructor warnings. If this fails, either a runtime-only
 * class (view, controller, mode, graphic, ...) was decorated `@ASerializable` instead of `@ALabel`, or a class that
 * really is saved needs a zero-argument constructor or a static `fromJSON`.
 */
describe("no @ASerializable construction-contract warnings at import time", () => {
    const srcRoot = path.join(__dirname, "../../../..");
    const walk = (dir: string, out: string[]): string[] => {
        for (const f of fs.readdirSync(dir)) {
            const p = path.join(dir, f);
            if (fs.statSync(p).isDirectory()) {
                if (!/^(__tests__|node_modules|Tests)$/.test(f)) walk(p, out);
            } else if (/\.tsx?$/.test(f) && !/\.test\./.test(f) && /@(ASerializable|ALabel)\(/.test(fs.readFileSync(p, "utf8"))) {
                out.push(p);
            }
        }
        return out;
    };

    test("across src/anigraph and src/Scenes", () => {
        const files = [...walk(path.join(srcRoot, "anigraph"), []), ...walk(path.join(srcRoot, "Scenes"), [])];
        expect(files.length).toBeGreaterThan(100);
        const warnings: string[] = [];
        const warn = jest.spyOn(console, "warn").mockImplementation((...args: any[]) => {
            warnings.push(args.join(" "));
        });
        jest.isolateModules(() => {
            for (const f of files) {
                require(f);
            }
        });
        warn.mockRestore();
        expect(warnings.filter((w) => w.includes("required constructor argument"))).toEqual([]);
    });
});
