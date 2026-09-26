import {ALabel} from "../base/aserial";
import {Color} from "../math/Color";
import {AHandlesEvents} from "../base/aobject/AHandlesEvents";
import {v4 as uuidv4} from "uuid";
import {proxy} from "valtio/vanilla";
import {Mutex} from "async-mutex";
import {AppStateValueChangeCallback} from "../basictypes";
import {GUISpecs, GUIControlSpec} from "../controlpanel/GUISpecs";
import {AControlSpecGroup, AControlSpecRenderFn} from "../controlpanel/AControlSpecGroup";
import {AniGraphDefines} from "../defines";

var _appState:AAppState;



/**
 * Installs `appState` as the app's single global `AAppState` instance and calls its `init()` (via
 * `_initOnce`, so `init()` never runs twice). Called by
 * {@link CreateAppState} during app startup; scenes don't call this themselves -- use {@link GetAppState} or
 * `GetAAppState()` to reach the installed instance.
 * Throws if an app state has already been installed.
 * @param appState the `AAppState` (or subclass) instance to install
 * @returns the same `appState` that was passed in
 */
export function SetAppState(appState:AAppState):AAppState{
    if(_appState !== undefined){
        throw new Error(`Already set the app state to ${_appState}`);
    }
    _appState = appState;
    _appState._initOnce();
    return _appState;
}

// enum AppStateKeys{
//     InteractionMode="InteractionMode",
//     GUI_KEY=,
//     AmbientLight="ambient"
// }

const _GUI_KEY_KEY_INDEX="GUI_KEY";

/**
 * The methods of leva's store that `updateControlPanelValue`/`syncControlPanelValue` need: pushing a new value into
 * a displayed control, and (optionally) checking that the store has that control. Declared here instead of
 * importing leva's store type.
 * @internal
 */
export interface ControlPanelStoreLike {
    setValueAtPath(path: string, value: any, fromPanel: boolean): void;
    /** leva's store returns `undefined` for a path it has no input for. Optional, so simple mocks still work. */
    getInput?(path: string): any;
}

/** Events signaled by `AAppState`. */
export enum AppStateEvents{
    TRIGGER_CONTROL_PANEL_UPDATE='TRIGGER_CONTROL_PANEL_UPDATE'
}

/**
 * Base class for the app's single global state object: a store of named values (`stateValues`) plus the
 * control-panel (leva) specs built from them. Scene code usually reaches it through {@link GetAppState}.
 *
 * Typical use: register controls in your scene model's {@link ASceneModel.initAppState} with
 * `addSliderControl`, `addCheckboxControl`, `addColorControl`, `setSelectionControl`, `addButton`, or
 * `addControlSpecGroup`, then react to them with `addStateValueListener` (or read them with `getState`).
 * Add controls in `initAppState`: controls added later (e.g. during `initScene` or in response to events) can
 * end up cut off in the panel.
 *
 * {@link AppState} is the concrete subclass the app actually creates.
 */
@ALabel("AAppState")
export abstract class AAppState extends AHandlesEvents{
    name:string="App";
    /** All named state values, including every control's current value. A valtio proxy, so the React panel re-renders when it changes. */
    stateValues:{[name:string]:any};
    /** The current leva spec for the whole panel, rebuilt from the root control group whenever controls change. Reassigned (never mutated in place) so the panel notices the change. */
    GUIControlSpecs:{[name:string]:GUIControlSpec}={};
    /** Internal: set by `ControlPanel.tsx`; see `_setControlPanelStore` and `updateControlPanelValue`. */
    _controlPanelStore?: ControlPanelStoreLike;
    /**
     * Internal: the root {@link AControlSpecGroup} that every `addXControl`/`setGUIControlSpecKey`/
     * `addControlSpecGroup` method wraps. Its `getValue`/`setValue` are wired to `getState`/`setState`, so
     * controls read and write `stateValues`; its `onUpdate` rebuilds `GUIControlSpecs` (a real field, not a
     * getter, because `ControlPanel.tsx` depends on that) and refreshes the panel.
     */
    private _rootGroup: AControlSpecGroup;
    _initMutex:Mutex;
    static AppStateEvents=AppStateEvents
    /** Internal: the `stateValues` key holding `_guiKey`. */
    static _GUI_KEY_INDEX = _GUI_KEY_KEY_INDEX;

