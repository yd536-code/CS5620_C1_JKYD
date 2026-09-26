import {AControlSpecGroup} from "../AControlSpecGroup";
import {Color} from "../../math/Color";

describe("AControlSpecGroup: registration", () => {
    test("addSliderControl registers a leaf with the given value/range and composes onChange", () => {
        const group = new AControlSpecGroup("Root");
        const seen: number[] = [];
        group.addSliderControl("Speed", 2, (v) => seen.push(v), 0, 10, 1);

        const spec = group.getRawSpec()["Speed"];
        expect(spec.value).toBe(2);
        expect(spec.min).toBe(0);
        expect(spec.max).toBe(10);
        expect(spec.step).toBe(1);

        spec.onChange(5);
        expect(seen).toEqual([5]);
    });

    test("addSliderControl falls back to min(initialValue,0)/max(initialValue,1) exactly like CreateControlPanelSliderSpec", () => {
        const group = new AControlSpecGroup("Root");
        group.addSliderControl("t", 0.5, () => {});
        const spec = group.getRawSpec()["t"];
        expect(spec.min).toBe(0);
        expect(spec.max).toBe(1);
    });

    test("addCheckboxControl registers a leaf and composes onChange", () => {
        const group = new AControlSpecGroup("Root");
        let last: boolean | undefined;
        group.addCheckboxControl("Enabled", true, (v) => (last = v));
        const spec = group.getRawSpec()["Enabled"];
        expect(spec.value).toBe(true);
        spec.onChange(false);
        expect(last).toBe(false);
    });

    test("addColorControl converts the raw leva value to a Color before calling onChange", () => {
        const group = new AControlSpecGroup("Root");
        let last: Color | undefined;
        const initial = Color.FromRGBA(0.1, 0.2, 0.3, 1);
        group.addColorControl("Tint", initial, (v) => (last = v));
        const spec = group.getRawSpec()["Tint"];
        expect(spec.value).toEqual(initial.RGBuintAfloat);
        spec.onChange(initial.RGBuintAfloat);
        expect(last).toBeInstanceOf(Color);
        expect(last!.r).toBeCloseTo(0.1);
    });

    test("addButton registers a leaf with no value/onChange bookkeeping", () => {
        const group = new AControlSpecGroup("Root");
        group.addButton("Go", () => {});
        expect(group.has("Go")).toBe(true);
        // addSliderIfMissing checks has(), not any tracked value -- "Go" already being
        // a registered entry (as a button) is enough on its own to make this a no-op,
        // regardless of what kind of control it is.
        group.addSliderIfMissing("Go", () => {}, 1, 0, 5);
        expect(group.getRawSpec()["Go"].value).toBeUndefined();
    });

    test("addSelectionControl registers a leaf with options and composes onChange", () => {
        const group = new AControlSpecGroup("Root");
        let last: string | undefined;
        group.addSelectionControl("Mode", "A", ["A", "B"], (v) => (last = v));
        const spec = group.getRawSpec()["Mode"];
        expect(spec.value).toBe("A");
        expect(spec.options).toEqual(["A", "B"]);
        spec.onChange("B");
        expect(last).toBe("B");
    });
});

describe("AControlSpecGroup: addSliderIfMissing spec-presence semantics", () => {
    test("registers a slider that isn't already a registered entry", () => {
        const group = new AControlSpecGroup("Root");
        group.addSliderIfMissing("t", () => {}, 1, 0, 5);
        expect(group.has("t")).toBe(true);
        expect(group.getRawSpec()["t"].value).toBe(1);
    });

    test("is a no-op once the name is already a registered entry, whether or not it's ever been edited", () => {
        const group = new AControlSpecGroup("Root");
        group.addSliderIfMissing("t", () => {}, 1, 0, 5);

        // No edit happened -- under the old value-presence check this would have
        // re-registered (and overwritten the spec with initialValue 9); under the
        // current has()-based check, already being a registered entry is enough
        // on its own to make this a no-op.
        group.addSliderIfMissing("t", () => {}, 9, 0, 5);
        expect(group.getRawSpec()["t"].value).toBe(1);
    });

    test("checks has(), not any external getValue accessor -- registers even when an external store already reports a value for the name", () => {
        const external: {[k: string]: any} = {t: 7};
        const group = new AControlSpecGroup("Root", {getValue: (n) => external[n]});
        group.addSliderIfMissing("t", () => {}, 1, 0, 5);
        // "t" has never been registered as an entry, so this registers it --
        // unaffected by the external accessor already reporting a value for "t".
        // (getValue is still consulted elsewhere -- see mergeControlSpecGroup's
        // value-tracking-mismatch check -- just no longer by addSliderIfMissing.)
        expect(group.has("t")).toBe(true);
    });

    test("is unaffected by mergeControlSpecGroup's source-vs-destination value-store split (the case that motivated switching away from value-presence)", () => {
        const target = new AControlSpecGroup("Root");
        const source = new AControlSpecGroup("Extras");
        source.addSliderControl("t", 1, () => {}, 0, 5);
        target.mergeControlSpecGroup(source);

        // "t" genuinely exists in target now (has() says so); addSliderIfMissing
        // must agree and treat it as already present, even though editing it
        // would still write into source's own value store, not target's.
        expect(target.has("t")).toBe(true);
        target.addSliderIfMissing("t", () => {}, 99, 0, 5);
        expect(target.getRawSpec()["t"].value).toBe(1); // untouched -- correctly treated as already present.
    });
});

