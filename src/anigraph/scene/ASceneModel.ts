import {AModel, AModelInterface} from "../base/amvc/AModel";
import {AObject, AObjectNode, AObjectState} from "../base/aobject";
import {ASerializable} from "../base/aserial";
import {ANodeModel} from "./nodeModel";
import {HasModelMap} from "../base/amvc/AModelViewMap";
import {CameraModelInterface} from "./camera";
import {BezierTween} from "../geometry";
import {ACallbackSwitch} from "../base";
import {
    CallbackType
} from "../basictypes";
import {AClock} from "../time/AClock";
import {v4 as uuidv4} from "uuid";

import {Mutex} from 'async-mutex';
import {ConfirmInitialized} from "./ConfirmInitialized";
import {AppState, GetAppState} from "../appstate";
import {ARenderContext, AShaderModel} from "../rendering";

import {AModelGraph} from "./AModelGraph";
import {SceneGraphEvents} from "../basictypes";
import {AssetManager} from "../fileio/AAssetManager";

/** Constants used by scene models and controllers. */
export const enum SCENE_MODEL_CONSTANTS{
    /** Name of the main model graph, and of the scene view / render pass that shows it. */
    MAIN_MODEL_GRAPH_KEY = "MAIN_MODEL_GRAPH"
}

// HasInteractions
/**
 * Base class for a scene's model: the root of the model side of the model-view-controller design.
 *
 * A scene model owns one or more {@link AModelGraph}s (the main one is `modelGraph`), which hold the scene's node
 * models. Add top-level nodes with `addNode(node)`; they become children of the main model graph. The scene model
 * also owns the scene's clock, its `cameraModel`, and the asynchronous initialization sequence (see
 * `confirmInitialized`). Subclasses implement `initCamera`, `initScene`, `initAppState`, and `timeUpdate`.
 */
@ASerializable("ASceneModel")
export abstract class ASceneModel extends AModel implements HasModelMap, ConfirmInitialized{
    static SceneEvents=SceneGraphEvents;
    @AObjectState protected _isInitialized!:boolean;
    /** The scene's main camera. Set it in `initCamera` and add it to the scene with `addNode`. */
    cameraModel!:CameraModelInterface & ANodeModel;
    _modelGraphs:{[name:string]:AModelGraph}={};

    /** All model graphs owned by this scene model, keyed by name. */
    get modelGraphs(){
        return this._modelGraphs;
    }

    // addChild(child: AObjectNode, position?: number, ...args:any[]): void {
    //     this.modelGraph.addChild(child, position, ...args);
    // }


    /**
     * Adds a top-level node to the scene by making it a child of the main model graph (`modelGraph`). The node's
     * parent is then the model graph, not the scene model. Use this instead of `addChild`, which throws on a scene
     * model.
     * @param child the node to add
     * @param position optional index among the model graph's children
     */
    addNode(child: AObjectNode, position?: number, ...args:any[]){
        this.modelGraph.addChild(child, position, ...args);
    }

    /**
     * Always throws. Only model graphs are direct children of a scene model; use `addNode` to add a node to the
     * scene (or `_addSceneChild` to add a model graph).
     */
    addChild(child: AObjectNode, position?: number, ...args:any[]): void {
        throw new Error(`Used "addChild" on ASceneModel class directly. This is likely a bug. Did you mean to call addNode (or, less likely, _addSceneChild)?`)
    }

    /**
     * Adds a direct child of the scene model (the inherited `addChild`). Only model graphs should be direct children;
     * `createModelGraph` uses this. Use `addNode` for everything else.
     * @private
     */
    _addSceneChild(child: AObjectNode, position?: number, ...args:any[]): void {
        super.addChild(child, position, ...args);
    }

    /** The main model graph, where `addNode` puts top-level nodes. */
    get modelGraph(){
        return this._modelGraphs[SCENE_MODEL_CONSTANTS.MAIN_MODEL_GRAPH_KEY];
    }
    /** The main model graph's map from model uid to model, covering every model in that graph. */
    get modelMap(){
        return this.modelGraph.modelMap;
    }
    /** Returns true if `model` is registered in the main model graph. */
    hasModel(model:AModelInterface){
        return (model.uid in this.modelMap);
    }
    /** Returns true if a model with uid `modelID` is registered in the main model graph. */
    hasModelID(modelID:string){
        return (modelID in this.modelMap);
    }

    /**
     * Creates a new, empty model graph with the given name and adds it as a direct child of this scene model.
     * Throws if a graph with that name already exists.
     * @returns the new model graph
     */
    createModelGraph(name:string){
        if(name in this._modelGraphs){
            throw new Error(`ModelGraph already exists: ${name}`);
        }
        this._modelGraphs[name]=new AModelGraph(name);
        let newModelGraph = this.getModelGraph(name);
        this._addSceneChild(newModelGraph);
        // this.addChild(newModelGraph)
        return newModelGraph;
    }