    /** Global scene scale (from `AniGraphDefines.DefaultGlobalScale`). */
    globalScale:number=AniGraphDefines.DefaultGlobalScale;
    zNear:number=AniGraphDefines.DefaultZNear;
    zFar:number=AniGraphDefines.DefaultZFar;
    orthoZNear:number=AniGraphDefines.DefaultOrthoZNear;
    orthoZFar:number=AniGraphDefines.DefaultOrthoZFar;


    /**
     * Hook for subclass setup. Does nothing by default. It runs exactly once, when `SetAppState` installs this
     * app state; later requests to initialize (e.g. `AppState.confirmInitialized`) skip it. Don't call it
     * yourself -- call `_initOnce()` if you need to be sure it has run.
     */
    init(){}

    /** Internal: true once `init()` has run (see `_initOnce`). */
    protected _initHasRun:boolean=false;

    /**
     * Internal: calls `init()` the first time, and does nothing after that. Both `SetAppState` and
     * `AppState.confirmInitialized` use this, so a subclass's `init()` never runs twice.
     */
    _initOnce(){
        if(this._initHasRun){
            return;
        }
        this._initHasRun = true;
        this.init();
    }
    /**
     * Internal: a value the control panel component watches so it knows to
     * re-render whenever `updateControlPanel()` runs. Scene code should
     * never need to read or set this directly.
     * @param value a fresh, unique value (a uuid) to trigger a re-render
     */
    set _guiKey(value){this.stateValues[_GUI_KEY_KEY_INDEX]=value;}
    get _guiKey(){return this.stateValues[_GUI_KEY_KEY_INDEX];}

    /**
     * Reads the current value of any named app-state entry, including a control's current value (keyed by the
     * name it was registered under). Returns `undefined` if nothing has been stored under `key`. Registering a
     * control does not store its initial value by itself; the panel writes it (through the control's
     * `onChange`) when it first displays the control.
     * @param key the state/control name to read
     * @returns the current value stored under `key`, or `undefined`
     */
    getState(key:string){
        if(key in this.stateValues) {
            return this.stateValues[key];
        }else{
            return undefined;
        }
    }

    /**
     * Writes `value` under `name` in app state and notifies every
     * `addStateValueListener(name, ...)` subscriber. This is what a
     * control's `onChange` calls when the user edits it in the panel, and
     * you can call it yourself to set a value as if the user had -- doing so
     * does **not** update the control's displayed value in the panel (use
     * `setControlPanelStateValue` for that; see `ControlPanel.md`).
     * @param name the state/control name to write
     * @param value the new value to store and broadcast to listeners
     */
    setState(name:string, value:any){
        this.stateValues[name]=value;
        this.signalEvent(AAppState.GetEventKeyForName(name), value);
    }

    constructor() {
        super();
        this._initMutex = new Mutex();
        this.stateValues=proxy({});
        this._rootGroup = new AControlSpecGroup("root", {
            getValue: (name) => this.getState(name),
            setValue: (name, value) => this.setState(name, value),
            onUpdate: () => {
                this.GUIControlSpecs = this._rootGroup.getRawSpec();
                this.updateControlPanel();
            },
        });
        this.setState(_GUI_KEY_KEY_INDEX, uuidv4());
    }

    /** Mutex used by `AppState.confirmInitialized` so initialization runs one at a time. */
    get initMutex(){
        return this._initMutex;
    }




