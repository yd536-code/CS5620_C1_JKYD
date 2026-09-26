import * as THREE from "three";
import {ASceneController, ContextType, HitList} from "./ASceneController";
import {ASceneModel, SCENE_MODEL_CONSTANTS} from "./ASceneModel";
import {ASceneView} from "./ASceneView";
import {AGLSceneView, AGLSceneViewMap} from "./AGLSceneView";
import {ASceneViewsAndTargets} from "./ASceneViewsAndTargets";
import {AModelGraph} from "./AModelGraph";
import {ACameraModel3D, ACameraView} from "./camera";
import {ANodeModel} from "./nodeModel";
import {ANodeView} from "./nodeView";
import {AGLNodeView, AGL_NODE_VIEW_USERDATA_KEY} from "./nodeView/AGLNodeView";
import {ClassInterface} from "../basictypes";
import {AMVClassSpecDetails} from "../base/amvc/AModelViewClassSpec";
import {AGLContext} from "../rendering/context/AGLContext";
import {ARenderTarget} from "../rendering/target/ARenderTarget";
import {Quaternion} from "../math";
import {ALabel} from "../base";
import type {AInteractionEvent} from "../interaction";
import {ARenderPass, findPassAtCursor} from "./ARenderPass";
import type {AModelInterface} from "../base";

/**
 * Abstract scene controller for Three.js (WebGL) scenes.
 *
 * Adds render passes on top of {@link ASceneController}: an ordered list of {@link ARenderPass}es, each drawing a
 * scene view through a camera into a viewport. Every scene gets one full-canvas pass automatically
 * (`mainRenderPass`); add more for split screens, mini-maps, or HUDs. A frame is drawn by calling
 * `renderPasses(context)` from `onAnimationFrameCallback` (the starter's `ABasicSceneController` does this). Also
 * provides Three.js raycast picking and render targets.
 */
@ALabel("AGLSceneController")
export abstract class AGLSceneController extends ASceneController {
    static readonly contextType = ContextType.THREEJS;
    get contextType(): ContextType { return ContextType.THREEJS; }

    protected _sceneViewsAndTargets!: ASceneViewsAndTargets;
    _currentRenderTarget: ARenderTarget | null = null;

    // ── Render passes ─────────────────────────────────────────────────────────
    protected _renderPasses: ARenderPass[] = [];
    /** The controller's ordered render-pass list. A single-pass scene has exactly one entry here, created
     * automatically in `initRendering()` if nothing added one first -- see `_initDefaultRenderPassIfNone`. */
    get renderPassList(): ARenderPass[] {
        return this._renderPasses;
    }

    /** The main pass: the first pass in `renderPassList` (the automatic default pass, unless the scene added its own
     * passes first). `cameraView` and `getThreeJSCamera()` with no `pass` argument use this pass. Throws before
     * `initRendering()` has run. */
    get mainRenderPass(): ARenderPass {
        if (this._renderPasses.length === 0) {
            throw new Error("No render passes yet -- mainRenderPass is only available after initRendering() runs.");
        }
        return this._renderPasses[0];
    }

    /** Adds a render pass at the end of the list, or at index `position`. Passes draw in list order, so later passes
     * draw on top. */
    addRenderPass(pass: ARenderPass, position?: number): void {
        if (position === undefined) {
            this._renderPasses.push(pass);
        } else {
            this._renderPasses.splice(position, 0, pass);
        }
    }

    /** Adds a single full-canvas pass that draws `mainSceneView` through `model.cameraModel`, unless a pass was
     * already added (for example, in `initModelViewSpecs()`). Called once, from `initRendering()`. */
    protected _initDefaultRenderPassIfNone(): void {
        if (this._renderPasses.length > 0) return;
        this.addRenderPass(new ARenderPass({
            name: SCENE_MODEL_CONSTANTS.MAIN_MODEL_GRAPH_KEY,
            sceneView: this.mainSceneView,
            cameraModel: this.model.cameraModel,
        }));
    }

    /** Renders every visible pass in order, each into its own viewport with its own clear flags, then restores
     * the full-canvas viewport and turns scissor testing off, so whatever draws next doesn't inherit the last
     * pass's clipped region. The render target is left as the last pass set it. Called once per frame from
     * `onAnimationFrameCallback`. */
    renderPasses(context: AGLContext): void {
        for (const pass of this._renderPasses) {
            pass.render(context, this);
        }
        context.setScissorTest(false);
        const shape = context.getShape();
        context.setViewport(0, 0, shape.x, shape.y);
    }

    constructor(model: ASceneModel) {
        super(model);
        this._sceneViewsAndTargets = new ASceneViewsAndTargets();
    }

    /** The container holding this controller's scene views and render targets. */
    getSceneViewsAndTargets(): ASceneViewsAndTargets {
        return this._sceneViewsAndTargets;
    }