describe("AControlSpecGroup: onChange composition", () => {
    test("the group's own bookkeeping runs even when otherSpecs tries to smuggle in its own onChange", () => {
        const group = new AControlSpecGroup("Root");
        const seen: number[] = [];
        const sneaky = jest.fn();
        group.addSliderControl("t", 1, (v) => seen.push(v), 0, 5, 1, {onChange: sneaky, label: "T"});

        const spec = group.getRawSpec()["t"];
        expect(spec.label).toBe("T"); // otherSpecs fields other than onChange still merge in.
        spec.onChange(4);
        expect(seen).toEqual([4]); // the real onChange ran...
        expect(sneaky).not.toHaveBeenCalled(); // ...not the one otherSpecs tried to substitute.
    });

    test("routes through an external setValue accessor when one is supplied", () => {
        const external: {[k: string]: any} = {};
        const group = new AControlSpecGroup("Root", {setValue: (n, v) => (external[n] = v)});
        group.addSliderControl("t", 1, () => {}, 0, 5, 1);
        group.getRawSpec()["t"].onChange(3);
        expect(external["t"]).toBe(3);
    });
});

describe("AControlSpecGroup: nesting", () => {
    test("addControlSpecGroup wraps a plain pre-built spec dict (today's addControlSpecGroup shape)", () => {
        const group = new AControlSpecGroup("Root");
        const preBuilt = {Ambient: {value: 0.5, onChange: () => {}}};
        const sub = group.addControlSpecGroup("Basic", preBuilt, false, true);
        expect(sub).toBeInstanceOf(AControlSpecGroup);
        expect(sub.getRawSpec()["Ambient"]).toBe(preBuilt.Ambient);
    });

    test("addControlSpecGroup accepts an already-built AControlSpecGroup and nests it as-is", () => {
        const root = new AControlSpecGroup("Root");
        const child = new AControlSpecGroup("Selected Object", {addNameToKeys: false});
        child.addSliderControl("Selected Ray Count", 12, () => {}, 1, 64, 1);
        const returned = root.addControlSpecGroup("Selected Object", child, false, false);
        expect(returned).toBe(child);
        expect(root.getRawSpec()["Selected Object"]).toEqual(child.getFolderSpec());
    });

    test("has/remove operate on this group's own direct entries, leaf or group", () => {
        const root = new AControlSpecGroup("Root");
        root.addControlSpecGroup("Sub", {});
        expect(root.has("Sub")).toBe(true);
        root.remove("Sub");
        expect(root.has("Sub")).toBe(false);
    });
});