    /**
     * Tells the control panel to redraw itself from the current contents of
     * `GUIControlSpecs`. Every `addXControl`/`setSelectionControl`/
     * `updateControlSpecEntry`/`addControlSpecGroup` method already
     * calls this for you, so you only need to call it yourself if you write
     * to `GUIControlSpecs` some other way -- most commonly after batching
     * several changes with `addControlSpec`, which deliberately does *not*
     * call this on its own.
     */
    updateControlPanel(){
        this.signalEvent(AAppState.AppStateEvents.TRIGGER_CONTROL_PANEL_UPDATE, this);
    }

    /**
     * Registers a callback that fires every time `updateControlPanel()` runs
     * -- i.e. any time the *set* of controls (or one control's range/options)
     * changes, not when a particular control's value changes. If you want to
     * react to one control's value, use `addStateValueListener` instead; this
     * is for framework-level code that cares about the panel changing shape.
     * The callback always runs synchronously, inside the `updateControlPanel()` call.
     * @param callback called with this app state whenever the panel updates
     * @param handle optional name for this listener, so it can be found/removed later
     * @returns a switch you can use to deactivate the listener
     */
    addControlPanelListener(callback:(appState:AAppState)=>void, handle?:string){
        return this.addEventListener(AAppState.AppStateEvents.TRIGGER_CONTROL_PANEL_UPDATE, callback, handle);
    }

    /**
     * Internal: called by `ControlPanel.tsx` whenever the store backing the
     * panel changes, so `updateControlPanelValue` always has a live one to push a
     * value into. Not meant to be called from scene code.
     * @param store the control panel's current underlying store
     */
    _setControlPanelStore(store: ControlPanelStoreLike){
        this._controlPanelStore = store;
    }

    /**
     * Makes the control panel's displayed value for `name` match `getState(name)`, leaving the rest of its spec
     * (range, options, step, label, ...) untouched. Use it after setting a value from code with `setState`,
     * which only updates the stored value (see `ControlPanel.md`). Does nothing if `name` isn't a registered
     * control or the panel hasn't mounted yet.
     *
     * A `Color` in state is pushed in the form leva expects (`color.RGBuintAfloat`); other values are pushed
     * as-is (see `_toControlPanelDisplayValue`).
     * @param name the control name to update
     */
    updateControlPanelValue(name: string){
        this._pushControlPanelValue(name, this.getState(name));
    }

    /**
     * Internal: pushes `displayValue` into the panel's store for control `name`, converted with
     * `_toControlPanelDisplayValue`. Does nothing if `name` isn't a registered control, if the panel hasn't mounted,
     * or if the panel's store doesn't have that control yet: right after a control is added, and before the panel's
     * first render, the store is leva's placeholder, and `setValueAtPath` throws on a path it doesn't have. In that
     * case the panel shows the control's spec value when it renders.
     * @param name the control name
     * @param displayValue the value to show
     */
    private _pushControlPanelValue(name: string, displayValue: any){
        const path = this._resolveControlStorePath(name);
        const store = this._controlPanelStore;
        if(path === undefined || !store){
            return;
        }
        if(store.getInput && store.getInput(path) === undefined){
            return;
        }
        store.setValueAtPath(path, AAppState._toControlPanelDisplayValue(displayValue), false);
    }

    /**
     * Internal: converts a state value into the form leva's store wants to display. Leva's color picker expects
     * a plain `{r, g, b, a}` object (`color.RGBuintAfloat`: r, g, b in 0-255, a in 0-1), not an AniGraph
     * `Color` -- pushing a raw `Color` doesn't throw, but corrupts the swatch. Anything else is returned unchanged.
     * @param value a value from `stateValues`
     * @returns the value to hand to leva
     */
    static _toControlPanelDisplayValue(value:any):any{
        return (value instanceof Color) ? value.RGBuintAfloat : value;
    }

