import {AView} from "../base/amvc/AView";
import {AModelInterface, HasModelViewMap, MVMViewMap} from "../base/amvc";
import {AModelGraph} from "./AModelGraph";
import {ANodeModel} from "./nodeModel/ANodeModel";
import {ANodeView} from "./nodeView/ANodeView";
import {ClassInterface, SceneGraphEvents} from "../basictypes";
import {AModelViewClassMap, AMVClassSpec, AMVClassSpecDetails} from "../base/amvc/AModelViewClassSpec";
import type {AObjectNode} from "../base/aobject/AObjectNode";

/**
 * Subscription handles used for the model-graph node events that scene views
 * listen to. Defined here (rather than in ASceneController) so that the base
 * scene view can wire the subscriptions without importing the controller.
 * Re-exported from ASceneController for backwards compatibility.
 */
export enum SceneControllerSubscriptions {
    ModelNodeAdded = "ModelNodeAdded",
    ModelNodeRemoved = "ModelNodeRemoved",
    ModelNodeReleased = "ModelNodeReleased"
}

/**
 * Backend-agnostic base class for scene views. A scene view maps a model graph
 * to a hierarchy of node views for one rendering backend. It listens to the
 * graph's `NodeAdded`/`NodeRemoved`/`NodeReleased` events, creates a view for
 * each new node model (using the class registered with `addModelViewSpec`),
 * and nests each view under its parent's view. Concrete subclasses
 * ({@link AGLSceneView} for Three.js, {@link ATwoJSSceneView} for Two.js)
 * implement the backend-specific parts.
 */
export abstract class ASceneView extends AView implements HasModelViewMap {
    // ── Model → view bookkeeping ──────────────────────────────────────────────
    // Shared by both backends. The methods that touch backend render objects (`removeView`, `releaseView`,
    // `onModelNodeAdded`/`onModelNodeRemoved`, `addNodeViewToRoot`) are abstract.
    protected _viewMap: MVMViewMap = {};
    /** Map from model uid to that model's views (`{modelID: {viewID: view}}`). */
    get viewMap(): MVMViewMap { return this._viewMap; }

    /** Returns true if this scene view has views for `model`. */
    hasModel(model: AModelInterface): boolean {
        return model.uid in this.viewMap;
    }

    /** Returns true if `view` is registered in this scene view. */
    hasView(view: AView): boolean {
        return view.uid in (this.viewMap[view.modelID] ?? {});
    }

    /** Registers `view` in the view map under its model's uid. Does not attach it to the render hierarchy. */
    addView(view: AView): void {
        const nv = view as ANodeView;
        if (!this.viewMap[nv.modelID]) this.viewMap[nv.modelID] = {};
        this.viewMap[nv.modelID][nv.uid] = nv;
    }

    /**
     * Backend-specific: detaches `view`'s render object from the display hierarchy (and any backend-side
     * registries), then removes it from the view map.
     */
    abstract removeView(view: AView): void;

    /** Returns the views of `model` in this scene view (an empty list if it has none). */
    getViewListForModel(model: AModelInterface): ANodeView[] {
        return this.hasModel(model) ? (Object.values(this.viewMap[model.uid]) as ANodeView[]) : [];
    }

    _getViewListForModelID(modelID: string): ANodeView[] {
        return Object.values(this.viewMap[modelID] ?? {}) as ANodeView[];
    }

    /**
     * Backend-specific per-view teardown used by `disposeViews()` when the whole scene view is released: detaches
     * the render object and frees graphics resources. (Three.js: `.threejs.remove` + `disposeGraphics()`; Two.js:
     * detach `.twoGroup` + `.dispose()`.) Unlike `onModelNodeReleased`, this does not call the view's `.release()`,
     * since at whole-scene teardown the models are going away too.
     */
    protected abstract releaseView(view: AView): void;

    /** Tears down every view (see `releaseView`) and empties the view map. */
    disposeViews(): void {
        for (const modelID in this.viewMap) {
            for (const v of this._getViewListForModelID(modelID)) {
                this.releaseView(v);
            }
        }
        for (const modelID in this.viewMap) delete this.viewMap[modelID];
    }

    /** Disposes all views, then releases this scene view. */
    release(): void {
        this.disposeViews();
        super.release();
    }

    // ── Model class → view class registry ─────────────────────────────────────
    classMap: AModelViewClassMap = new AModelViewClassMap();
    protected _defaultViewClass: ClassInterface<ANodeView> | undefined;
    /** The view class used for model classes with no registered spec (see `addModelViewSpec`). */
    get defaultViewClass(): ClassInterface<ANodeView> | undefined { return this._defaultViewClass; }
    setDefaultViewClass(newViewClass: ClassInterface<ANodeView> | undefined): void { this._defaultViewClass = newViewClass; }

    /**
     * Register a model class → view class mapping. New instances of `modelClass` in this view's model graph get a
     * `viewClass` instance created and attached (see `createViewForNodeModel`).
     */
    addModelViewSpec(
        modelClass: ClassInterface<ANodeModel>,
        viewClass: ClassInterface<ANodeView>,
        details?: AMVClassSpecDetails
    ): void {
        this.classMap.addSpec(new AMVClassSpec(modelClass, viewClass, details));
    }

