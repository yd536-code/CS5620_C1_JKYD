import {ALabel} from "../base";
import {ASceneController, ContextType, HitList} from "./ASceneController";
import {ASceneModel, SCENE_MODEL_CONSTANTS} from "./ASceneModel";
import {ATwoJSContext} from "../rendering/context/ATwoJSContext";
import type {ATwoJSContextParams} from "../rendering/context/ATwoJSContext";
import {ATwoJSRenderWindow} from "../rendering/context/ATwoJSRenderWindow";
import {ATwoJSSceneView} from "../rendering/twojs/ATwoJSSceneView";
import {AModelGraph} from "./AModelGraph";
import type {ARenderContext} from "../rendering/context/ARenderContext";
import {ANodeModel} from "./nodeModel/ANodeModel";
import {ATwoJSNodeView} from "../rendering/twojs/ATwoJSNodeView";
import {ANodeView} from "./nodeView/ANodeView";
import {ClassInterface} from "../basictypes";
import {AMVClassSpecDetails} from "../base/amvc/AModelViewClassSpec";
import {ASceneView} from "./ASceneView";
import type {AInteractionEvent} from "../interaction";
/**
 * Abstract scene controller for Two.js-backed 2D scenes.
 *
 * Manages a collection of {@link ATwoJSSceneView} instances (one per model graph,
 * keyed by graph name). The primary graph is accessed via `mainSceneView`.
 *
 * **Initialization sequence** (triggered by `confirmInitialized` in `ASceneController`):
 * 1. Wait for `model.confirmInitialized()` — runs `initCamera` + `initScene`
 *    on the model, populating the model graph.
 * 2. `initSceneViews()` — creates one `ATwoJSSceneView` per model graph and
 *    adds its root group to the Two.js scene.
 * 3. `initModelViewSpecs()` — registers model class → view class mappings.
 * 4. `initRendering()` → `initViewSubscriptions()` — subscribes each scene
 *    view to its model graph; existing nodes are discovered immediately via
 *    `mapOverDescendants`.
 * 5. `initScene()` (controller-level) → sets clear color + calls
 *    `initInteractions()`.
 *
 * **Render loop**: `ATwoJSRenderWindow.render()` calls
 * `onAnimationFrameCallback` each frame, which advances the model clock via
 * `model.timeUpdate()`. `ATwoJSRenderWindow` then calls `two.update()` to flush
 * the SVG/canvas — do NOT call `two.update()` inside `onAnimationFrameCallback`
 * as that would produce a double update per frame.
 */
@ALabel("ATwoJSSceneController")
export abstract class ATwoJSSceneController extends ASceneController {
    static readonly contextType = ContextType.TWOJS;
    get contextType(): ContextType { return ContextType.TWOJS; }

    protected _twoSceneViews: Map<string, ATwoJSSceneView> = new Map();
    protected _twoContextParams?: ATwoJSContextParams;

    /** Registry mapping a Two.Group's `.id` to the `ATwoJSNodeView` that owns it, for hit-testing. */
    protected _hitTestRegistry: Map<string, ATwoJSNodeView> = new Map();

    /** Registers `view` so hit-testing can map its Two.js group's DOM element back to the view. */
    registerViewForHitTesting(view: ATwoJSNodeView): void {
        this._hitTestRegistry.set(view.twoGroup.id, view);
    }

    /** Removes `view` from the hit-testing registry. */
    unregisterViewForHitTesting(view: ATwoJSNodeView): void {
        this._hitTestRegistry.delete(view.twoGroup.id);
    }

    /**
     * @param model the scene model to show
     * @param twoContextParams optional Two.js context settings, stored on the controller
     */
    constructor(model: ASceneModel, twoContextParams?: ATwoJSContextParams) {
        super(model);
        this._twoContextParams = twoContextParams;
    }

    /** The Two.js context of this controller's render window. */
    get twoContext(): ATwoJSContext {
        return (this._renderWindow as ATwoJSRenderWindow).twoContext;
    }

    /** This controller's render window, typed as an {@link ATwoJSRenderWindow}. */
    get twoRenderWindow(): ATwoJSRenderWindow {
        return this._renderWindow as ATwoJSRenderWindow;
    }

    private _getTwoSceneView(name: string): ATwoJSSceneView | undefined {
        return this._twoSceneViews.get(name);
    }

    /** The scene view for the main model graph. Throws if not yet created. */
    get mainSceneView(): ATwoJSSceneView {
        const v = this._getTwoSceneView(SCENE_MODEL_CONSTANTS.MAIN_MODEL_GRAPH_KEY);
        if (!v) throw new Error(`Two.js scene view "${SCENE_MODEL_CONSTANTS.MAIN_MODEL_GRAPH_KEY}" not found`);
        return v;
    }

    /** Same as `mainSceneView`. */
    get view(): ATwoJSSceneView {
        return this.mainSceneView;
    }

    /** Returns the scene view with the given name (the main one if omitted). Throws if there is none. */
    getSceneView(name?: string): ATwoJSSceneView {
        const key = name ?? SCENE_MODEL_CONSTANTS.MAIN_MODEL_GRAPH_KEY;
        const v = this._getTwoSceneView(key);
        if (!v) throw new Error(`Two.js scene view "${key}" not found`);
        return v;
    }

    /**
     * Create an `ATwoJSSceneView` for `modelGraph`, register it under `name`,
     * and add its root group to the Two.js scene.
     */
    createSceneView(name: string, modelGraph: AModelGraph): ATwoJSSceneView {
        const view = new ATwoJSSceneView(this);
        view.setModelGraph(modelGraph);
        this._twoSceneViews.set(name, view);
        this.twoContext.two.add(view.twoGroup);
        return view;
    }