    /**
     * Internal: returns the path leva's store uses for control `name`, or `undefined` if `name` isn't a
     * registered control (see {@link AControlSpecGroup.findControlPath}). For a top-level control this is `name`.
     * Inside an `addControlSpecGroup` folder it is `"<folderName>.<name>"` with `addFolderNameToKeys=false`, or
     * `"<folderName>.<name>_<folderName>"` with `addFolderNameToKeys=true`, at any nesting depth.
     */
    private _resolveControlStorePath(name: string): string | undefined {
        return this._rootGroup.findControlPath(name);
    }

    /**
     * Sets the state value `name` (notifying `addStateValueListener` subscribers, like `setState`) and updates
     * the panel to display it (like `updateControlPanelValue`).
     */
    setControlPanelStateValue(name: string, value:any){
        this.setState(name, value);
        this.updateControlPanelValue(name);
    }

    /**
     * Like `setControlPanelStateValue`, but does **not** notify `addStateValueListener(name, ...)` subscribers;
     * it only updates `stateValues[name]` and the panel's displayed value.
     *
     * Use it to make a control show something that is already true elsewhere, e.g. when a shared "selected
     * object" panel switches to a different object. The model is already correct, so notifying listeners would
     * just re-apply the value (possibly to the wrong target if the selection changed again).
     *
     * `displayValue` (what is pushed into leva) defaults to `value` (what `getState` returns). They differ for
     * color controls: state holds an AniGraph `Color`, but leva expects `color.RGBuintAfloat`. A `Color` passed
     * as `displayValue` (including the default) is converted to `RGBuintAfloat` for you, the same way
     * `updateControlPanelValue` does it, since a raw `Color` corrupts leva's swatch.
     * @param name the control name
     * @param value the value to store in `stateValues`
     * @param displayValue the value to show in the panel (defaults to `value`)
     */
    syncControlPanelValue(name: string, value: any, displayValue: any = value){
        this.stateValues[name] = value;
        this._pushControlPanelValue(name, displayValue);
    }


    /**
     * Internal: builds the `onChange` callback every `CreateControlPanelXSpec`
     * method below wires into its spec, so that a user editing that control
     * writes the new value into `stateValues` (via `setState`, which is what
     * `addStateValueListener` subscribers see).
     * @param parameterName the state/control name the returned callback writes to
     * @returns a callback suitable for a spec's `onChange`
     */
    _GetOnChangeForName(parameterName:string):AppStateValueChangeCallback{
        const self = this;
        return (v:any)=>{
            self.setState(parameterName, v);
        }

    }

    /**
     * Builds a checkbox spec for `stateName`, without registering it anywhere
     * -- this only constructs the spec object; it does not touch
     * `GUIControlSpecs` or the panel. Most scenes want `addCheckboxControl`
     * instead, which does both in one call. Use this directly only when
     * assembling several specs yourself to register together with `addControlSpec`.
     * @param stateName the state/control name this checkbox will be registered under
     * @param value the checkbox's starting value
     * @param otherSpecs additional spec fields (e.g. a label) merged into the result
     */
    CreateControlPanelCheckboxSpec(stateName:string, value:boolean, otherSpecs?:{[name:string]:any}){
        const self = this;
        return GUISpecs.CheckboxControl(
            self._GetOnChangeForName(stateName),
            value,
            otherSpecs
        )
    }