    // Node-graph event callbacks invoked by the subscriptions set up in `_subscribeToModelGraph`. The backends differ
    // here: the Three.js scene view throws if it can't find a view class or finds more than one view for a model;
    // the Two.js one skips model types with no registered spec (e.g. a camera model in a 2D scene).
    /** Called when a node model is added to the model graph (or is already there when the view subscribes). Creates and attaches its view if needed. */
    abstract onModelNodeAdded(nodeModel: ANodeModel, ...args: any[]): void;
    /** Called when a node model is removed from its parent. Detaches its view from the render hierarchy. */
    abstract onModelNodeRemoved(nodeModel: ANodeModel): void;

    /**
     * Called when a node model is released from the model graph. Calls `.release()` on each of its views, which
     * disposes the render object and also unsubscribes the view's listeners on the model (see
     * `ANodeView.setModelListeners`), then removes the model from the view map.
     */
    onModelNodeReleased(nodeModel: ANodeModel): void {
        const views = this.getViewListForModel(nodeModel);
        for (const v of views) {
            v.release();
        }
        delete this.viewMap[nodeModel.uid];
    }

    /** The scene model this view's controller is attached to. */
    abstract get model(): AModelInterface;

    /**
     * Backend-specific: attach a node view's render object to this scene
     * view's root container.
     */
    protected abstract addNodeViewToRoot(view: ANodeView): void;

    /**
     * Attach `view`'s render object to the appropriate parent in the display
     * hierarchy:
     * - If the view is already attached, do nothing (onModelNodeAdded can
     *   legitimately re-fire for models that already have views).
     * - If the model has a parent node model with a view, nest under it. If
     *   the parent model has no view yet, leave the view detached — attaching
     *   to the scene root instead would render the child with only its local
     *   transform, and nothing would ever re-parent it.
     * - If the model's parent is the scene model or the model graph, attach to
     *   the scene root.
     * - Otherwise warn about the unknown parent type.
     */
    protected _attachViewToParent(view: ANodeView, nodeModel: ANodeModel): void {
        if (view.isAttachedToRenderHierarchy) return;
        if (nodeModel.parent instanceof ANodeModel) {
            const parentViews = this.getViewListForModel(nodeModel.parent);
            if (parentViews.length > 0) {
                view.addToParentView(parentViews[0] as ANodeView);
            }
            return;
        }
        if (nodeModel.parent === this.model || nodeModel.parent === this.modelGraph) {
            this.addNodeViewToRoot(view);
            return;
        }
        console.warn("Adding node model with unknown parent type:")
        console.warn(nodeModel);
    }

    /** The model graph this scene view shows. */
    protected _modelGraph: AModelGraph | undefined = undefined;
    get modelGraph(): AModelGraph | undefined {
        return this._modelGraph;
    }

    /** Sets the model graph this scene view shows. Call `initModelGraphSubscriptions()` to start listening to it. */
    setModelGraph(modelGraph: AModelGraph) {
        this._modelGraph = modelGraph;
    }

    /**
     * Subscribes to `modelGraph` (see `_subscribeToModelGraph`), so views are created, detached, and released as
     * nodes are added, removed, and released.
     */
    initModelGraphSubscriptions(clearView = true) {
        this._subscribeToModelGraph(this.modelGraph, clearView);
    }

    /**
     * Subscribes to a model graph's `NodeAdded`/`NodeRemoved`/`NodeReleased` events. Normally called from
     * `initModelGraphSubscriptions`; subscribing to more than one model graph is untested.
     * After subscribing, immediately walks existing descendants so nodes added before this view subscribed are not missed.
     * Nodes added later, including every descendant of an added subtree, reach this view through `NodeAdded`, which
     * `AModelGraph` signals for each node of the subtree.
     * @param modelGraph
     * @param clearView whether to unsubscribe and clear previously created view if it exists
     */
    _subscribeToModelGraph(modelGraph: AModelGraph | undefined, clearView = true) {
        const self = this;

        if ((this.hasSubscription(SceneControllerSubscriptions.ModelNodeAdded) ||
            this.hasSubscription(SceneControllerSubscriptions.ModelNodeRemoved) ||
            this.hasSubscription(SceneControllerSubscriptions.ModelNodeReleased)) && clearView
        ) {
            this.release()
            console.warn("Calling ASceneView.subscribeToModelGraph when view already has subscriptions!!! Releasing view. Not thoroughly tested!!!")
            this.unsubscribe(SceneControllerSubscriptions.ModelNodeAdded, false);
            this.unsubscribe(SceneControllerSubscriptions.ModelNodeRemoved, false);
            this.unsubscribe(SceneControllerSubscriptions.ModelNodeReleased, false);
        }

        if (modelGraph !== undefined) {
            this.subscribe(modelGraph.addEventListener(SceneGraphEvents.NodeAdded, (node: ANodeModel, ...args: any[]) => {
                self.onModelNodeAdded(node, ...args);
            }), SceneControllerSubscriptions.ModelNodeAdded);

            this.subscribe(modelGraph.addEventListener(SceneGraphEvents.NodeRemoved, (node: ANodeModel) => {
                self.onModelNodeRemoved(node);
            }), SceneControllerSubscriptions.ModelNodeRemoved);

            this.subscribe(modelGraph.addEventListener(SceneGraphEvents.NodeReleased, (node: ANodeModel) => {
                self.onModelNodeReleased(node);
            }), SceneControllerSubscriptions.ModelNodeReleased);

            modelGraph.mapOverDescendants((descendant: AObjectNode) => {
                self.onModelNodeAdded(descendant as ANodeModel);
            })
        }
    }
}