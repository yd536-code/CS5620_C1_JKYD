
import {AObjectState, AObject, HasTags} from "../../base/aobject";
import {ACallbackSwitch} from "../../base/aevents"
import {AModel} from "../../base/amvc/AModel";
import {AGeometrySet,
    VertexArray
} from "../../geometry";
import type {Mat4, TransformationInterface} from "../../math";
import {AMaterial, AShaderMaterial} from "../../rendering/material";
import {AControlSpecGroup} from "../../controlpanel/AControlSpecGroup";
import {AClock} from "../../time/AClock";
import type {BezierTween} from "../../geometry/BezierTween";
import type {CallbackType} from "../../basictypes";


/**
 * Handle under which a node's subscription to its current material's UPDATE events is registered
 * (see `setMaterialUpdateSubscriptions`). A fixed handle lets `_disposeMaterial` find and remove it.
 */
const MATERIAL_UPDATE_SUBSCRIPTION_HANDLE = 'MATERIAL_UPDATE_SUBSCRIPTION_NodeModel';

/**
 * Handle under which the listener on the transform state keys (`transformStateKeys`) is registered while
 * `autoTransformUpdate` is on.
 */
const NODE_TRANSFORM_UPDATE_HANDLE = "NODE_TRANSFORM_UPDATE";

/**
 * Names of the events an `ANodeModel` signals. Exposed as `ANodeModel.NodeModelEvents`.
 */
export enum ANodeModelEvents{
    /** The node's geometry (its vertex data) changed. Signaled by `signalGeometryUpdate`. */
    GEOMETRY_UPDATE = "GEOMETRY_UPDATE",
    /**
     * The node's transform changed. Sent automatically on every transform edit while `autoTransformUpdate` is on,
     * and by every explicit `signalTransformUpdate()` call. Listeners receive `(node, automatic)`: `automatic` is
     * true for an automatic event and undefined for an explicit `signalTransformUpdate()` call.
     */
    TRANSFORM_UPDATE = "TRANSFORM_UPDATE",
    /**
     * Reserved for subclasses that carry a texture. Nothing in AniGraph signals it yet, so listeners added with
     * `TexturedPolygonModel2D.addTextureUpdateListener` only run if your own code signals this event.
     */
    TEXTURE_UPDATE="TEXTURE_UPDATE",
    /** Reserved. Nothing in AniGraph currently signals or listens for it. */
    COLOR_UPDATE="COLOR_UPDATE",
    /** The node's render order changed. Signaled by `signalRenderOrderUpdate`. */
    RENDER_ORDER_UPDATE="RENDER_ORDER_UPDATE"
}

/**
 * Abstract base class of every node model in a scene graph.
 *
 * `ANodeModel` works for 2D and 3D alike. On top of {@link AModel} it provides: a transform, visibility and
 * pickability flags, a render order, a geometry set and material, free-form tags, control-panel hooks, timed actions,
 * and the events that let views react to changes in any of these. It leaves the concrete transform and vertex-array
 * types to its subclasses ({@link ANodeModelSubclass}, {@link ANodeModel2D} and {@link ANodeModel3D}), which
 * implement the abstract `zValue`, `transform`, `setTransform`, `verts` and `setVerts` members declared below.
 * Scene code normally subclasses `ANodeModel2D` or `ANodeModel3D`, and edits a node's transform through their
 * `prsa` property.
 *
 * Add a top-level node to a scene with `sceneModel.addNode(node)`, and a child node with `parent.addChild(child)`.
 * By default (`autoTransformUpdate` on), every transform edit redraws the node's views automatically.
 */
export abstract class ANodeModel extends AModel implements HasTags{
    /**
     * The events an `ANodeModel` signals, e.g. `ANodeModel.NodeModelEvents.GEOMETRY_UPDATE`.
     * See `ANodeModelEvents` for what each one means.
     */
    static NodeModelEvents = ANodeModelEvents;
    /**
     * Backing state for `transform`: the node's transform relative to its parent. Read it through `transform` and
     * change it through `setTransform` (or, for PRSA nodes, by editing `prsa`).
     */
    @AObjectState protected _transform!:TransformationInterface;