    /**
     * Builds a slider spec for `stateName`, without registering it anywhere
     * -- see `CreateControlPanelCheckboxSpec` above. Most scenes want
     * `addSliderControl` instead. `initialValue` only matters the first time
     * a control named `stateName` is ever registered; if one already exists,
     * building and re-registering a new spec updates its `min`/`max`/`step`
     * without moving the slider out from under the user.
     * @param stateName the state/control name this slider will be registered under
     * @param initialValue the slider's starting value (used only on first registration -- see above)
     * @param min the slider's minimum value (defaults to `min(initialValue, 0)` if omitted)
     * @param max the slider's maximum value (defaults to `max(initialValue, 1)` if omitted)
     * @param step the slider's increment size
     * @param otherSpecs additional spec fields (e.g. a label) merged into the result
     */
    CreateControlPanelSliderSpec(stateName:string, initialValue:any, min?:number, max?:number, step?:number, otherSpecs?:{[name:string]:any}):GUIControlSpec{
        const self = this;
        return GUISpecs.SliderControl(
            self._GetOnChangeForName(stateName),
            initialValue,
            min??Math.min(initialValue, 0.0),
            max??Math.max(initialValue, 1.0),
            step,
            otherSpecs
        )
    }

    /**
     * Builds a color-picker spec for `stateName`, without registering it
     * anywhere -- see `CreateControlPanelCheckboxSpec` above. Most scenes want
     * `addColorControl` instead. `initialValue` is an AniGraph `Color`
     * object, not a raw hex string or CSS color string.
     * @param stateName the state/control name this color picker will be registered under
     * @param initialValue the color picker's starting value
     * @param otherSpecs additional spec fields (e.g. a label) merged into the result
     */
    CreateControlPanelColorPickerSpec(stateName:string, initialValue:Color, otherSpecs?:{[name:string]:any}):GUIControlSpec{
        const self = this;
        return GUISpecs.ColorControl(
            self._GetOnChangeForName(stateName),
            initialValue,
            otherSpecs
        );
    }


    /**
     * Builds a button spec that calls `callback` when clicked, without
     * registering it anywhere -- see `CreateControlPanelCheckboxSpec` above.
     * Most scenes want `addButton` instead. Buttons have no associated value:
     * clicking one just invokes `callback` directly, it does not call
     * `setState`, so there is nothing to read via `getState` or
     * `addStateValueListener` for a button's name.
     * @param callback called with no arguments when the button is clicked
     * @param otherSpecs additional spec fields (e.g. a label) merged into the result
     */
    CreateControlPanelButtonSpec(callback:()=>void, otherSpecs?:{[name:string]:any}):GUIControlSpec{
        return GUISpecs.ButtonControl(callback, otherSpecs);
    }

    /**
     * Builds a dropdown spec for `stateName` with choices `options`, without
     * registering it anywhere -- see `CreateControlPanelCheckboxSpec` above.
     * Most scenes want `setSelectionControl` instead. `initialValue` should
     * be one of the entries in `options`.
     * @param stateName the state/control name this dropdown will be registered under
     * @param initialValue the dropdown's starting selection -- must be one of `options`
     * @param options the list of choices the user can pick from
     * @param otherSpecs additional spec fields (e.g. a label) merged into the result
     */
    CreateControlPanelSelectionSpec(stateName:string, initialValue:any, options:any[], otherSpecs?:{[name:string]:any}):GUIControlSpec{
        const self = this;
        return GUISpecs.SelectionControl(
            (v: string) => {
                self._GetOnChangeForName(stateName)(v);
            },
            options,
            initialValue,
            otherSpecs
        )
    }


    /**
     * Internal: the event name `addStateValueListener(name, ...)` subscribes to for a given control name.
     * @param name the state/control name
     * @returns the event key used internally to broadcast changes to `name`
     */
    static GetEventKeyForName(name:string):string{
        return `Parameter_${name}_update_event`;
    }

    /**
     * Registers (or replaces) one already-built spec under `name` and refreshes the panel (same as
     * `updateControlSpecEntry`). Use it with a spec from a `CreateControlPanelXSpec` method when none of the
     * `addXControl` methods fit.
     * @param name the control name to register the spec under
     * @param spec a spec built by one of the `CreateControlPanelXSpec` methods
     */
    setGUIControlSpecKey(name:string, spec:GUIControlSpec){
        // Delegates to _rootGroup.setControlSpec, whose onUpdate callback
        // is what actually reassigns GUIControlSpecs to a new object (never
        // mutating the existing one in place -- the panel only notices a
        // spec change by comparing object references, not by deep-diffing)
        // and calls updateControlPanel().
        this._rootGroup.setControlSpec(name, spec);
    }