describe("AControlSpecGroup: mergeControlSpecGroup", () => {
    test("merges the source's own entries directly into this group's top level, with no new named folder", () => {
        const target = new AControlSpecGroup("Root", {addNameToKeys: false});
        target.addSliderControl("A", 1, () => {}, 0, 5);

        const source = new AControlSpecGroup("Extras", {addNameToKeys: false});
        source.addSliderControl("B", 2, () => {}, 0, 5);

        target.mergeControlSpecGroup(source);

        expect(target.has("A")).toBe(true);
        expect(target.has("B")).toBe(true);
        expect(target.has("Extras")).toBe(false); // source's own name never appears as an entry
        expect(target.findControlPath("B")).toBe("B"); // top-level, not "Extras.B"
    });

    test("a nested subgroup inside the source is preserved as a nested subgroup after merging, not flattened further", () => {
        const target = new AControlSpecGroup("Root", {addNameToKeys: false});
        const source = new AControlSpecGroup("Extras", {addNameToKeys: false});
        const sourceChild = new AControlSpecGroup("Child", {addNameToKeys: false});
        sourceChild.addSliderControl("Deep", 1, () => {}, 0, 5);
        source.addControlSpecGroup("Child", sourceChild, false, false);

        target.mergeControlSpecGroup(source);

        expect(target.findControlPath("Deep")).toBe("Child.Deep");
    });

    test("throws, listing the colliding name(s), when the source has an entry name this group already has", () => {
        const target = new AControlSpecGroup("Root");
        target.addSliderControl("A", 1, () => {}, 0, 5);
        const source = new AControlSpecGroup("Extras");
        source.addSliderControl("A", 2, () => {}, 0, 5);

        expect(() => target.mergeControlSpecGroup(source)).toThrow(/"A"/);
        // Neither side was mutated by the failed attempt.
        expect(target.getRawSpec()["A"].value).toBe(1);
    });

    test("throws when both groups have their own external value tracking and it isn't the same", () => {
        const target = new AControlSpecGroup("Root", {getValue: () => undefined, setValue: () => {}});
        const source = new AControlSpecGroup("Extras", {getValue: () => undefined, setValue: () => {}});
        expect(() => target.mergeControlSpecGroup(source)).toThrow();
    });

    test("does not throw when both groups share the exact same external value tracking", () => {
        const getValue = () => undefined;
        const setValue = () => {};
        const target = new AControlSpecGroup("Root", {getValue, setValue});
        const source = new AControlSpecGroup("Extras", {getValue, setValue});
        source.addSliderControl("B", 1, () => {}, 0, 5);
        expect(() => target.mergeControlSpecGroup(source)).not.toThrow();
        expect(target.has("B")).toBe(true);
    });

    test("does not throw when only one group has external value tracking configured", () => {
        const target = new AControlSpecGroup("Root");
        const source = new AControlSpecGroup("Extras", {getValue: () => undefined, setValue: () => {}});
        source.addSliderControl("B", 1, () => {}, 0, 5);
        expect(() => target.mergeControlSpecGroup(source)).not.toThrow();
        expect(target.has("B")).toBe(true);
    });

    test("does not throw when neither group has external value tracking configured", () => {
        const target = new AControlSpecGroup("Root");
        const source = new AControlSpecGroup("Extras");
        source.addSliderControl("B", 1, () => {}, 0, 5);
        expect(() => target.mergeControlSpecGroup(source)).not.toThrow();
        expect(target.has("B")).toBe(true);
    });

    test("triggers this group's onUpdate", () => {
        const onUpdate = jest.fn();
        const target = new AControlSpecGroup("Root", {onUpdate});
        const source = new AControlSpecGroup("Extras");
        source.addSliderControl("B", 1, () => {}, 0, 5);
        target.mergeControlSpecGroup(source);
        expect(onUpdate).toHaveBeenCalled();
    });
});