    /**
     * Depth of this node, used to order it relative to other nodes. For 2D nodes it is a stored value (part of the
     * node's transform) that `ANodeModel2D.embedTransform` uses as the z translation of the render matrix. For 3D
     * nodes it is the z component of `transform.getPosition()`.
     */
    abstract get zValue():number;

    /**
     * Backing state for `visible`. It is `@AObjectState`, so changes fire state listeners (see `addVisibilityListener`).
     * The constructor initializes it to `true`; use the `visible` accessors rather than setting this directly.
     */
    @AObjectState _visible!:boolean;

    /**
     * Backing flag for `autoTransformUpdate`. It only records whether the transform-state listener is currently
     * registered, so set it through the `autoTransformUpdate` accessor, which manages the subscription.
     */
    _autoTransformUpdate:boolean=false;

    /**
     * Walks up the parent chain past every `ANodeModel` ancestor and returns the first ancestor that is not an
     * `ANodeModel`. For a node in a scene this is normally the {@link AModelGraph} that holds the node's tree (a
     * top-level node's parent is the model graph, not the scene model).
     * @returns The root model, or `null` if the topmost node in the chain has no parent (i.e. the node is detached).
     * @throws Error if an ancestor is neither an `ANodeModel` nor an `AModel`.
     */
    getRootModel():AModel|null{
        if(this.parent === null){
            return null;
        }else if (this.parent instanceof ANodeModel){
            return this.parent.getRootModel();
        }else if(this.parent instanceof AModel){
            return this.parent;
        }else {
            throw new Error(`Unrecognized ancestor type for ${this.parent}`);
        }
    }

    /**
     * Whether this node is attached to a scene graph: true when `getRootModel()` is a model that reports
     * `isSceneGraphRoot` (as `AModelGraph` does), false for detached nodes or nodes under any other kind of root.
     */
    get isInSceneGraph():boolean{
        let root = this.getRootModel();
        return root? root.isSceneGraphRoot:false;
    }

    /**
     * Whether the node is visible. Setting it fires the listeners added with `addVisibilityListener`.
     * New nodes are visible.
     */
    set visible(value:boolean){this._visible = value;}
    get visible(){return this._visible;}

    /**
     * Whether this node can be hit by `getNodeViewAtCursor`/`getNodeModelAtCursor`. Defaults to true. Set it false
     * for decorative or background nodes: a hit on such a node resolves to its nearest pickable ancestor instead,
     * and only if no ancestor is pickable does the click pass through to whatever is behind it.
     */
    protected _pickable:boolean = true;
    set pickable(value:boolean){this._pickable = value;}
    get pickable(){return this._pickable;}

    /**
     * The node's transform, generally its transformation relative to its parent. Subclasses fix the concrete type
     * (for example `Mat3` or `NodeTransform2D` for 2D nodes, `Mat4` or `NodeTransform3D` for 3D nodes).
     */
    abstract get transform():TransformationInterface;

    /**
     * Sets the node's transform, keeping the node's current representation (PRSA or matrix) and converting the
     * given transform if needed. See `ANodeModel2D.setTransform` and `ANodeModel3D.setTransform` for the exact
     * rules; a 3D node throws if given a 2D transform. The result is stored in `_transform`, which signals a
     * transform update while `autoTransformUpdate` is on.
     * @param transform The new transform.
     */
    abstract setTransform(transform:TransformationInterface):void;

    /**
     * Embeds a transform expressed in this node's own space into the 4x4 space the Three.js renderer works in.
     *
     * The transform can be the node's local transform, its world transform, or any other transform of the same
     * dimension. A 3D node's transform is already a 4x4 matrix. A 2D node's transform is a 3x3 matrix (or a
     * `NodeTransform2D`), which is embedded as a 2D homogeneous transform with `zValue` as the z translation. A
     * transform that already is a `Mat4` is treated as an already-embedded render matrix and is returned unchanged.
     *
     * This is where the 2D-versus-3D distinction is resolved for rendering, so views never inspect the type of a
     * transform themselves. The returned matrix may be the node's own matrix object: do not modify it.
     * @param transform A transform of this node's space, or an already-embedded `Mat4`.
     * @returns The matrix to apply to this node's render object.
     */
    abstract embedTransform(transform:TransformationInterface):Mat4;