    // setGUIControlSpecKeyGroup(name:string, spec:GUIControlSpec){
    //     this.GUIControlSpecs[name]= folder();
    //     this.updateControlPanel();
    // }

    /**
     * Adds a numeric slider control named `name` (call it from `initAppState`; see the class docs). If `name`
     * isn't already a control, this creates it with `initialValue`, and once the panel displays it
     * `getState(name)` returns that value until the user drags the slider. If `name` already
     * exists, calling this again updates its `min`/`max`/`step` without
     * moving the slider out from under the user -- use this to change a
     * slider's range from code (e.g. as more data becomes available), not to
     * try to force its current value.
     * @param name the control name to register (or update)
     * @param initialValue the slider's starting value (used only on first registration -- see above)
     * @param min the slider's minimum value (defaults to `min(initialValue, 0)`)
     * @param max the slider's maximum value (defaults to `max(initialValue, 1)`)
     * @param step the slider's increment size (defaults to 1% of the range)
     */
    addSliderControl(name:string, initialValue:any, min?:number, max?:number, step?:number){
        // The empty onChange here is deliberate: _rootGroup's own setValue
        // accessor already routes into this.setState(name, v) (see the
        // constructor), which does everything _GetOnChangeForName's
        // callback would -- passing that in too would call setState twice
        // per edit.
        this._rootGroup.addSliderControl(name, initialValue, () => {}, min, max, step);
    }

    /**
     * Adds a checkbox control named `name` (call it from `initAppState`). `getState(name)` returns its
     * current boolean value; use `addStateValueListener(name, cb)` to react
     * when the user toggles it.
     * @param name the control name to register (or update)
     * @param value the checkbox's starting value (used only on first registration)
     */
    addCheckboxControl(name:string, value:boolean){
        this._rootGroup.addCheckboxControl(name, value, () => {});
        // this.setUniform(TextureProvidedKeyForName(name), !!tex, 'bool');
    }

    /**
     * Adds a button that calls `callback` when clicked (call it from `initAppState`). Buttons have no
     * associated value -- there is nothing in `stateValues` to read for a
     * button's name, and `addStateValueListener` won't fire for it; put
     * whatever should happen directly in `callback`.
     * @param name the control name to register the button under
     * @param callback called with no arguments when the button is clicked
     */
    addButton(name:string, callback:()=>void){
        this._rootGroup.addButton(name, callback);
    }

    /**
     * Adds a color-picker control named `name` (call it from `initAppState`). `initialValue` (and
     * `getState(name)`) are AniGraph Color objects, not a raw hex
     * string or CSS color string.
     * @param name the control name to register (or update)
     * @param initialValue the color picker's starting value (used only on first registration)
     */
    addColorControl(name:string, initialValue:Color){
        this._rootGroup.addColorControl(name, initialValue, () => {});
    }

    /**
     * Adds a dropdown control named `name` whose choices are `options` (call it from `initAppState`).
     * `getState(name)` returns whichever option is currently selected;
     * `initialValue` should be one of the entries in `options`.
     * @param name the control name to register (or update)
     * @param initialValue the dropdown's starting selection (used only on first registration) -- must be one of `options`
     * @param options the list of choices the user can pick from; re-registering with a new list is how you change a dropdown's options from code
     * @param otherSpecs additional spec fields (e.g. a label) merged into the control's spec
     */
    setSelectionControl(name:string, initialValue:any, options:any[], otherSpecs?:{[name:string]:any}){
        this._rootGroup.addSelectionControl(name, initialValue, options, () => {}, otherSpecs);
    }