describe("AControlSpecGroup: getRawSpec/getFolderSpec shapes", () => {
    test("getFolderSpec wraps the raw spec in a leva folder() under this group's own name", () => {
        const group = new AControlSpecGroup("Basic", {collapsed: false});
        group.addSliderControl("Ambient", 0.2, () => {}, 0, 1);
        const folderSpec: any = group.getFolderSpec();
        expect(folderSpec.type).toBeDefined(); // leva's folder() marker object
        expect(folderSpec.schema).toBeDefined();
    });

    test("addNameToKeys=true suffixes each direct child's key inside this group's own schema", () => {
        const group = new AControlSpecGroup("Basic", {addNameToKeys: true});
        group.addSliderControl("Ambient", 0.2, () => {}, 0, 1);
        const folderSpec: any = group.getFolderSpec();
        expect("Ambient_Basic" in folderSpec.schema).toBe(true);
        expect("Ambient" in folderSpec.schema).toBe(false);
    });

    test("addNameToKeys=false leaves each direct child's key unsuffixed", () => {
        const group = new AControlSpecGroup("Selected Object", {addNameToKeys: false});
        group.addSliderControl("Selected Ray Count", 12, () => {}, 1, 64, 1);
        const folderSpec: any = group.getFolderSpec();
        expect("Selected Ray Count" in folderSpec.schema).toBe(true);
    });

    test("getFolderSpec carries this group's own render option through to leva's folder settings", () => {
        const render = (get: (path: string) => any) => get("Tool") === "Add Emitter";
        const group = new AControlSpecGroup("New Emitter", {render});
        const folderSpec: any = group.getFolderSpec();
        expect(folderSpec.settings.render).toBe(render);

        // It's a real, callable leva RenderFn: (get) => boolean.
        expect(folderSpec.settings.render((path: string) => (path === "Tool" ? "Add Emitter" : undefined))).toBe(true);
        expect(folderSpec.settings.render((path: string) => (path === "Tool" ? "Select / Move" : undefined))).toBe(false);
    });

    test("addControlSpecGroup's render argument becomes the newly created subgroup's own render option", () => {
        const render = (get: (path: string) => any) => get("Tool") === "Add Lens";
        const root = new AControlSpecGroup("Root");
        const sub = root.addControlSpecGroup("New Lens", {}, false, true, render);
        expect((sub.getFolderSpec() as any).settings.render).toBe(render);
    });

    test("addControlSpecGroup's render argument is ignored when nesting an already-built group, same as addNameToKeys/collapsed", () => {
        const ownRender = () => true;
        const child = new AControlSpecGroup("Selected Object", {render: ownRender});
        const root = new AControlSpecGroup("Root");
        const ignoredRender = () => false;
        root.addControlSpecGroup("Selected Object", child, false, false, ignoredRender);
        expect((child.getFolderSpec() as any).settings.render).toBe(ownRender);
    });
});

describe("AControlSpecGroup: findControlPath", () => {
    test("a top-level (unnested) leaf resolves to its own name -- matches AAppState._resolveControlStorePath's un-nested case", () => {
        const root = new AControlSpecGroup("Root", {addNameToKeys: false});
        root.addSliderControl("Speed", 1, () => {}, 0, 5);
        expect(root.findControlPath("Speed")).toBe("Speed");
    });

    test("addNameToKeys=false: a nested leaf resolves to '<folder>.<name>' unsuffixed (e.g. a 'Selected Object' folder)", () => {
        const root = new AControlSpecGroup("Root", {addNameToKeys: false});
        const selected = new AControlSpecGroup("Selected Object", {addNameToKeys: false});
        selected.addSliderControl("Selected Ray Count", 12, () => {}, 1, 64, 1);
        root.addControlSpecGroup("Selected Object", selected, false, false);

        expect(root.findControlPath("Selected Ray Count")).toBe("Selected Object.Selected Ray Count");
    });

    test("addNameToKeys=true: a nested leaf's leva path uses the suffixed schema key, matching getFolderSpec()'s actual output", () => {
        const root = new AControlSpecGroup("Root", {addNameToKeys: false});
        const basic = new AControlSpecGroup("Basic", {addNameToKeys: true});
        basic.addSliderControl("Ambient", 0.2, () => {}, 0, 1);
        root.addControlSpecGroup("Basic", basic, true, true);

        const path = root.findControlPath("Ambient");
        expect(path).toBe("Basic.Ambient_Basic");

        // Cross-check against the actual schema getFolderSpec() produces, not just the formula.
        const folderSpec: any = root.getRawSpec()["Basic"];
        const [folderName, leafKey] = path!.split(".");
        expect(folderName).toBe("Basic");
        expect(leafKey in folderSpec.schema).toBe(true);
    });

    test("returns undefined for a name that isn't registered anywhere", () => {
        const root = new AControlSpecGroup("Root");
        expect(root.findControlPath("Nope")).toBeUndefined();
    });

    test("resolves arbitrarily deep nesting, not just one level", () => {
        const root = new AControlSpecGroup("Root", {addNameToKeys: false});
        const mid = new AControlSpecGroup("Mid", {addNameToKeys: false});
        const leaf = new AControlSpecGroup("Leaf", {addNameToKeys: false});
        leaf.addSliderControl("Deep", 1, () => {}, 0, 5);
        mid.addControlSpecGroup("Leaf", leaf, false, false);
        root.addControlSpecGroup("Mid", mid, false, false);

        expect(root.findControlPath("Deep")).toBe("Mid.Leaf.Deep");
    });
});
