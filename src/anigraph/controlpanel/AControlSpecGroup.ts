import {GUISpecs, GUIControlSpec} from "./GUISpecs";
import {Color} from "../math/Color";

/**
 * One entry of an {@link AControlSpecGroup}: a single control, or a nested group.
 * @internal
 */
export type AControlSpecGroupEntry =
    | { kind: "leaf"; spec: GUIControlSpec }
    | { kind: "group"; group: AControlSpecGroup };

/**
 * Leva's conditional-render hook for a folder (`FolderSettings.render`). `get(path)` reads another control's
 * current value by its leva store path; return `false` to hide the folder. See {@link AControlSpecGroupOptions.render}.
 */
export type AControlSpecRenderFn = (get: (path: string) => any) => boolean;

/** Construction options for an {@link AControlSpecGroup}. All are optional. */
export interface AControlSpecGroupOptions {
    /** Whether this group's direct children get `_<this.name>` appended to their keys when the group is nested inside a parent (same as `addFolderNameToKeys` in `AAppState.addControlSpecGroup`). Default `true`. */
    addNameToKeys?: boolean;
    /** Whether this group's folder starts collapsed when nested inside a parent. Default `true`. */
    collapsed?: boolean;
    /** Called after any add/remove/nest/merge on this group. Only this group's own changes trigger it -- edits made directly on a nested child group do not reach the parent's callback. Wire it to a panel refresh when the group backs a live control panel. */
    onUpdate?: () => void;
    /** Optional external value store reader. It is not read by any method here; it only matters to {@link AControlSpecGroup.mergeControlSpecGroup}, which compares it (with `setValue`) to decide whether two groups share one store. */
    getValue?: (name: string) => any;
    /** Optional external value store, written by every control's `onChange` before the caller's own `onChange` runs. Omit to have the group keep values in its own private map. */
    setValue?: (name: string, value: any) => void;
    /**
     * Whether this group's folder is shown at all when nested inside a parent. Leva re-evaluates it whenever any
     * control in the panel changes; `get(path)` reads another control's current value by its leva store path (a
     * top-level control's path is just its name, e.g. `get("Tool")`). Ignored for a group that is never nested
     * (e.g. `AAppState`'s root group, whose top level is never wrapped in a folder).
     */
    render?: AControlSpecRenderFn;
}

/**
 * A named, nestable group of control-panel specs. `AAppState`'s `addXControl` methods are thin wrappers
 * around one root group of this type; you can also build a group yourself (e.g. a model's
 * `getInstanceControlSpecGroup()`) and nest it with `appState.addControlSpecGroup(name, group)`.
 *
 * Each `addXControl` method takes an explicit `onChange`, builds the leaf spec with the matching
 * {@link GUISpecs} helper, and wraps `onChange` so the group records the new value first (through the
 * `setValue` option, or its own private map). An `onChange` key inside `otherSpecs` cannot replace that
 * wrapped callback.
 */
export class AControlSpecGroup {
    /** The group's name; used as the folder heading (and key suffix) when the group is nested. */
    readonly name: string;

    private _addNameToKeys: boolean;
    private _collapsed: boolean;
    private _onUpdateCallback?: () => void;
    private _getValueAccessor?: (name: string) => any;
    private _setValueAccessor?: (name: string, value: any) => void;
    private _render?: AControlSpecRenderFn;

    /** This group's own value store, used only when no external `setValue` was supplied. */
    private _values: { [name: string]: any } = {};
    private _entries: { [name: string]: AControlSpecGroupEntry } = {};

    /**
     * @param name the group's name (folder heading when nested)
     * @param options see {@link AControlSpecGroupOptions}
     */
    constructor(name: string, options?: AControlSpecGroupOptions) {
        this.name = name;
        this._addNameToKeys = options?.addNameToKeys ?? true;
        this._collapsed = options?.collapsed ?? true;
        this._onUpdateCallback = options?.onUpdate;
        this._getValueAccessor = options?.getValue;
        this._setValueAccessor = options?.setValue;
        this._render = options?.render;
    }

    //###############################################//--Registration--\\###############################################
    //<editor-fold desc="Registration">