    /**
     * Adds a listener for the app-state value `stateName`. The callback fires
     * whenever that value is set -- both when a user edits
     * the matching control in the panel, and when your own code calls `setState(stateName, ...)`
     * directly. This is the standard way to react to a control: register one of these in `initScene`
     * with the same name you registered the control under in `initAppState`.
     * @param stateName the state/control name to listen for changes on
     * @param callback called with the new value whenever `stateName` changes
     * @param handle optional name for this listener, so it can be found/removed later
     * @returns a switch you can use to deactivate the listener
     */
    addStateValueListener(
        stateName: string,
        callback: AppStateValueChangeCallback,
        handle?: string
    ) {
        return this.addEventListener(
            AAppState.GetEventKeyForName(stateName),
            callback,
            handle,
            );
    }

    /**
     * Shortcut for `addStateValueListener` for the most common listener shape:
     * "when this control changes, assign its value to one property of some
     * object, then tell that object it changed." Equivalent to
     * `addStateValueListener(stateName, (v) => { target[key] = v; signal?.(target); })`.
     *
     * It doesn't register a control (do that with the usual `addXControl`
     * call). Use it when a listener does nothing but assign-and-signal;
     * write a plain `addStateValueListener` for anything with more logic.
     *
     * Like `addStateValueListener`, returns a switch: pass it to a scene's
     * `this.subscribe(...)` so the binding is torn down with the scene.
     * @param stateName the state/control name to listen for changes on
     * @param target the object whose property gets assigned
     * @param key the property of `target` to assign the control's new value to
     * @param options.signal called with `target` right after the assignment, e.g. `(n) => n.signalGeometryUpdate()`
     * @param options.transform maps the control's raw value to the property's value first (e.g. `Math.round`)
     * @param options.handle optional name for the underlying listener
     */
    bindStateValueToProperty<T extends object, K extends keyof T>(
        stateName: string,
        target: T,
        key: K,
        options?: {
            signal?: (target: T) => void;
            transform?: (value: any) => T[K];
            handle?: string;
        }
    ) {
        return this.addStateValueListener(stateName, (v: any) => {
            target[key] = options?.transform ? options.transform(v) : v;
            options?.signal?.(target);
        }, options?.handle);
    }




    /**
     * Merges a batch of `{name: spec}` pairs into `GUIControlSpecs` in one
     * shot. Unlike `addXControl`/`setGUIControlSpecKey`, this does **not**
     * call `updateControlPanel()` for you, so nothing changes in the panel
     * until you call it yourself afterward. Use this (plus one
     * `updateControlPanel()` call) when updating several controls at once
     * and you want the panel to refresh only once instead of once per
     * control; build each spec first with the matching
     * `CreateControlPanelXSpec` method.
     * @param controlSpec a dict of `{name: spec}` pairs to merge into `GUIControlSpecs`
     */
    addControlSpec(controlSpec:{[name:string]:GUIControlSpec}){
        for(const name in controlSpec){
            this._rootGroup.setControlSpecSilent(name, controlSpec[name]);
        }
        // setControlSpecSilent deliberately doesn't trigger _rootGroup's
        // onUpdate (which is what would call updateControlPanel()) -- but
        // GUIControlSpecs itself still needs to reflect the merge immediately,
        // so the next updateControlPanel() call displays what was just added.
        this.GUIControlSpecs = this._rootGroup.getRawSpec();
    }

    /**
     * Internal: returns `name` unchanged if it isn't already a key in
     * `GUIControlSpecs`, otherwise appends a number until it finds one that
     * isn't. Used (e.g. by `AShaderModel`) to pick a folder name that won't
     * overwrite an existing control.
     * @param name the candidate control name
     * @returns `name`, or `name` with a number appended if `name` is already taken
     */
    _GetUniqueFolderName(name:string){
        if(name in this.GUIControlSpecs){
            let ntries = 1;
            let rname = name+`${ntries}`
            while(rname in this.GUIControlSpecs){
                ntries++;
                rname = name+`${ntries}`
            }
            return rname;
        }else{
            return name;
        }
    }