    /**
     * The local matrix a Three.js view applies to this node's render object: `embedTransform(this.transform)`.
     * @returns The embedded local transform. Do not modify it.
     */
    getRenderMatrix():Mat4{
        return this.embedTransform(this.transform);
    }

    /**
     * Backing value for `renderOrder`, applied as the Three.js render order
     * (https://threejs.org/docs/#Object3D.renderOrder).
     */
    protected _renderOrder:number=0;

    /**
     * The state keys that make up this node's transform for rendering: a change under any of them (nested edits
     * included) is a transform change. Views ignore these keys in their general state listener and redraw the
     * transform on `TRANSFORM_UPDATE` instead. `ANodeModel2D` adds `_zValue`.
     */
    get transformStateKeys():string[]{
        return ["_transform"];
    }

    /**
     * Chooses how this node's views keep up with its transform. True by default.
     * - **true (automatic):** every change to the transform state (`transformStateKeys`, including nested edits such
     *   as `prsa.position.x = ...`) signals `TRANSFORM_UPDATE` right away, so views redraw on each edit. You never
     *   need to call `signalTransformUpdate()` yourself.
     * - **false (signaled):** transform edits signal nothing. Call `signalTransformUpdate()` (or
     *   `flushTransformUpdate()`) once after a batch of edits, and views redraw once. Use this when a transform
     *   changes many times in one frame.
     *
     * Turning it back on signals one update, so views catch up with edits made while it was off.
     *
     * @example
     * node.autoTransformUpdate = false;
     * for (const step of steps) { node.prsa.position = node.prsa.position.plus(step); }
     * node.signalTransformUpdate(); // views redraw once
     */
    get autoTransformUpdate():boolean{
        return this._autoTransformUpdate;
    }

    set autoTransformUpdate(value:boolean){
        const self = this;
        if(!value){
            if(this._autoTransformUpdate){
                this.unsubscribe(NODE_TRANSFORM_UPDATE_HANDLE, false);
                this._autoTransformUpdate = value;
            }
            return;
        }else{
            if(!this._autoTransformUpdate){
                this.subscribe(this.addStateKeysListener(this.transformStateKeys, ()=>{
                    self._signalAutomaticTransformUpdate();
                }), NODE_TRANSFORM_UPDATE_HANDLE,);
                this._autoTransformUpdate = value;
                this._signalAutomaticTransformUpdate();
            }
        }
    }


    /**
     * The render order applied to this node's view (see `_renderOrder`). Setting it signals a render order update
     * so that views can apply the new value.
     */
    set renderOrder(value){
        this._renderOrder = value;
        this.signalRenderOrderUpdate();
    }
    get renderOrder(){return this._renderOrder;}


    /**
     * The node's geometry: an `AGeometrySet` whose `verts` element holds the node's vertex array. Subclasses may add
     * further named members. Created by the constructor.
     */
    protected _geometry!:AGeometrySet;

    /** The node's geometry set (see `_geometry`). */
    get geometry(){return this._geometry;}

    /**
     * The node's vertex array. Subclasses fix the concrete type (for example `VertexArray2D`, `VertexArray3D` or
     * `Polygon2D`); it normally reads `geometry.verts`.
     */
    abstract get verts():VertexArray<any>;

    /**
     * Replaces the node's vertex array. Implementations conventionally signal a geometry update afterwards (as
     * `ANodeModelSubclass.setVerts` does) so that views rebuild their graphics.
     * @param verts The new vertex array.
     */
    abstract setVerts(verts:VertexArray<any>):void;

    /**
     * The material used to draw the node. It is not set by the constructor: it stays undefined until `setMaterial`
     * is called.
     */
    protected _material!:AMaterial;

    /**
     * The node's current material. The getter casts to `AShaderMaterial` without checking, so it is only accurate for
     * nodes whose material is a shader material. It is undefined before the first call to `setMaterial`.
     */
    get material():AShaderMaterial{return this._material as AShaderMaterial;}