    /**
     * Adds (or replaces) a numeric slider leaf.
     * @param min defaults to `min(initialValue, 0)`
     * @param max defaults to `max(initialValue, 1)`
     * @param step defaults to 1% of the range (see {@link GUISpecs.SliderControl})
     * @param otherSpecs extra leva fields (e.g. `label`) merged into the spec
     */
    addSliderControl(name: string, initialValue: number, onChange: (v: number) => void,
                      min?: number, max?: number, step?: number,
                      otherSpecs?: { [k: string]: any }): void {
        const base = GUISpecs.SliderControl(
            this._wrapOnChange(name, onChange),
            initialValue,
            min ?? Math.min(initialValue, 0.0),
            max ?? Math.max(initialValue, 1.0),
            step
        );
        this._setLeaf(name, this._finalizeSpec(base, otherSpecs));
    }

    /** Adds (or replaces) a checkbox leaf. */
    addCheckboxControl(name: string, value: boolean, onChange: (v: boolean) => void,
                        otherSpecs?: { [k: string]: any }): void {
        const base = GUISpecs.CheckboxControl(this._wrapOnChange(name, onChange), value);
        this._setLeaf(name, this._finalizeSpec(base, otherSpecs));
    }

    /** Adds (or replaces) a color-picker leaf. `onChange` (and the stored value) receive an AniGraph {@link Color}. */
    addColorControl(name: string, initialValue: Color, onChange: (v: Color) => void,
                     otherSpecs?: { [k: string]: any }): void {
        const base = GUISpecs.ColorControl(this._wrapOnChange(name, onChange), initialValue);
        this._setLeaf(name, this._finalizeSpec(base, otherSpecs));
    }

    /** Adds (or replaces) a button that calls `callback` when clicked. Buttons store no value. */
    addButton(name: string, callback: () => void, otherSpecs?: { [k: string]: any }): void {
        // Buttons have no value -- nothing to route through _wrapOnChange/the value store.
        this._setLeaf(name, GUISpecs.ButtonControl(callback, otherSpecs));
    }

    /** Adds (or replaces) a dropdown leaf whose choices are `options`; `initialValue` should be one of them. */
    addSelectionControl(name: string, initialValue: any, options: any[],
                         onChange: (v: any) => void, otherSpecs?: { [k: string]: any }): void {
        const base = GUISpecs.SelectionControl(this._wrapOnChange(name, onChange), options, initialValue);
        this._setLeaf(name, this._finalizeSpec(base, otherSpecs));
    }

    /**
     * Adds a slider named `name` only if this group has no entry under that name yet. It checks `has(name)`
     * (whether a control is registered), not whether a value has been stored, so it also works for controls
     * brought in with `mergeControlSpecGroup`.
     * @param initialValue defaults to `1.0`
     */
    addSliderIfMissing(name: string, onChange: (v: number) => void,
                        initialValue?: number, min?: number, max?: number, step?: number): void {
        if (!this.has(name)) {
            this.addSliderControl(name, initialValue ?? 1.0, onChange, min, max, step);
        }
    }

    //</editor-fold>
    //###############################################\\--Registration--//###############################################

    //###############################################//--Nesting--\\###############################################
    //<editor-fold desc="Nesting">

    /**
     * Nests a child group (shown as a folder) under `name`, replacing any entry with that name. `spec` is
     * either a plain dict of already-built `GUIControlSpec`s (e.g. from `AAppState`'s
     * `CreateControlPanelXSpec` methods) or an existing `AControlSpecGroup` (e.g. from a model's
     * `getInstanceControlSpecGroup()`/`getClassControlSpecGroup()`), which is nested as-is.
     *
     * `addNameToKeys`, `collapsed`, and `render` only apply when `spec` is a plain dict; an existing group keeps
     * the settings it was constructed with.
     *
     * Gotcha: a child built from a dict gets no `onUpdate`, `getValue`, or `setValue` options. Adding controls to
     * the returned group later will not refresh the panel, and their values go into the child's private store
     * rather than this group's.
     * @returns the nested child group
     */
    addControlSpecGroup(name: string, spec: { [k: string]: GUIControlSpec } | AControlSpecGroup,
                         addNameToKeys: boolean = true, collapsed: boolean = true,
                         render?: AControlSpecRenderFn): AControlSpecGroup {
        let group: AControlSpecGroup;
        if (spec instanceof AControlSpecGroup) {
            group = spec;
        } else {
            group = new AControlSpecGroup(name, {addNameToKeys, collapsed, render});
            for (const key in spec) {
                group._entries[key] = {kind: "leaf", spec: spec[key]};
            }
        }
        this._entries[name] = {kind: "group", group};
        this._onUpdate();
        return group;
    }

