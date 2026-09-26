import {ASceneView} from "../../scene/ASceneView";
import {AView} from "../../base/amvc/AView";
import {ASceneController} from "../../scene/ASceneController";
import {ANodeModel} from "../../scene/nodeModel/ANodeModel";
import {ClassInterface} from "../../basictypes";
import {ATwoJSNodeView} from "./ATwoJSNodeView";
import {ANodeView} from "../../scene";
import type {ACameraModel2D} from "../../scene/camera";
import {Two, TwoGroup} from "./TwoJSImport";

/** Handle for this view's camera-change subscription (see `_initCameraSync`), so `release()` can unsubscribe it. */
const CAMERA_SYNC_SUBSCRIPTION_HANDLE = "ATwoJSSceneView_cameraSync";

/**
 * Two.js counterpart to {@link AGLSceneView}; both extend {@link ASceneView}.
 *
 * Manages a flat `TwoGroup` that is attached directly to the Two.js scene.
 * When a model node is added to the model graph, `onModelNodeAdded` creates
 * the appropriate `ATwoJSNodeView` (looked up from the `classMap`) and
 * attaches its group either to a parent view's group or to the root
 * `_twoGroup`.
 *
 * **Camera.** `_initCameraSync` applies `model.cameraModel`'s position and
 * zoom to `_twoGroup` and keeps them in sync whenever the camera changes:
 * `translation = -position * zoom`, `scale = zoom`. Here `position` (the
 * translation of the camera transform) is a direct pixel offset and
 * `camera.camera.zoom` a direct scale factor. This differs from the Three.js
 * convention used by {@link ACameraView} (center origin, y up, NDC): Two.js
 * scenes store positions in raw canvas pixels (top-left origin, y down), so a
 * camera at position (0, 0) with zoom 1 must leave the scene unchanged.
 *
 * Gotchas: zoom pivots on the world point at the camera's `position`, which is
 * drawn at the canvas's top-left corner (not its center or the cursor), so
 * zooming makes content slide toward the bottom-right. Camera rotation is
 * ignored. `PanZoomController2D` with `pixelSpace: true` computes its pan
 * deltas to match this mapping.
 */
export class ATwoJSSceneView extends ASceneView {
    // viewMap, classMap and defaultViewClass are inherited from ASceneView.
    protected _controller!: ASceneController;
    protected _twoGroup: TwoGroup;

    /** The scene controller that owns this view. */
    get controller(): ASceneController { return this._controller; }
    /** The scene model. */
    get model() { return this.controller.model; }
    /** The scene model's uid. */
    get modelID(): string { return this.model.uid; }
    /** The root Two.js group; node views without a parent view attach here. The camera transform is applied to it. */
    get twoGroup(): TwoGroup { return this._twoGroup; }

    /**
     * @param controller Scene controller that owns this view.
     * @param twoGroup Root group to use; a new `Two.Group` is created if omitted.
     */
    constructor(controller: ASceneController, twoGroup?: TwoGroup) {
        super();
        this._controller = controller;
        this._twoGroup = twoGroup ?? new Two.Group();
        this.onModelNodeAdded = this.onModelNodeAdded.bind(this);
        this.onModelNodeRemoved = this.onModelNodeRemoved.bind(this);
        this._initCameraSync();
    }

    /** Applies the scene's current camera to `_twoGroup` and subscribes to keep them in sync on every camera
     * change. Does nothing if the scene has no camera model. */
    protected _initCameraSync(): void {
        const camera = this.model.cameraModel as ACameraModel2D | undefined;
        if (!camera) return;
        this._syncTwoGroupToCamera();
        this.subscribe(
            camera.addCameraChangeListener(() => this._syncTwoGroupToCamera()),
            CAMERA_SYNC_SUBSCRIPTION_HANDLE
        );
    }

