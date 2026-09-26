import * as THREE from "three";
import {AController} from "../base/amvc/AController";
import {
    AModelInterface, AObjectState,
    AView,
    HasModelViewMap,
    SceneControllerInterface
} from "../base";
import type {HasInteractionModeCallbacks, AInteractionEvent} from "../interaction";
import {ASceneInteractionMode} from "./interactionmodes/ASceneInteractionMode";
import {AModelGraph} from "./AModelGraph";
import {ClassInterface} from "../basictypes";
import {ARenderContext, ARenderWindow} from "../rendering";
import {ASceneModel} from "./ASceneModel";
import {ASceneView} from "./ASceneView";
import {ACameraView, CameraModelInterface} from "./camera";
import {ANodeModel} from "./nodeModel";
import {ANodeView} from "./nodeView";
import {AModelViewClassMap, AMVClassSpecDetails} from "../base/amvc/AModelViewClassSpec";
import {Mutex} from "async-mutex";
import {Color} from "../math";

// Re-exported for backwards compatibility; the enum now lives with the base
// scene view so that ASceneView does not need to import the controller.
export {SceneControllerSubscriptions} from "./ASceneView";

/** Which rendering backend a scene controller uses. */
export enum ContextType {
    THREEJS = 'THREEJS',
    TWOJS = 'TWOJS',
}

/**
 * One hit: the node view that was hit, and a depth number whose meaning is
 * backend-specific (see `getNodeViewAtCursor`). Ordered front-to-back.
 */
export type HitList = [ANodeView, number][];

/** Something that holds a Three.js render target (or `null` for the canvas). */
export interface RenderTargetInterface {
    target: THREE.WebGLRenderTarget | null
}


/**
 * Base class for scene controllers, shared by the Three.js ({@link AGLSceneController}) and Two.js
 * ({@link ATwoJSSceneController}) backends.
 *
 * A scene controller connects a scene model ({@link ASceneModel}) to a render window. It creates one scene view per
 * model graph, maps model classes to view classes (`initModelViewSpecs`), runs the per-frame callback, and owns the
 * scene's interaction modes. It also provides picking (`getNodeViewAtCursor`, `getNodeModelAtCursor`) and cursor to
 * world conversion (`getWorldCoordinatesOfCursorEvent`).
 *
 * Initialization (`confirmInitialized`): the model initializes first, then `initSceneViews()`,
 * `initModelViewSpecs()`, and `initRendering()` run, and finally the controller's clock starts.
 */
export abstract class ASceneController extends AController implements HasModelViewMap, SceneControllerInterface {
    @AObjectState protected readyToRender: boolean;
    @AObjectState protected _isInitialized!: boolean;
    private _clearColor!: Color;
    _renderWindow!: ARenderWindow;
    protected _model!: ASceneModel;
    protected _initMutex: Mutex;
    protected _tabIndex: number = 0;

    // ── Abstract interface — each backend implements ──────────────────────────
    /** Which rendering backend this controller uses. */
    abstract get contextType(): ContextType;
    /** The scene view for the main model graph. */
    abstract get mainSceneView(): ASceneView;
    /** Same as `mainSceneView`. */
    abstract get view(): ASceneView;
    /** Returns the scene view with the given name (the main one if omitted). Throws if there is none. */
    abstract getSceneView(name?: string): ASceneView;
    /** Creates a scene view named `name` that shows `modelGraph`. */
    abstract createSceneView(name: string, modelGraph: AModelGraph): ASceneView;
    /** Calls `f` on every scene view. */
    abstract mapOverSceneViews(f: (view: ASceneView) => void): void;
    /** Subscribes every scene view to its model graph, creating views for nodes already in it. */
    abstract initViewSubscriptions(): void;
    /** Backend-specific rendering setup. Runs during `confirmInitialized`, after `initModelViewSpecs`. */
    abstract initRendering(): Promise<void>;
    /** Registers `viewClass` as the view to create for node models of class `modelClass`. */
    abstract addModelViewSpec(
        modelClass: ClassInterface<ANodeModel>,
        viewClass: ClassInterface<ANodeView>,
        details?: AMVClassSpecDetails
    ): void;
    /** Registers this scene's model class to view class mappings (call `addModelViewSpec` here). */
    abstract initModelViewSpecs(): void;
    /** Called by the render window once per animation frame. */
    abstract onAnimationFrameCallback(context: ARenderContext): void;
    /** Sets up this scene's interaction modes. Called from `initScene`. */
    abstract initInteractions(): void;