    /**
     * Copies `source`'s direct entries (leaves and nested groups) into this group's top level. Unlike
     * `addControlSpecGroup`, `source` is not wrapped in its own folder; its entries keep their names and become
     * siblings of this group's entries (so key suffixing is governed by this group's `addNameToKeys`).
     *
     * Throws if:
     * - any entry name in `source` already exists in this group, or
     * - both groups have external `getValue`/`setValue` accessors and they are not the same functions.
     *
     * Merging moves the spec objects, not their `onChange` callbacks, so merged controls keep writing values to
     * `source`'s store. Groups that share the same external accessors (e.g. both built against the same
     * `AAppState`) are fine. If one or both groups use their own private store, nothing throws, but values from
     * merged controls still land in `source`'s store, not this group's.
     */
    mergeControlSpecGroup(source: AControlSpecGroup): void {
        const colliding = Object.keys(source._entries).filter((name) => name in this._entries);
        if (colliding.length > 0) {
            throw new Error(
                `AControlSpecGroup.mergeControlSpecGroup: "${this.name}" already has an entry named `
                + `${colliding.map((n) => `"${n}"`).join(", ")} -- refusing to silently overwrite it by merging "${source.name}" in.`
            );
        }

        if (this._hasExternalValueTracking() && source._hasExternalValueTracking()
            && (this._getValueAccessor !== source._getValueAccessor || this._setValueAccessor !== source._setValueAccessor)) {
            throw new Error(
                `AControlSpecGroup.mergeControlSpecGroup: "${this.name}" and "${source.name}" each have their own `
                + `external value tracking configured, and they aren't the same -- merging would leave "${source.name}"'s `
                + `controls reading and writing a different value store than "${this.name}"'s other controls.`
            );
        }

        for (const name in source._entries) {
            this._entries[name] = source._entries[name];
        }
        this._onUpdate();
    }

    //</editor-fold>
    //###############################################\\--Nesting--//###############################################

    //###############################################//--Reading back--\\###############################################
    //<editor-fold desc="Reading back">

    /** Returns whether this group has a direct entry (leaf or nested group) named `name`. Does not search nested groups. */
    has(name: string): boolean {
        return name in this._entries;
    }

    /**
     * Registers (or replaces) an already-built `GUIControlSpec` as a leaf, without wrapping its `onChange` or
     * recording values -- use it when the spec's `onChange` already does what you need (e.g. a spec from a
     * `CreateControlPanelXSpec` call). Triggers `onUpdate`.
     */
    setControlSpec(name: string, spec: GUIControlSpec): void {
        this._setLeaf(name, spec);
    }

    /**
     * Like `setControlSpec`, but does not trigger `onUpdate`, so several specs can be added before one manual
     * refresh (this is what `AAppState.addControlSpec` uses).
     */
    setControlSpecSilent(name: string, spec: GUIControlSpec): void {
        this._entries[name] = {kind: "leaf", spec};
    }

    /** Removes the direct entry `name` (leaf or nested group) and its value in the private store (if any), then triggers `onUpdate`. */
    remove(name: string): void {
        delete this._entries[name];
        delete this._values[name];
        this._onUpdate();
    }

    /**
     * Returns the path leva's store uses for the leaf registered as `externalKey`, searching this group and all
     * nested groups, or `undefined` if there is no such leaf.
     *
     * This group is treated as the top level: its own leaves are unsuffixed and unwrapped (its `getRawSpec()` is
     * not wrapped in a folder). Leaves inside nested groups get dotted folder paths, with each nested group's
     * `_<name>` suffix applied when its `addNameToKeys` is on -- e.g. `"Folder.x_Folder"`.
     */
    findControlPath(externalKey: string): string | undefined {
        const entry = this._entries[externalKey];
        if (entry && entry.kind === "leaf") {
            return externalKey;
        }
        for (const name in this._entries) {
            const e = this._entries[name];
            if (e.kind === "group") {
                const childPath = e.group._findControlPathWrapped(externalKey);
                if (childPath !== undefined) {
                    return `${name}.${childPath}`;
                }
            }
        }
        return undefined;
    }