    /** Returns the model graph with the given name, or `undefined` if there is none. */
    getModelGraph(name:string):AModelGraph{
        return this._modelGraphs[name];
    }

    /** Creates the main model graph. Called from the constructor. */
    initModelGraphs(){
        this.createModelGraph(SCENE_MODEL_CONSTANTS.MAIN_MODEL_GRAPH_KEY);
    }


    protected _clock: AClock;
    protected _interactionDOMElement:EventTarget;
    protected _initMutex:Mutex;
    /** Mutex that makes sure initialization runs only once, even if `confirmInitialized` is called concurrently. */
    get initMutex(){
        return this._initMutex;
    }

    /** The `ACamera` wrapped by `cameraModel` (projection and pose math). */
    get camera(){
        return this.cameraModel.camera;
    }

    /** The DOM target for interactions. Defaults to `document`. */
    get eventTarget(){
        return this._interactionDOMElement;
    }

    /** The scene's clock. It starts playing when initialization finishes; timed actions run on it. */
    get clock() {
        return this._clock;
    }

    /**
     * A uniform scale factor relating normalized device coordinates (roughly ±1) to
     * scene/world coordinates. Backends that use a center-origin, NDC-derived world
     * space (e.g. `AppSceneModel2D`/`ATwoJSAppSceneModel`) use this to convert cursor
     * positions. Defaults to `GetAppState().globalScale`, cached on first access.
     */
    @AObjectState protected _sceneScale!:number;
    get sceneScale():number{
        if(this._sceneScale === undefined){
            this._sceneScale = GetAppState().globalScale;
        }
        return this._sceneScale;
    }

    /**
     * Builds the scene's content (creates nodes and adds them with `addNode`). Runs once during initialization,
     * after `initCamera`. Receives whatever arguments were passed to `confirmInitialized`. It may be `async` (for
     * example, to load textures or models first): initialization waits for it to finish before the scene counts as
     * initialized and its clock starts.
     */
    protected abstract initScene(...args:any[]):void|Promise<void>;

    /** Registers app state (for example, control-panel controls) this scene uses. Add control-panel controls here. */
    abstract initAppState(appState: AppState):void;

    /**
     * Creates `cameraModel` and adds it to the scene. Runs once during initialization, before `initScene`, and
     * receives whatever arguments were passed to `confirmInitialized`. A warning is printed if the camera model is not
     * in the scene graph afterward.
     */
    abstract initCamera(...args: any[]):void;
    /** Passes the render context's new size to `cameraModel.onCanvasResize`. Does nothing before `cameraModel` exists. */
    onContextResize(context: ARenderContext){
        // A window resize can fire (e.g. from DevTools opening) before async
        // initialization has run initCamera() and set cameraModel — both
        // AGLRenderWindow and ATwoJSRenderWindow register their resize listener
        // in the constructor, well before confirmInitialized() completes.
        if(!this.cameraModel) return;
        let shape = context.getShape();
        this.cameraModel.onCanvasResize(shape.x, shape.y);
    }

    /** Called once per animation frame to advance the scene (animation, simulation, etc.). */
    abstract timeUpdate(...args:any[]): void;

    /**
     * Runs initialization if it hasn't run yet: preloads assets (standard shaders), then calls `initCamera` and
     * `initScene`, sets `isInitialized` to true, and starts the clock. Safe to call more than once; only the first
     * call does the work. Scene controllers call this for you, so initialization usually happens lazily when the
     * first controller needs the model.
     * @param args passed on to `initCamera` and `initScene`
     */
    async confirmInitialized(...args:any[]){
        const self = this;
        await this.initMutex.runExclusive(async () => {
            if(!self._isInitialized){
                self._isInitialized = await self._asyncInitScene(...args);
                self._isInitialized = true;
                self._clock.play();
            }
        });
    }




    /**
     * The initialization steps run by `confirmInitialized`: `PreloadAssets`, `initCamera`, then `initScene` (awaited,
     * so an async `initScene` finishes first).
     * @returns a promise that resolves to true when done
     * @private
     */
    protected async _asyncInitScene(...args:any[]):Promise<boolean>{
        await this.PreloadAssets()
        this.initCamera(...args);
        if(!this.cameraModel || !this.cameraModel.isInSceneGraph){
            console.warn(`Camera model not added to scene!!!`)
        }
        // this.addNode(this.cameraModel);
        await this.initScene(...args);
        return true;
    }