    //###############################################//--Tags--\\###############################################
    //<editor-fold desc="Tags">
    /**
     * Tags let scene code label nodes, for example to filter the models in a scene or so a scene controller can
     * decide how to view or render them. The engine itself does not act on tags. This is a dictionary from tag name
     * to tag value (`true` for tags added with `addTag`). It must be a plain object, not an array: tags are string keys,
     * and saving an array drops its string keys, so the tags would be lost on save/load.
     */
    @AObjectState _nodeTags!:{[tagName:string]:any};

    /** The raw tag dictionary (see `_nodeTags`). Intended for subclasses. */
    protected getNodeTags(){return this._nodeTags;}

    /**
     * Adds a tag with the value `true`, replacing any value the tag already had.
     * @param tagName The tag to add.
     */
    addTag(tagName:string){this._nodeTags[tagName]=true;}

    /**
     * Sets a tag to an arbitrary value, so a tag can carry data as well as mark membership.
     * @param tagName The tag to set.
     * @param value The value to store under the tag.
     */
    setTagValue(tagName:string, value:any){this._nodeTags[tagName]=value;}

    /**
     * Whether the tag is present, whatever its value. A tag set to `false` or `undefined` still counts as present.
     * @param tagName The tag to look for.
     */
    hasTag(tagName:string){return (tagName in this._nodeTags);}

    /**
     * The value stored under the tag, or `undefined` if the tag is absent.
     * @param tagName The tag to read.
     */
    getTagValue(tagName:string){return this._nodeTags[tagName];}

    /**
     * Removes the tag. Does nothing if the tag is absent.
     * @param tagName The tag to remove.
     */
    removeTag(tagName:string){delete this._nodeTags[tagName];}
    //</editor-fold>
    //###############################################\\--Tags--//###############################################

    //###############################################//--Control Panel--\\###############################################
    //<editor-fold desc="Control Panel">
    /**
     * This instance's own control-panel controls, or `undefined` if it exposes none. A subclass overrides this so
     * that scene code (for example, a "selected object" panel) can ask any node for its controls without checking
     * which class it is.
     */
    getInstanceControlSpecGroup(): AControlSpecGroup | undefined {
        return undefined;
    }

    /**
     * This class's class-wide control-panel controls (shared by every instance, unlike
     * `getInstanceControlSpecGroup`), or `undefined` if it exposes none. It is static, so call it on the concrete
     * class, or reach an instance's class with
     * `(someInstance.constructor as typeof ANodeModel).getClassControlSpecGroup()`.
     */
    static getClassControlSpecGroup(): AControlSpecGroup | undefined {
        return undefined;
    }
    //</editor-fold>
    //###############################################\\--Control Panel--//###############################################


    //###############################################//--Listeners--\\###############################################
    //<editor-fold desc="Listeners">
    /**
     * Initializes an empty tag dictionary and geometry set, makes the node visible, binds `signalGeometryUpdate` and
     * `signalTransformUpdate` to this instance (so they can be passed directly as callbacks), and turns on
     * `autoTransformUpdate`. `pickable` (true) and `renderOrder` (0) get their defaults from their property initializers.
     * @param args Ignored. Accepted so that subclasses can forward arbitrary constructor arguments to `super`.
     */
    constructor(...args:any[]) {
        super();
        this._nodeTags = {};
        this._geometry = new AGeometrySet();
        this._visible = true;
        this.signalGeometryUpdate = this.signalGeometryUpdate.bind(this);
        this.signalTransformUpdate = this.signalTransformUpdate.bind(this);
        this.autoTransformUpdate = true;
    }