    /**
     * Hit-test `event`'s cursor position against pickable node views and return
     * the resulting hits, front-to-back, as a `HitList`.
     *
     * Each candidate hit **bubbles up** past any ancestor that disqualifies it
     * (non-pickable on both backends; also invisible on Two.js, where visibility
     * isn't free -- see the Two.js implementation) to the nearest ancestor node
     * view that *is* pickable, and reports a hit on that ancestor. A pickable
     * parent group therefore "catches" clicks landing on its own non-pickable
     * children, rather than letting them pass through to whatever is behind the
     * whole group. Only if no ancestor up to the scene root qualifies does that
     * candidate contribute nothing, and the search continues to farther
     * candidates. Bubbled hits are deduped, so a node reached via more than one
     * underlying candidate (multiple registered graphics, or multiple
     * non-pickable children bubbling to the same parent) appears once.
     *
     * @param firstPickOnly When true (default), stop as soon as one hit
     * qualifies, so the returned list has at most one entry. When false,
     * collect every distinct qualifying ancestor, front-to-back.
     *
     * The depth number in each tuple is a `THREE.Raycaster` intersection
     * distance on Three.js (a real, comparable world-space value) and a
     * front-to-back index into `document.elementsFromPoint`'s result on Two.js
     * (an order, not a metric distance -- Two.js has no z-depth to report).
     *
     * Three.js: THREE.Raycaster against the scene graph. Two.js: DOM hit-testing
     * via document.elementsFromPoint, resolved back to a view.
     */
    abstract getNodeViewAtCursor(event: AInteractionEvent, firstPickOnly?: boolean): HitList;

    // ── Basic getters ─────────────────────────────────────────────────────────
    /** True once `confirmInitialized` has finished setting up views and rendering. */
    get isInitialized() { return this._isInitialized; }
    /** The color the canvas is cleared to. Change it with `setClearColor`. */
    get clearColor() { return this._clearColor; }
    get tabIndex() { return this._tabIndex; }
    /** Mutex that keeps controller initialization from running twice at once. */
    get initMutex() { return this._initMutex; }
    /** True once `initRendering` has finished. */
    get isReadyToRender(): boolean { return this.readyToRender; }
    /** The render window this controller draws into. */
    get renderWindow(): ARenderWindow { return this._renderWindow; }
    /** The render window's rendering context. */
    get context(): ARenderContext { return this._renderWindow.context; }
    /** Returns this controller. */
    get sceneController() { return this; }
    /** The rendering context's DOM element. */
    get eventTarget(): HTMLElement { return this.context.domElement; }
    /** The scene model this controller shows. */
    get model(): ASceneModel { return this._model as ASceneModel; }
    /** The scene model's `modelMap` (every model in its main model graph). */
    get modelMap() { return this.model.modelMap; }

    /**
     * Convenience wrapper over `getNodeViewAtCursor`: always asks for just the
     * frontmost qualifying hit and unwraps it to a single model. Callers who
     * want the full `HitList`, or all hits via `firstPickOnly = false`, call
     * `getNodeViewAtCursor` directly.
     */
    getNodeModelAtCursor(event: AInteractionEvent): ANodeModel | undefined {
        return this.getNodeViewAtCursor(event, true)[0]?.[0].model;
    }

    /**
     * Returns `event`'s cursor as a world-space point, computed with the scene's main camera
     * (`model.cameraModel.ndcToWorld`), or `undefined` if the event has no cursor position. This accounts for the
     * camera's pan and zoom, so use it rather than scaling `event.ndcCursor` yourself. Works on both backends.
     *
     * A multi-pass Three.js scene that wants a specific pass's camera should use
     * {@link ARenderPass.worldPointAtCursor} instead.
     */
    getWorldCoordinatesOfCursorEvent(event: AInteractionEvent) {
        if (event.ndcCursor) {
            return this.model.cameraModel.ndcToWorld(event.ndcCursor);
        } else {
            return undefined;
        }
    }

    /**
     * Creates one scene view (with the backend-specific `createSceneView`) for each model graph on the scene model,
     * named after the graph.
     */
    initSceneViews(): void {
        const modelGraphs = this.model.modelGraphs;
        for (const graphName in modelGraphs) {
            this.createSceneView(graphName, modelGraphs[graphName]);
        }
    }

