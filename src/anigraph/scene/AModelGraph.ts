import {SceneGraphEvents} from "../basictypes";
import {AModel, AModelInterface, AObjectNode} from "../base";
import {HasModelMap, MVMModelMap} from "../base";
import {AObjectNodeEvents} from "../base";
import {ANodeModel} from "./nodeModel";

/** Subscription handles a model graph uses for its own listeners on scene-graph events. */
export enum ASCENEMODEL_EVENT_HANDLES{
    SCENE_NODE_ADDED="SCENE_NODE_ADDED",
    SCENE_NODE_REMOVED="SCENE_NODE_REMOVED",
    SCENE_NODE_RELEASED="SCENE_NODE_RELEASED",
    SCENE_CHILD_REMOVED="SCENE_CHILD_REMOVED",
    /** Prefix for the graph's per-model watch on each registered model's own `RELEASE` event. */
    SCENE_NODE_RELEASE_WATCH="SCENE_NODE_RELEASE_WATCH"
}

/**
 * The root of a scene graph on the model side. A scene model owns one or more model graphs (see
 * {@link ASceneModel.modelGraph}); top-level nodes added with `sceneModel.addNode(node)` become children of the main
 * one, so their `parent` is the model graph.
 *
 * The graph keeps a map of every model anywhere below it (`modelMap`) and signals `SceneGraphEvents.NodeAdded`,
 * `NodeRemoved`, and `NodeReleased` as models join, leave a parent, or are released. Scene views listen to these
 * events to create and remove node views.
 */
export class AModelGraph extends AModel implements HasModelMap{
    protected _modelMap:MVMModelMap={};
    /** Map from model uid to model for every model registered anywhere in this graph. */
    get modelMap(){
        return this._modelMap;
    }

    /** Always true: a model graph is the root of its scene graph. */
    get isSceneGraphRoot(){
        return true;
    }

    /** Returns this graph. */
    getModelGraph():AModelGraph{
        return this;
    }

    constructor(name?:string) {
        super(name);
        this._initSceneGraphSubscriptions();
    }


    /** Returns true if `model` is registered in this graph. */
    hasModel(model:AModelInterface){
        return (model.uid in this.modelMap);
    }

    /** Returns true if a model with uid `modelID` is registered in this graph. */
    hasModelID(modelID:string){
        return (modelID in this.modelMap);
    }

    /**
     * Same as `addChild`. Provided so adding a node to a model graph looks the same as adding one to a scene model
     * ({@link ASceneModel.addNode}).
     */
    addNode(node:AObjectNode, position?:number, ...args:any[]): void {
        this.addChild(node, position, ...args);
    }

    /**
     * Adds the model to the model map if it isn't already in there, then signals that a node has been added.
     *
     * The first time a model is registered, the graph also subscribes to that model's own `RELEASE` event, so the
     * model is cleaned up (`_releaseModel`) whenever it is released -- including after it has been detached from
     * the graph, when the `DescendantReleased` event `AObjectNode.release()` signals on its ancestors can no longer
     * reach this graph.
     *
     * `NodeAdded` is signaled every time, even for a model that is already registered (for example, one being
     * reparented within the graph). Its listeners treat a repeat as a no-op.
     * @param model
     * @private
     */
    _addModel(model:AModelInterface, ...args:any[]){
        if(!this.hasModel(model)){
            this.modelMap[model.uid]=model;
            this._watchForRelease(model);
        }
        this.signalEvent(SceneGraphEvents.NodeAdded, model, ...args);
    }

    /** Subscription handle for the graph's watch on one model's own `RELEASE` event. */
    protected _releaseWatchHandle(model:AModelInterface){
        return `${ASCENEMODEL_EVENT_HANDLES.SCENE_NODE_RELEASE_WATCH}:${model.uid}`;
    }

    /**
     * Subscribes to `model`'s own `RELEASE` event (fired by `AModel.release()`), so the graph hears about the
     * release however the model was removed or reparented beforehand. Plain `AObjectNode`s that aren't `AModel`s
     * never fire `RELEASE`; they are still cleaned up through `DescendantReleased` while attached.
     * @param model
     * @protected
     */
    protected _watchForRelease(model:AModelInterface){
        const handle = this._releaseWatchHandle(model);
        if(this.hasSubscription(handle)){
            this.unsubscribe(handle);
        }
        this.subscribe((model as unknown as AObjectNode).addEventListener(AModel.AModelEvents.RELEASE, ()=>{
            this._releaseModel(model);
        }), handle);
    }
    /**
     * Signals `NodeRemoved` for a model that was removed from its parent. The model stays in the model map, since it
     * may just be moving to a new parent; it is removed from the map when it is released (`_releaseModel`).
     */
    _removeModel(model:AModelInterface){
        // delete this._modelMap[model.uid];
        this.signalEvent(SceneGraphEvents.NodeRemoved, model);
    }

    /**
     * Removes a released model from the model map, stops watching it, and signals `NodeReleased`.
     *
     * Safe to call more than once for the same model: a model released while still in the graph reaches this
     * first through `DescendantReleased` and then again through its own `RELEASE` event, and only the first call
     * does anything. Keeping the `DescendantReleased` path preserves the event order `AGLSceneView.onModelNodeRemoved`
     * relies on.
     * @param model
     */
    _releaseModel(model:AModelInterface){
        if(this.modelMap[model.uid] !== model){
            return;
        }
        delete this._modelMap[model.uid];
        const handle = this._releaseWatchHandle(model);
        if(this.hasSubscription(handle)){
            this.unsubscribe(handle);
        }
        this.signalEvent(SceneGraphEvents.NodeReleased, model);
    }

    /**
     * Subscribes to this graph's own descendant events (`DescendantAdded`, `DescendantRemoved`,
     * `DescendantReleased`) so models are registered, reported, and cleaned up as the graph changes. Called from the
     * constructor.
     */
    _initSceneGraphSubscriptions(){
        const self = this;
        this.subscribe(this.addEventListener(AObjectNodeEvents.DescendantAdded, (descendant:ANodeModel, ...args:any[])=>{
            this._addModel(descendant, ...args);
            // `AObjectNode._addChild` signals `DescendantAdded` only for the node being added, not for its own
            // descendants. A subtree built before it joined the graph would otherwise leave every node below its
            // root unregistered and without views. `getDescendantList()` is preorder, so each parent is registered
            // (and gets its view) before its children, which lets each child's view nest under its parent's.
            for(const d of descendant.getDescendantList()){
                this._addModel(d as unknown as AModelInterface, ...args);
            }
        }), ASCENEMODEL_EVENT_HANDLES.SCENE_NODE_ADDED);

        this.subscribe(this.addEventListener(AObjectNodeEvents.DescendantRemoved, (descendant:ANodeModel)=>{
            self._removeModel(descendant);
        }), ASCENEMODEL_EVENT_HANDLES.SCENE_NODE_REMOVED);

        this.subscribe(this.addEventListener(AObjectNodeEvents.DescendantReleased, (descendant:ANodeModel)=>{
            self._releaseModel(descendant);
        }), ASCENEMODEL_EVENT_HANDLES.SCENE_NODE_RELEASED);
    }


}