    /**
     * Registers a callback for `TRANSFORM_UPDATE` events. It hears both the automatic events sent on every transform
     * edit while `autoTransformUpdate` is on (nested edits included) and explicit `signalTransformUpdate()` calls,
     * so it also works for nodes with `autoTransformUpdate` off.
     * @param callback Called with the node when its transform changes, and a second argument `automatic` that is
     * true when the event was sent automatically.
     * @param handle Optional identifier for the callback; a unique one is generated if omitted.
     * @param synchronous Ignored: it is accepted to match `addStateKeyListener` but is not forwarded, because
     * `addEventListener` has no such option.
     * @returns The callback switch. Pass it to `subscribe` so it is cleaned up with the node, or deactivate it directly.
     */
    addTransformListener(callback:(self:AObject, automatic?:boolean)=>void, handle?:string, synchronous:boolean=true):ACallbackSwitch{
        return this.addEventListener(ANodeModel.NodeModelEvents.TRANSFORM_UPDATE, callback, handle);
    }
    /**
     * Signals `TRANSFORM_UPDATE` to listeners, passing this node, whatever `autoTransformUpdate` is set to.
     * - With `autoTransformUpdate` off, call it after a batch of transform edits to redraw the node's views once.
     * - With it on, transform edits already signal, so you don't need to call this. An extra call is harmless (views
     *   redraw the transform again). It is still useful when something a view's transform depends on changes outside
     *   the transform state.
     *
     * To end a batch in code that should work with either setting, use `flushTransformUpdate()`.
     * It is bound to the instance in the constructor.
     */
    signalTransformUpdate(){
        this.signalEvent(ANodeModel.NodeModelEvents.TRANSFORM_UPDATE, this);
    }

    /**
     * Signals `TRANSFORM_UPDATE` only if `autoTransformUpdate` is off (with it on, the edits have already signaled).
     * Call it at the end of a batch of transform edits in code that should work with either setting.
     */
    flushTransformUpdate(){
        if(!this.autoTransformUpdate){
            this.signalTransformUpdate();
        }
    }

    /**
     * Signals `TRANSFORM_UPDATE` from the `autoTransformUpdate` listener, with `automatic = true` as the event's
     * second argument so that listeners can tell it from an explicit `signalTransformUpdate()` call.
     */
    protected _signalAutomaticTransformUpdate(){
        this.signalEvent(ANodeModel.NodeModelEvents.TRANSFORM_UPDATE, this, true);
    }

    /**
     * Registers a callback for `GEOMETRY_UPDATE` events, signaled by `signalGeometryUpdate` (for example whenever
     * `setVerts` is called on an `ANodeModelSubclass`). Views use this to rebuild their graphics.
     * @param callback Called with the node when its geometry changes.
     * @param handle Optional identifier for the callback; a unique one is generated if omitted.
     * @param synchronous Ignored (see `addTransformListener`).
     * @returns The callback switch. Pass it to `subscribe` so it is cleaned up with the node, or deactivate it directly.
     */
    addGeometryListener(callback:(self:AObject)=>void, handle?:string, synchronous:boolean=true){
        return this.addEventListener(ANodeModel.NodeModelEvents.GEOMETRY_UPDATE, callback, handle);
    }

    /**
     * Signals `GEOMETRY_UPDATE` to listeners, passing this node. Call it after changing the node's vertices in place
     * (for example `node.verts.position.setAt(...)`); geometry edits are not detected automatically. `setVerts`
     * calls it for you. It is bound to the instance in the constructor.
     */
    signalGeometryUpdate(){
        this.signalEvent(ANodeModel.NodeModelEvents.GEOMETRY_UPDATE, this);
    }

    /**
     * Registers a callback for `RENDER_ORDER_UPDATE` events, signaled when `renderOrder` is set.
     * @param callback Called with the node when its render order changes.
     * @param handle Optional identifier for the callback; a unique one is generated if omitted.
     * @param synchronous Ignored (see `addTransformListener`).
     * @returns The callback switch. Pass it to `subscribe` so it is cleaned up with the node, or deactivate it directly.
     */
    addRenderOrderListener(callback:(self:AObject)=>void, handle?:string, synchronous:boolean=true){
        return this.addEventListener(ANodeModel.NodeModelEvents.RENDER_ORDER_UPDATE, callback, handle);
    }

    /** Signals `RENDER_ORDER_UPDATE` to listeners, passing this node. The `renderOrder` setter calls it. */
    signalRenderOrderUpdate(){
        this.signalEvent(ANodeModel.NodeModelEvents.RENDER_ORDER_UPDATE, this)
    }