    // ── Camera ─────────────────────────────────────────────────────────────────
    // Kept here so ASceneInteractionMode (typed to ASceneController) can access them.
    /**
     * The view for the scene's camera model. Only meaningful for backends that
     * create camera views (Three.js); Two.js scenes register no camera view,
     * so do not use this in backend-agnostic code — use `cameraModel` instead.
     */
    get cameraView(): ACameraView {
        return this.mainSceneView.getViewListForModel(this.model.cameraModel)[0] as ACameraView;
    }
    /**
     * The scene's camera model, straight from the scene model. Does not depend
     * on a camera view existing, so it is safe for all backends (and for
     * interaction modes, which access the camera through this getter).
     */
    get cameraModel(): CameraModelInterface & ANodeModel {
        return this.model.cameraModel;
    }

    // ── HasModelViewMap delegation ────────────────────────────────────────────
    // These forward to the main scene view (`view`) or the scene model.
    classMap: AModelViewClassMap;

    get viewMap() { return this.view.viewMap; }
    hasView(view: AView) { return this.view.hasView(view); }
    addView(view: ANodeView) { this.view.addView(view); }
    removeView(view: AView) { this.view.removeView(view); }
    disposeViews() { this.view.disposeViews(); }
    getViewListForModel(model: AModelInterface) { return this.view.getViewListForModel(model); }
    hasModel(model: AModelInterface) { return this.model.hasModel(model); }

    /** Always throws. Scene views create node views now (see `ASceneView.addModelViewSpec`). */
    createViewForNodeModel(nodeModel: ANodeModel, ...args: any[]): ANodeView {
        throw new Error("This should not be called anymore.");
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    constructor(model: ASceneModel) {
        super();
        this._clearColor = new Color(0.0, 0.0, 0.0);
        this._initMutex = new Mutex();
        this._isInitialized = false;
        this.readyToRender = false;
        this.classMap = new AModelViewClassMap();
        if (model) {
            this.setModel(model);
        }
    }

    /** Sets the render window this controller draws into, and clears any existing interaction modes. */
    setRenderWindow(renderWindow: ARenderWindow) {
        this._renderWindow = renderWindow;
        this.clearAllInteractionModes();
    }

    /**
     * Creates a new {@link ASceneInteractionMode} with the given callbacks and registers it under `name`. Throws if a
     * mode with that name already exists. Works on both backends; activate it with `setCurrentInteractionMode(name)`.
     */
    createNewInteractionMode(
        name: string,
        interactionCallbacks?: HasInteractionModeCallbacks
    ) {
        if (this._interactions.modes[name]) {
            throw new Error(`Tried to create interaction mode "${name}", but mode with this name is already defined!`)
        }
        let newInteractionMode = new ASceneInteractionMode(name, this, interactionCallbacks);
        this.defineInteractionMode(name, newInteractionMode);
    }

    /** Sets the color the canvas is cleared to, and clears the canvas with it. */
    setClearColor(color: Color) {
        this._clearColor = color;
        this.context.setClearColor(this.clearColor);
        this.context.clear();
    }

    /** Clears the canvas to `clearColor` and calls `initInteractions()`. Runs from `initRendering`. */
    async initScene() {
        this.context.setClearColor(this.clearColor);
        this.context.clear();
        this.initInteractions();
    }

    /** Hook that backends call just before `initScene()` during `initRendering`. Does nothing by default. */
    _beforeInitScene(...args: any[]) {}

    /** Resizes the rendering context to the render window's container and tells the scene model about the new size. */
    onWindowResize(renderWindow?: ARenderWindow): void {
        if (renderWindow && renderWindow.container !== undefined) {
            this.context.setSize(renderWindow.container.clientWidth, renderWindow.container.clientHeight);
            this.model.onContextResize(this.context);
        }
    }

    /**
     * Initializes the controller: waits for the scene model's `confirmInitialized()` (which includes an async
     * `initScene`), then runs `initSceneViews()`, `initModelViewSpecs()`, and `initRendering()`, sets
     * `isInitialized`, and starts the clock. The returned promise resolves when all of that has finished.
     */
    async confirmInitialized(): Promise<void> {
        const self = this;
        await self.model.confirmInitialized();
        await self.initMutex.runExclusive(async () => {
            self.initSceneViews();
            self.initModelViewSpecs();
            await self.initRendering();
            self._isInitialized = true;
            self._clock.play();
        });
    }

    /** Sets the scene model. If a different model was already set, this controller's subscriptions and views are released first. */
    setModel(model: ASceneModel) {
        if (this._model && this._model !== model) {
            this._unSetModel();
        }
        this._model = model;
    }

    protected _unSetModel() {
        this.clearSubscriptions();
        this.view.release();
    }
}