    /** All scene views, keyed by name (the main one is `SCENE_MODEL_CONSTANTS.MAIN_MODEL_GRAPH_KEY`). */
    get sceneViews(): AGLSceneViewMap {
        return this.getSceneViewsAndTargets().sceneViews;
    }

    private _getSceneView(name: string): AGLSceneView | undefined {
        return this.sceneViews.get(name);
    }

    /** The scene view for the main model graph. Throws if it hasn't been created yet. */
    get mainSceneView(): AGLSceneView {
        return this.getSceneView(SCENE_MODEL_CONSTANTS.MAIN_MODEL_GRAPH_KEY);
    }

    /** Returns the scene view with the given name (the main one if omitted). Throws if there is none. */
    getSceneView(name?: string): AGLSceneView {
        const key = name ?? SCENE_MODEL_CONSTANTS.MAIN_MODEL_GRAPH_KEY;
        const view = this._getSceneView(key);
        if (view) return view;
        throw new Error(`No scene view named ${key}`);
    }

    /** Same as `mainSceneView`. */
    get view(): AGLSceneView {
        return this.mainSceneView;
    }

    // initSceneViews is inherited from ASceneController; it calls createSceneView (below) once per model graph.

    /** Creates an {@link AGLSceneView} named `name` for `modelGraph`. Throws if the name is already taken. */
    createSceneView(name: string, modelGraph: AModelGraph): AGLSceneView {
        return this.getSceneViewsAndTargets().createSceneView(this, name, modelGraph) as AGLSceneView;
    }

    mapOverSceneViews(f: (view: ASceneView) => void): void {
        this.getSceneViewsAndTargets().mapOverSceneViews(f as (v: AGLSceneView) => void);
    }

    initViewSubscriptions(): void {
        this.mapOverSceneViews((view: ASceneView) => {
            view.initModelGraphSubscriptions();
        });
    }

    /**
     * Turns off the renderer's auto-clear (passes clear for themselves), adds the default render pass if none was
     * added, subscribes the scene views to their model graphs, then runs `_beforeInitScene` and `initScene`.
     */
    async initRendering(): Promise<void> {
        (this.context as AGLContext).setAutoClear(false);
        this.context.clear();
        this._initDefaultRenderPassIfNone();
        this.initViewSubscriptions();
        this._beforeInitScene(this.context);
        await this.initScene();
        this.readyToRender = true;
    }

    /** Registers a model class to view class mapping on the main scene view only. */
    addModelViewSpec(modelClass: ClassInterface<ANodeModel>, viewClass: ClassInterface<ANodeView>, details?: AMVClassSpecDetails): void {
        this.mainSceneView.addModelViewSpec(modelClass, viewClass, details);
    }

    // ── Render targets ────────────────────────────────────────────────────────
    /** Render targets added with `addRenderTarget`. */
    get renderTargets() { return this.getSceneViewsAndTargets().renderTargets; }
    /** The render target the renderer is drawing into (set with `setCurrentRenderTarget`), or `null` for the canvas. */
    get currentRenderTarget() { return this._currentRenderTarget; }

    /** Adds a floating-point RGBA render target of the given size to `renderTargets`. */
    addRenderTarget(width: number, height: number): void {
        this.getSceneViewsAndTargets().addRenderTarget(width, height);
    }

    /**
     * Makes the renderer draw into `renderTarget`, or into the canvas if it is `undefined`/`null`.
     * `currentRenderTarget` follows: it is `renderTarget`, or `null` after switching back to the canvas.
     */
    setCurrentRenderTarget(renderTarget?: ARenderTarget | null): void {
        if (renderTarget !== undefined && renderTarget !== null) {
            (this.context as AGLContext).setRenderTarget(renderTarget.target);
            this._currentRenderTarget = renderTarget;
        } else {
            (this.context as AGLContext).setRenderTarget(null);
            this._currentRenderTarget = null;
        }
    }

    // ── Three.js-specific extras ──────────────────────────────────────────────
    /** The Three.js WebGL renderer. */
    get renderer(): THREE.WebGLRenderer {
        return (this.context as AGLContext).renderer;
    }

    /**
     * Returns the Three.js camera for `cameraModel`, or, with no `cameraModel`, the camera of `pass` (of
     * `mainRenderPass` if `pass` is also omitted). If both are given, `cameraModel` is used, and its view is looked
     * up in `pass`'s scene view.
     */
    getThreeJSCamera(cameraModel?: ACameraModel3D, pass?: ARenderPass) {
        if (cameraModel !== undefined) {
            const views = this.getViewListForModel(cameraModel, pass);
            return (views[0] as ACameraView).threeJSCamera;
        }
        return this.cameraViewForPass(pass).threeJSCamera;
    }

    /** Returns the {@link ACameraView} for `pass`'s camera model, or for `mainRenderPass`'s if `pass` is omitted. The
     * view is looked up in `pass`'s scene view, or in the main scene view if `pass` is omitted. */
    cameraViewForPass(pass?: ARenderPass): ACameraView {
        const resolvedPass = pass ?? this.mainRenderPass;
        return this.getViewListForModel(resolvedPass.cameraModel, pass)[0] as ACameraView;
    }