    /** Like `findControlPath`, but as seen through this group's own `getFolderSpec()` wrapper: applies this group's key suffixing to its direct children. Recurses into nested groups. */
    private _findControlPathWrapped(externalKey: string): string | undefined {
        const entry = this._entries[externalKey];
        if (entry && entry.kind === "leaf") {
            return this._schemaKeyFor(externalKey);
        }
        for (const name in this._entries) {
            const e = this._entries[name];
            if (e.kind === "group") {
                const childPath = e.group._findControlPathWrapped(externalKey);
                if (childPath !== undefined) {
                    return `${this._schemaKeyFor(name)}.${childPath}`;
                }
            }
        }
        return undefined;
    }

    //</editor-fold>
    //###############################################\\--Reading back--//###############################################

    //###############################################//--Consumption by a parent--\\###############################################
    //<editor-fold desc="Consumption by a parent">

    /** Returns this group's entries as a plain `{name: spec}` dict with no `folder()` wrapper (nested groups appear as folder specs). `AAppState.GUIControlSpecs` is built this way from the root group. */
    getRawSpec(): { [k: string]: GUIControlSpec } {
        const result: { [k: string]: GUIControlSpec } = {};
        for (const name in this._entries) {
            const entry = this._entries[name];
            result[name] = entry.kind === "leaf" ? entry.spec : entry.group.getFolderSpec();
        }
        return result;
    }

    /** Returns this group wrapped in a leva `folder()` (via {@link GUISpecs.MakeFolder}), for nesting inside another group or panel spec. */
    getFolderSpec(): GUIControlSpec {
        return GUISpecs.MakeFolder(this.name, this.getRawSpec(), this._addNameToKeys, this._collapsed, this._render);
    }

    //</editor-fold>
    //###############################################\\--Consumption by a parent--//###############################################

    //###############################################//--Internal--\\###############################################
    //<editor-fold desc="Internal">

    /** Whether this group was given an external `getValue` or `setValue` (instead of using its private `_values` map); see `mergeControlSpecGroup`. */
    private _hasExternalValueTracking(): boolean {
        return this._getValueAccessor !== undefined || this._setValueAccessor !== undefined;
    }

    private _setValue(name: string, value: any): void {
        if (this._setValueAccessor) {
            this._setValueAccessor(name, value);
        } else {
            this._values[name] = value;
        }
    }

    /** Composes the group's own value-tracking with the caller's `onChange` -- the group's own write always happens first. */
    private _wrapOnChange<T>(name: string, onChange: (v: T) => void): (v: T) => void {
        return (v: T) => {
            this._setValue(name, v);
            onChange(v);
        };
    }

    /**
     * Merges `otherSpecs` into `base`, then puts `base.onChange` back, so an `onChange` key in `otherSpecs`
     * cannot skip this group's value recording (the `GUISpecs` helpers spread `otherSpecs` after `onChange`, which
     * would allow that).
     */
    private _finalizeSpec(base: GUIControlSpec, otherSpecs?: { [k: string]: any }): GUIControlSpec {
        if (!otherSpecs) return base;
        return {...base, ...otherSpecs, onChange: base.onChange};
    }

    private _setLeaf(name: string, spec: GUIControlSpec): void {
        this._entries[name] = {kind: "leaf", spec};
        this._onUpdate();
    }

    /** A direct child's key as it appears in this group's folder schema (suffixed with `_<this.name>` when `_addNameToKeys` is on). */
    private _schemaKeyFor(key: string): string {
        return this._addNameToKeys ? GUISpecs.KeyNameInFolder(key, this.name) : key;
    }

    private _onUpdate(): void {
        this._onUpdateCallback?.();
    }

    //</editor-fold>
    //###############################################\\--Internal--//###############################################
}