    /** Loads the default RGBA, textured, and 2D textured shader materials into {@link AssetManager}. */
    async loadStandardShaders(){
        GetAppState(); // fails early, with a clear error, if the app state hasn't been created yet
        await AssetManager.loadShaderMaterialModel(AssetManager.DEFAULT_MATERIALS.RGBA_SHADER);
        await AssetManager.loadShaderMaterialModel(AssetManager.DEFAULT_MATERIALS.TEXTURED_SHADER);
        await AssetManager.loadShaderMaterialModel(AssetManager.DEFAULT_MATERIALS.TEXTURED2D_SHADER);
        (AssetManager.materials.getMaterialModel(AssetManager.DEFAULT_MATERIALS.TEXTURED2D_SHADER) as AShaderModel).setUniform("alpha", 1.0);

    }


    /** Loads assets needed before `initCamera`/`initScene` run. By default, loads the standard shaders. */
    async PreloadAssets(){
        await this.loadStandardShaders();
        // await this.materials.materialsLoadedPromise;
    }

    /** True once `confirmInitialized` has finished initializing the scene. */
    get isInitialized(){
        return this._isInitialized;
    }

    /** Adds a listener that fires when `isInitialized` is reassigned. */
    addIsInitializedListener(callback:(self:AObject)=>void, handle?:string, synchronous:boolean=true):ACallbackSwitch{
        return this.addStateKeyListener('_isInitialized', callback, handle, synchronous);
    }

    /** Adds a listener for the scene's `UpdateComponent` event (see `signalComponentUpdate`). */
    addComponentUpdateListener(callback:(self:AObject)=>void, handle?:string):ACallbackSwitch{
        return this.addEventListener(ASceneModel.SceneEvents.UpdateComponent, callback, handle);
    }

    /** Signals the scene's `UpdateComponent` event to listeners added with `addComponentUpdateListener`. */
    signalComponentUpdate(){
        this.signalEvent(ASceneModel.SceneEvents.UpdateComponent);
    }

    constructor(name?:string) {
        super(name);
        this._initMutex = new Mutex();
        this._isInitialized = false;
        this._clock = new AClock();
        this._interactionDOMElement = document;
        this.initModelGraphs();
    }

    // Camera setup helpers live in the dimension-specific subclasses: `AppSceneModel2D` (orthographic cameras) and
    // `AppSceneModel3D` (perspective cameras). `ASceneModel` itself only needs `cameraModel` and `initCamera`.

    /** Returns a control-panel spec with a text field for editing the scene's name. */
    getSceneModelControlSpec(){
        let self = this;
        return {
            Name: {
                value: self.name,
                onChange: (v: string) => {
                    self.name = v;
                }
            },
        }
    }

    /**
     * Adds a listener for nodes added to the main model graph (`SceneGraphEvents.NodeAdded`). The callback receives
     * the added node. It can fire again for a node that is already in the graph (for example, one being reparented).
     */
    addNodeAddedListener(callback: (...args: any[]) => void, handle?: string){
        return this.modelGraph.addEventListener(SceneGraphEvents.NodeAdded, callback, handle)
    }

    /**
     * Adds a listener for nodes removed from a parent in the main model graph (`SceneGraphEvents.NodeRemoved`). This
     * also fires when a node is reparented, so use `addNodeReleasedListener` to detect deletion.
     */
    addNodeRemovedListener(callback: (...args: any[]) => void, handle?: string){
        return this.modelGraph.addEventListener(SceneGraphEvents.NodeRemoved,callback, handle)
    }

    /** Adds a listener for nodes released (deleted) from the main model graph (`SceneGraphEvents.NodeReleased`). */
    addNodeReleasedListener(callback: (...args: any[]) => void, handle?: string){
        return this.modelGraph.addEventListener(SceneGraphEvents.NodeReleased,callback, handle)
    }


    // Point-light helpers live in `AppSceneModel3D`, since point lights are 3D-only nodes.


    /** Calls `fn` on every node model in the scene (see `getNodeModels`) and returns the results as a list. */
    mapOverNodeModels(fn:(descendant:ANodeModel)=>any[]|void){
        let nodeModelDescendants = this.getNodeModels();
        return nodeModelDescendants.map(fn);
    }

    /**
     * Returns every {@link ANodeModel} in the scene, in every model graph, including nested children and the camera
     * model. Nodes added with `addNode` are in here.
     */
    getNodeModels(){
        let rlist = [];
        let allDescendants = this.getDescendantList();
        for(let c of allDescendants){
            if(c instanceof ANodeModel){
                rlist.push(c);
            }
        }
        return rlist;
    }