    /** Sets `_twoGroup`'s scale and translation from the camera (see the class docstring for the mapping). Does
     * nothing if the scene has no camera model. */
    protected _syncTwoGroupToCamera(): void {
        const camera = this.model.cameraModel as ACameraModel2D | undefined;
        if (!camera) return;
        const zoom = camera.camera.zoom;
        // Read-only, so read the translation from the matrix: that works whether the transform is a NodeTransform2D
        // or a Mat3 (`prsa` would throw on a Mat3).
        const position = camera.transform.getMatrix().c2.Point2D;
        this._twoGroup.scale = zoom;
        this._twoGroup.translation.set(-position.x * zoom, -position.y * zoom);
    }

    /**
     * Creates a view for `nodeModel`, sets its controller, and calls `setModel`.
     * Uses `viewClass` if given, otherwise the class registered for the model in
     * the class map, otherwise `defaultViewClass`. Throws if none of these is
     * available.
     */
    createViewForNodeModel(nodeModel: ANodeModel, viewClass?: ClassInterface<ANodeView>): ANodeView {
        if (viewClass === undefined) {
            const spec = this.classMap.getSpecForModel(nodeModel);
            if (spec !== undefined) {
                viewClass = spec.viewClass;
            } else if (this.defaultViewClass) {
                viewClass = this.defaultViewClass;
            }
        }
        if (viewClass !== undefined) {
            const view = new viewClass();
            view.setController(this.controller);
            view.setModel(nodeModel);
            return view;
        }
        throw new Error(`Unsure how to create Two.js view for ${nodeModel.constructor.name}`);
    }

    /** Removes the view's group from the Two.js hierarchy and forgets the view, without disposing it. */
    removeView(view: AView): void {
        const nv = view as ATwoJSNodeView;
        nv.twoGroup?.parent?.remove(nv.twoGroup);
        delete this.viewMap[nv.modelID][nv.uid];
    }

    /** Removes the view's group from the Two.js hierarchy, disposes the view, and forgets it. */
    releaseView(view: AView): void {
        const nv = view as ATwoJSNodeView;
        nv.twoGroup?.parent?.remove(nv.twoGroup);
        nv.dispose();
        delete this.viewMap[nv.modelID][nv.uid];
    }

    /**
     * Called when a model node is added to the model graph.
     * Creates a view if the model has none and attaches its Two.js group to the
     * correct parent in the scene hierarchy.
     *
     * A model with no view class (no spec in the class map and no default view
     * class, e.g. a camera model) is skipped silently. Any other error while
     * creating or attaching the view (for example, an exception thrown by the
     * view's `init()` or `update()`) is printed with `console.error`, so it is
     * visible, and the node is skipped.
     */
    onModelNodeAdded(nodeModel: ANodeModel): void {
        const viewList = this.getViewListForModel(nodeModel);
        if (viewList.length < 1) {
            const hasViewClass = this.classMap.getSpecForModel(nodeModel) !== undefined || !!this.defaultViewClass;
            if (!hasViewClass) {
                // No view registered for this model type (e.g. ACameraModel3D). Skip silently.
                return;
            }
            try {
                const newView = this.createViewForNodeModel(nodeModel);
                this.addView(newView);
                const fresh = this.getViewListForModel(nodeModel);
                if (fresh.length > 0) {
                    this._attachViewToParent(fresh[0], nodeModel);
                }
            } catch (e) {
                console.error(`ATwoJSSceneView: failed to create a view for ${nodeModel.constructor.name}:`, e);
            }
        } else {
            this._attachViewToParent(viewList[0], nodeModel);
        }
    }

    /** Attaches a node view's Two.js group to this scene view's root group. */
    protected addNodeViewToRoot(view: ANodeView): void {
        this._twoGroup.add((view as ATwoJSNodeView).twoGroup);
    }

    /** Detaches the model's views' groups from the Two.js hierarchy (the views are kept). */
    onModelNodeRemoved(nodeModel: ANodeModel): void {
        const views = this.getViewListForModel(nodeModel);
        for (const v of views) {
            const nv = v as ATwoJSNodeView;
            nv.twoGroup?.parent?.remove(nv.twoGroup);
        }
    }

    // addModelViewSpec, hasModel, hasView, addView, getViewListForModel, disposeViews, release() and
    // onModelNodeReleased are inherited from ASceneView.
}