    /**
     * Groups a dict of control specs together into a collapsible folder in
     * the panel, under a heading of `name` (call it from `initAppState`).
     * Replaces any existing entry named `name`.
     * @param name the folder's heading, and the key it's registered under in `GUIControlSpecs`
     * @param spec a dict of `{name: spec}` pairs for the controls inside the folder, each built with a `CreateControlPanelXSpec` method -- OR an already-built `AControlSpecGroup` (e.g. from a model's `getInstanceControlSpecGroup()`/`getClassControlSpecGroup()`), nested as-is
     * @param addFolderNameToKeys if true (default), each control's name inside the folder gets `_<name>` appended to keep it unique across folders -- so read a folder child's value back with `getState("<controlName>_<folderName>")` / `addStateValueListener("<controlName>_<folderName>", ...)`, not the plain name you passed in `spec`. Pass `false` only if you're managing uniqueness yourself. Ignored when `spec` is already an `AControlSpecGroup` -- that group's own `addNameToKeys` (set when it was constructed) is what's honored.
     * @param collapsed whether the folder starts collapsed. Also ignored when `spec` is already an `AControlSpecGroup`, for the same reason.
     * @param render leva's own conditional-render hook (`(get) => boolean`, re-evaluated whenever any control in the panel changes) -- show/hide this whole folder based on another control's current value, e.g. only while a `Tool` dropdown is set to a particular choice. Also ignored when `spec` is already an `AControlSpecGroup`.
     */
    addControlSpecGroup(name:string, spec:GUIControlSpec|AControlSpecGroup, addFolderNameToKeys=true, collapsed=true, render?:AControlSpecRenderFn){
        this._rootGroup.addControlSpecGroup(name, spec, addFolderNameToKeys, collapsed, render);
    }

    /**
     * Registers (or replaces) a raw, already-built `GUIControlSpec` under
     * `name` and refreshes the panel -- functionally identical to
     * `setGUIControlSpecKey`. Prefer one of the `addXControl` methods
     * when adding a normal control; reach for this when you already have a
     * `GUIControlSpec` in hand (e.g. from a `CreateControlPanelXSpec` call)
     * and just want to (re-)register it.
     * @param name the control name to register the spec under
     * @param spec an already-built `GUIControlSpec`
     */
    updateControlSpecEntry(name:string, spec:GUIControlSpec){
        this._rootGroup.setControlSpec(name, spec);
    }

    /**
     * Adds a slider named `name` only if no control with that name is registered yet (at the top level of the
     * panel); otherwise does nothing.
     * @param name the control name to check for and, if missing, register
     * @param initialValue initial value for app state (defaults to `1.0` if omitted)
     * @param min minimum value of slider
     * @param max maximum value of slider
     * @param step step size of slider
     */
    addSliderIfMissing(name:string, initialValue?:number, min?:number, max?:number, step?:number){
        this._rootGroup.addSliderIfMissing(name, () => {}, initialValue, min, max, step);
    }

}

/**
 * Returns the app's global `AAppState` instance if one has been installed
 * via `SetAppState`, or `undefined` otherwise. Prefer `GetAAppState()` (or
 * `GetAppState()`) unless you specifically need to handle the not-yet-set case.
 * @returns the current `AAppState`, or `undefined`
 */
export function CheckAAppState():AAppState|undefined{
    return _appState;
}

/**
 * Returns the app's global `AAppState` instance, throwing if one hasn't
 * been installed yet via `SetAppState`. This is the usual way scene code
 * reaches app state; see also `GetAppState()`, which returns the same
 * instance already cast to the concrete `AppState` subclass.
 * @returns the current `AAppState`
 */
export function GetAAppState(){
    let appState = CheckAAppState();
    if(appState===undefined){
        throw Error("No App State!")
    }
    return appState;
}