    /** The camera view for `mainRenderPass`'s camera (same as `cameraViewForPass()`). */
    get cameraView(): ACameraView {
        return this.cameraViewForPass();
    }

    /** Returns the views of `model` in `pass`'s scene view, or in the main scene view if `pass` is omitted. A pass can
     * show the same graph through a second scene view with different view classes, so a model can have different
     * views in different passes. */
    getViewListForModel(model: AModelInterface, pass?: ARenderPass) {
        const sceneView = pass?.sceneView ?? this.mainSceneView;
        return sceneView.getViewListForModel(model);
    }

    /**
     * Returns the `THREE.Scene` of the scene view with the given name (the main one if omitted). Scene views are
     * named after their model graphs. To get a render pass's scene, use `pass.sceneView.threeJSScene`.
     * @param sceneViewName the scene view's name (its model graph's name)
     */
    getThreeJSScene(sceneViewName?: string) {
        const key = sceneViewName ?? SCENE_MODEL_CONSTANTS.MAIN_MODEL_GRAPH_KEY;
        return this.getSceneView(key).threeJSScene;
    }

    /** Rotates the background (e.g. a cube-map sky) of every scene view by `transform`. */
    setBackgroundTransform(transform: Quaternion): void {
        this.sceneViews.setCommonBackgroundTransform(transform);
    }

    // ── Hit detection / picking ───────────────────────────────────────────────
    protected _raycaster: THREE.Raycaster = new THREE.Raycaster();

    /**
     * Returns the topmost visible, interactive pass whose viewport contains `event`'s cursor, or `undefined` if none
     * does. Passes are checked in reverse draw order, and passes with `interactive: false` are skipped. See
     * {@link findPassAtCursor}.
     */
    getPassAtCursor(event: AInteractionEvent): ARenderPass | undefined {
        return findPassAtCursor(this._renderPasses, event);
    }

    /**
     * Three.js picking: raycasts from the camera through the cursor and returns the pickable node views hit,
     * front-to-back (see {@link ASceneController.getNodeViewAtCursor}). The depth number is the ray's hit distance.
     *
     * With no `pass`, raycasts with the canvas-wide `event.ndcCursor` through the main pass's camera against the
     * main scene view. With a `pass`, uses that pass's camera and scene view and its local NDC
     * (`pass.localNDCCursor(event)`). In a multi-pass scene, find the pass under the cursor with
     * `getPassAtCursor(event)` first, then pass it in here.
     */
    getNodeViewAtCursor(event: AInteractionEvent, firstPickOnly: boolean = true, pass?: ARenderPass): HitList {
        const ndc = pass ? pass.localNDCCursor(event) : event.ndcCursor;
        if (!ndc) return [];
        // ndc is already X-right/Y-up, range ~[-1,1] — exactly THREE.Raycaster.setFromCamera's convention. No
        // conversion needed, whichever source (canvas-global or pass-local) it came from.
        this._raycaster.setFromCamera(
            new THREE.Vector2(ndc.x, ndc.y),
            this.getThreeJSCamera(undefined, pass)
        );
        const scene = pass ? pass.sceneView.threeJSScene : this.getThreeJSScene();
        const hits = this._raycaster.intersectObjects(scene.children, true);
        const results: HitList = [];
        const seen = new Set<AGLNodeView>();
        for (const hit of hits) {
            const view = this._resolveViewFromObject3D(hit.object);
            if (!view || seen.has(view)) continue;
            seen.add(view);
            results.push([view, hit.distance]);
            if (firstPickOnly) return results;
        }
        return results;
    }

    private _resolveViewFromObject3D(object: THREE.Object3D | null): AGLNodeView | undefined {
        let current: THREE.Object3D | null = object;
        while (current) {
            const view = current.userData[AGL_NODE_VIEW_USERDATA_KEY] as AGLNodeView | undefined;
            if (view && view.model.pickable) return view;
            current = current.parent;
        }
        return undefined;
    }

    /** Sets a cube texture as the background of every scene view. Does nothing if `allSceneViews` is false. */
    _setBackgroundCubeTexture(cubeTexture: THREE.CubeTexture, allSceneViews = true): void {
        if (allSceneViews) {
            this.sceneViews._setBackgroundCubeTexture(cubeTexture);
        }
    }

    _releaseSceneViews(): void {
        this._sceneViewsAndTargets.releaseSceneViews();
    }

    protected _unSetModel(): void {
        this.clearSubscriptions();
        this.view.release();
        this._releaseSceneViews();
    }

    /** Subscribes the scene view named `sceneViewName` to `modelGraph`. */
    _connectSceneViewToModelGraph(sceneViewName: string, modelGraph: AModelGraph): void {
        const sceneView = this.getSceneView(sceneViewName);
        sceneView?._subscribeToModelGraph(modelGraph);
    }
}