    /**
     * Returns every node model in the scene that is an instance of `ctor` (a filter over `getNodeModels()`). The list
     * is computed fresh on each call, so it always reflects the nodes currently in the scene; a released node is gone
     * immediately. Cost is proportional to the number of nodes in the scene.
     *
     * `ctor` may be an abstract class, since `instanceof` works with any constructor.
     * @example
     * const lights = sceneModel.getNodesOfType(APointLightModel3D);
     */
    getNodesOfType<T extends ANodeModel>(ctor: abstract new (...args: any[]) => T): T[] {
        return this.getNodeModels().filter((n): n is T => n instanceof ctor);
    }

    /**
     * Returns every node model in the scene that has the tag `tagName` (a filter over `getNodeModels()` using
     * `hasTag`). If `value` is given (and not `undefined`), only nodes whose tag value equals it (`===`) are returned. Like
     * `getNodesOfType`, the list is computed fresh on each call.
     * @example
     * const enemies = sceneModel.getNodesWithTag("enemy");
     * const redTeam = sceneModel.getNodesWithTag("team", "red");
     */
    getNodesWithTag(tagName: string, value?: any): ANodeModel[] {
        return this.getNodeModels().filter(n =>
            n.hasTag(tagName) && (value === undefined || n.getTagValue(tagName) === value)
        );
    }

    /**
     * Calls `handler(node)` whenever any node matching `predicate` signals `eventName`, for nodes in the scene now and
     * nodes added later. Useful for scenes that react to changes in a whole set of nodes (e.g. a ray tracer that
     * re-renders whenever any object changes).
     *
     * A node's subscription is removed when the node is released (deleted), not when it is merely removed from a
     * parent, so reparenting a node keeps its subscription (and does not duplicate it). Separate `bindNodeEvent` calls
     * use separate subscription handles, so they never overwrite each other.
     * @param predicate type guard that selects which nodes to listen to
     * @param eventName the node event to listen for
     * @param handler called with the node that signaled the event
     */
    bindNodeEvent<T extends ANodeModel>(
        predicate: (node: ANodeModel) => node is T,
        eventName: string,
        handler: (node: T) => void
    ): void {
        const self = this;
        const callID = uuidv4();
        const subscriptionHandle = (node: T) => `bindNodeEvent:${callID}:${eventName}:${node.uid}`;

        function bindNode(node: T) {
            const handle = subscriptionHandle(node);
            if (self.hasSubscription(handle)) {
                return;
            }
            self.subscribe(node.addEventListener(eventName, () => handler(node)), handle);
        }

        for (const node of this.getNodeModels()) {
            if (predicate(node)) {
                bindNode(node);
            }
        }

        this.addNodeAddedListener((node: ANodeModel) => {
            if (predicate(node)) {
                bindNode(node);
            }
        });

        this.addNodeReleasedListener((node: ANodeModel) => {
            if (predicate(node) && self.hasSubscription(subscriptionHandle(node))) {
                self.unsubscribe(subscriptionHandle(node));
            }
        });
    }

    /**
     * Returns every {@link ANodeModel} in one model graph, including nested children. `modelGraph` may be the graph
     * itself or its name; with no argument, uses the main model graph (`modelGraph`).
     * @param modelGraph the model graph, or its name
     * @returns the node models in that graph, in depth-first order
     */
    getNodeModelsForModelGraph(modelGraph?:AModelGraph|string, ...args: any[]):ANodeModel[]{
        let modelGraphObj = this.modelGraph;
        if(modelGraph instanceof AModelGraph){
            modelGraphObj = modelGraph;
        }else if(modelGraph !== undefined){
            modelGraphObj = this.getModelGraph(modelGraph);
        }
        // Keep only node models: a graph's descendants could in principle include other kinds of AObjectNode.
        return modelGraphObj.getDescendantList().filter((c): c is ANodeModel => c instanceof ANodeModel);
    }

    /**
     * Calls `callback(progress)` on every tick of the scene's clock for `duration` seconds, with `progress` going
     * from 0 to 1 (reshaped by `tween`, if given). The last call is always with progress 1, before
     * `actionOverCallback` runs, so the action ends exactly at its end state. See {@link AClock.addTimedActionTo}.
     *
     * If you provide a handle, then the action will not start so long as an existing subscription by that handle
     * exists. This means that you won't duplicate the action before one has finished previously. Call
     * `this.unsubscribe(handle)` to cancel it.
     * @param callback  what should be called at each update
     * @param duration  how long it will take, in clock time (seconds at the default clock rate)
     * @param actionOverCallback  what to run when completed
     * @param tween  an optional tween curve
     * @param handle  a handle to identify the timed action
     * @returns the action's handle, or `undefined` if an action with `handle` is already running
     */
    addTimedAction(callback: (actionProgress: number) => any, duration: number, actionOverCallback?: CallbackType, tween?: BezierTween, handle?: string) {
        return this._clock.addTimedActionTo(this, callback, duration, actionOverCallback, tween, handle);
    }
}