    /**
     * Registers a callback that runs whenever `visible` changes. This is a state-key listener on `_visible`, so
     * there is no separate visibility event to signal.
     * @param callback Called with the node when its visibility changes.
     * @param handle Optional identifier for the callback; a unique one is generated if omitted.
     * @param synchronous Whether the callback runs synchronously or may be batched (forwarded to `addStateKeyListener`).
     * @returns The callback switch. Pass it to `subscribe` so it is cleaned up with the node, or deactivate it directly.
     */
    addVisibilityListener(callback:(self:AObject)=>void, handle?:string, synchronous:boolean=true){
        return this.addStateKeyListener("_visible", callback, handle, synchronous);
    }
    //</editor-fold>
    //###############################################\\--Listeners--//###############################################

    //###############################################//--Material Updates--\\###############################################
    //<editor-fold desc="Material Updates">
    /**
     * Registers a callback for the current material's `UPDATE` events, which the node re-emits (see
     * `setMaterialUpdateSubscriptions`). It fires when the material's values change. To hear about the material being
     * replaced instead, use `addMaterialChangeListener`.
     *
     * Because the node listens to the material itself, several nodes can share one material, and each hears about
     * changes to it no matter where in the code the material is changed.
     * @param callback Called with the arguments the node forwards from the material (see `onMaterialUpdate`).
     * @param handle Optional identifier for the callback; a unique one is generated if omitted.
     * @returns The callback switch.
     */
    addMaterialUpdateListener(callback:(...args:any[])=>void, handle?:string){
        return this.addEventListener(AMaterial.Events.UPDATE, callback, handle);
    }
    /**
     * Registers a callback for `CHANGE` events, which signal that the node's material was replaced (see
     * `setMaterial`). To hear about changes to the current material's values, use `addMaterialUpdateListener`.
     * @param callback Called when the node's material is replaced.
     * @param handle Optional identifier for the callback; a unique one is generated if omitted.
     * @returns The callback switch.
     */
    addMaterialChangeListener(callback:(...args:any[])=>void, handle?:string){
        return this.addEventListener(AMaterial.Events.CHANGE, callback, handle);
    }

    /**
     * Signals `AMaterial.Events.CHANGE`, meaning the node's material was replaced. Despite the name, this is not an
     * `UPDATE` event: `UPDATE` events come from the material itself and are forwarded by `onMaterialUpdate`.
     * `setMaterial` calls this after installing a new material.
     */
    signalMaterialUpdate(){
        this.signalEvent(AMaterial.Events.CHANGE);
    }

    /**
     * Subscribes to the current material's `UPDATE` events and forwards them through `onMaterialUpdate`, so that
     * listeners added with `addMaterialUpdateListener` keep firing when the material's values change. The
     * subscription is registered under a fixed handle, so calling this again replaces the previous one (logging a
     * warning if the old one is still active). Requires a material: it dereferences `this.material`.
     */
    setMaterialUpdateSubscriptions(){
        const self = this;
        this.subscribe(this.material.addEventListener(AMaterial.Events.UPDATE, (...args:any[])=>{
            self.onMaterialUpdate(AMaterial.Events.UPDATE, ...args)
        }), MATERIAL_UPDATE_SUBSCRIPTION_HANDLE);
    }
    /**
     * Re-emits the material's `UPDATE` event from this node, passing `args` through unchanged. The subscription made
     * by `setMaterialUpdateSubscriptions` passes `AMaterial.Events.UPDATE` as the first argument, so listeners receive
     * the event name followed by whatever values the material signaled. Subclasses can override this to react to
     * material updates.
     * @param args The arguments to forward to `UPDATE` listeners.
     */
    onMaterialUpdate(...args:any[]){
        this.signalEvent(AMaterial.Events.UPDATE, ...args);
    }