    /** Calls `f` on every scene view. */
    mapOverSceneViews(f: (view: ASceneView) => void): void {
        this._twoSceneViews.forEach(v => f(v));
    }

    // initSceneViews is inherited from ASceneController; it calls createSceneView (above) once per model graph.

    /**
     * Forward a model/view class pair to all registered scene views.
     * `ATwoJSNodeView` subclasses can be passed directly (they extend the
     * backend-agnostic `ANodeView`).
     */
    addModelViewSpec(modelClass: ClassInterface<ANodeModel>, viewClass: ClassInterface<ANodeView>, details?: AMVClassSpecDetails): void {
        this._twoSceneViews.forEach(v => v.addModelViewSpec(modelClass, viewClass, details));
    }

    /** Subscribe all scene views to their model graphs. */
    initViewSubscriptions(): void {
        this._twoSceneViews.forEach(v => v.initModelGraphSubscriptions());
    }

    /**
     * Called once per animation frame by `ATwoJSRenderWindow`.
     * Advances the model clock via `model.timeUpdate()`. Two.js rendering
     * (`two.update()`) is handled by `ATwoJSRenderWindow.render()` after this
     * callback returns — do not call it here.
     */
    onAnimationFrameCallback(_context: ARenderContext): void {
        this.model.timeUpdate();
    }

    /** Subscribes the scene views to their model graphs, then runs `_beforeInitScene` and `initScene`. */
    async initRendering(): Promise<void> {
        this.initViewSubscriptions();
        this._beforeInitScene();
        await this.initScene();
        this.readyToRender = true;
    }

    // initScene() and onWindowResize() are inherited from ASceneController. (Its `context.clear()` call does
    // nothing for Two.js, which clears automatically on two.update().)

    /**
     * Serialize a scene view's Two.js content to an SVG file and trigger a
     * browser download.
     *
     * @param view     Scene view to export. Defaults to `mainSceneView`.
     * @param filename Download filename. Defaults to `"scene.svg"`.
     */
    saveToSVG(view?: ATwoJSSceneView, filename: string = 'scene.svg'): void {
        const targetView = view ?? this.mainSceneView;

        this.twoContext.two.update();

        const renderer = this.twoContext.two.renderer as any;
        const liveSvg = renderer.domElement as Element;
        if (!liveSvg || liveSvg.tagName.toLowerCase() !== 'svg') {
            throw new Error(
                'saveToSVG requires an SVG renderer (Two.Types.svg). ' +
                'Ensure ATwoJSContext was created with the default type.'
            );
        }

        const groupEl = liveSvg.querySelector('#' + targetView.twoGroup.id);
        if (!groupEl) {
            throw new Error(
                `saveToSVG: SVG element for group id "${targetView.twoGroup.id}" not found. ` +
                'The scene must have rendered at least one frame before saving.'
            );
        }

        const ns = 'http://www.w3.org/2000/svg';
        const exportSvg = document.createElementNS(ns, 'svg');
        exportSvg.setAttribute('xmlns', ns);
        exportSvg.setAttribute('width', String(this.twoContext.two.width));
        exportSvg.setAttribute('height', String(this.twoContext.two.height));
        exportSvg.setAttribute('viewBox',
            `0 0 ${this.twoContext.two.width} ${this.twoContext.two.height}`);

        const bgColor = (liveSvg as HTMLElement).style?.backgroundColor;
        if (bgColor) {
            const bgRect = document.createElementNS(ns, 'rect');
            bgRect.setAttribute('width', '100%');
            bgRect.setAttribute('height', '100%');
            bgRect.setAttribute('fill', bgColor);
            exportSvg.appendChild(bgRect);
        }

        const defs = liveSvg.querySelector('defs');
        if (defs) exportSvg.appendChild(defs.cloneNode(true));

        exportSvg.appendChild(groupEl.cloneNode(true));

        const svgString = new XMLSerializer().serializeToString(exportSvg);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    }

    // ── Hit detection / picking ───────────────────────────────────────────────
    /**
     * Two.js picking: uses `document.elementsFromPoint` at the cursor and maps each DOM element (or its nearest
     * registered ancestor) back to a node view that is both pickable and visible. Returns hits front-to-back (see
     * {@link ASceneController.getNodeViewAtCursor}); the depth number is the index in `elementsFromPoint`'s result,
     * an order rather than a distance.
     */
    getNodeViewAtCursor(event: AInteractionEvent, firstPickOnly: boolean = true): HitList {
        const domEvent = event.DOMEvent as MouseEvent;
        if (typeof domEvent.clientX !== 'number') return [];
        const elements = document.elementsFromPoint(domEvent.clientX, domEvent.clientY);
        const results: HitList = [];
        const seen = new Set<ATwoJSNodeView>();
        for (let i = 0; i < elements.length; i++) {
            const view = this._resolveViewFromElement(elements[i]);
            if (!view || seen.has(view)) continue;
            seen.add(view);
            results.push([view, i]);
            if (firstPickOnly) return results;
        }
        return results;
    }

    private _resolveViewFromElement(element: Element | null): ATwoJSNodeView | undefined {
        let current: Element | null = element;
        while (current) {
            const view = this._hitTestRegistry.get(current.id);
            if (view && view.model.pickable && view.model.visible) return view;
            current = current.parentElement;
        }
        return undefined;
    }
}