    /**
     * Sets the node's material. Does nothing if `material` is already the current material (no event is signaled).
     * Otherwise it releases the previous material (see `_disposeMaterial`), stores the new one, subscribes to its
     * update events, and signals a material change. Note that releasing disposes the old material, so replacing a
     * material that other nodes still share will affect them too.
     * @param material The material to use.
     * @throws Error if `material` is a string: looking materials up by name is not implemented.
     */
    setMaterial(material:AMaterial|string){
        if(this.material === material){
            return;
        }else{
            let amaterial:AMaterial;
            if(material instanceof AMaterial){
                amaterial=material;
            }else{
                throw new Error("Material from string not implemented yet. Should look up in MaterialManager.")
            }

            if(this.material){
                this._disposeMaterial()
            }
            this._material = amaterial;
            this.setMaterialUpdateSubscriptions();
        }
        this.signalMaterialUpdate();
        // this.signalEvent(AMaterial.Events.CHANGE)
    }

    /**
     * Removes the material-update subscription and releases the current material, which disposes its underlying
     * three.js material. `setMaterial` calls it before replacing the material.
     * @throws Error if the material-update subscription is not registered.
     */
    _disposeMaterial(){
        this.unsubscribe(MATERIAL_UPDATE_SUBSCRIPTION_HANDLE);
        this.material.release();
    }
    //</editor-fold>
    //###############################################\\--Material Updates--//###############################################

    /**
     * Hook for advancing time-dependent state (animation, particles, and so on). The base implementation does
     * nothing. Nothing calls it automatically: your scene model must call it on the nodes it wants updated,
     * typically from its own `timeUpdate`. Subclasses override it and should call `super.timeUpdate(t, ...args)`.
     * @param t The current time, typically the scene model's clock time.
     * @param args Any additional arguments the caller passes through.
     */
    timeUpdate(t:number, ...args:any[]){

    }

    /**
     * The clock of the scene this node is in: the `clock` of the scene model that holds the node's model graph.
     * This is the clock whose time scene models pass to `timeUpdate`. Undefined while the node isn't in a scene.
     */
    get sceneClock():AClock|undefined{
        const sceneModel = this.getRootModel()?.parent as {clock?:unknown}|null|undefined;
        const clock = sceneModel?.clock;
        return (clock instanceof AClock)? clock : undefined;
    }

    /**
     * Runs an animation on this node over a fixed amount of time. Calls `callback(progress)` on every tick of the
     * scene's clock for `duration` seconds, with `progress` going from 0 to 1 (reshaped by `tween`, if given). The last
     * call is always with the final progress (1, or `tween.eval(1)`), so the animation ends exactly at its end state.
     * Then `actionOverCallback` runs.
     *
     * The action belongs to this node: releasing the node stops it, and `this.unsubscribe(handle)` cancels it. If you
     * provide a handle, the action will not start while one with the same handle is still running on this node. That
     * keeps a second click from restarting an animation that's already playing. To restart it instead, cancel the
     * running one first (`if(this.hasSubscription(handle)){this.unsubscribe(handle);}`).
     *
     * If the callback sets something that `timeUpdate` also sets every frame (such as the node's rotation), have the
     * callback set a field instead and let `timeUpdate` combine it with the rest, so one doesn't overwrite the other.
     *
     * The node must be in a scene, since the action runs on the scene's clock. Add it with `sceneModel.addNode(node)`
     * (or as a child of a node that is in the scene) first; calling this from a constructor throws.
     * @param callback called with the action's progress on every tick
     * @param duration how long the action lasts, in seconds (of scene clock time)
     * @param actionOverCallback called once when the action finishes (not when it is canceled)
     * @param tween an optional easing curve applied to the progress
     * @param handle an optional name for the action, used to avoid running two copies at once or to cancel it
     * @returns the action's handle, or `undefined` if an action with `handle` is already running
     * @throws Error if the node isn't in a scene
     */
    addTimedAction(callback: (actionProgress: number) => any, duration: number, actionOverCallback?: CallbackType, tween?: BezierTween, handle?: string){
        const clock = this.sceneClock;
        if(clock === undefined){
            throw new Error(`addTimedAction was called on ${this.constructor.name} "${this.name}", which isn't in a scene yet. Timed actions run on the scene's clock, so add the node to the scene (sceneModel.addNode(node)) before calling addTimedAction.`);
        }
        return clock.addTimedActionTo(this, callback, duration, actionOverCallback, tween, handle);
    }



}

