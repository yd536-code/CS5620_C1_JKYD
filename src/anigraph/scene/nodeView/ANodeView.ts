import {ANodeModel} from "../nodeModel/ANodeModel";
import {AView} from "../../base/amvc/AView";
import type {AGraphicObject} from "../../rendering/graphicobject/AGraphicObject";
import type {ASceneController} from "../ASceneController";

/** Handles under which `ANodeView.setModelListeners` registers the view's listeners on its model. */
export enum BASIC_VIEW_SUBSCRIPTIONS{
    MODEL_STATE_LISTENER='VIEW_MODEL_STATE_LISTENER',
    MODEL_RELEASE_LISTENER='VIEW_MODEL_RELEASE_LISTENER',
    MODEL_GEOMETRY_LISTENER='VIEW_MODEL_GEOMETRY_LISTENER',
    MODEL_PARENT_CHANGED="MODEL_PARENT_CHANGED",
    MODEL_VISIBLE="MODEL_VISIBLE",
    MODEL_RENDER_ORDER = "MODEL_RENDER_ORDER",
    MODEL_TRANSFORM_EVENT_LISTENER="MODEL_TRANSFORM_EVENT_LISTENER"
}

/** A callback that receives a node view, plus any extra arguments. */
export type NodeViewCallback = (view:ANodeView, ...args: any[]) => any;

/**
 * Base class for node views, independent of the rendering backend. A node view draws one node model: it owns the
 * backend render objects for that model and keeps them in sync with it by listening to the model (see
 * `setModelListeners`).
 *
 * Backend subclasses ({@link AGLNodeView} for Three.js, `ATwoJSNodeView` for Two.js) implement the abstract
 * render-object hooks. Scene code subclasses one of those and implements `init()` (create graphics) and `update()`
 * (make the graphics match the model).
 */
export abstract class ANodeView extends AView{
    /** Creates the view's graphics. Called once by `setModel`, after the render object exists. */
    abstract init():void;
    /**
     * Makes the view match its model. Called by `setModel`, whenever the model's state (other than its transform)
     * changes, on geometry updates, and, by default, on transform updates (see `onTransformUpdate`).
     */
    abstract update(...args:any[]):void;
    /** Applies the model's current transform to the view's render object. */
    abstract updateTransform():void;

    /**
     * Create the backend render object for this view (e.g., a THREE.Group for
     * Three.js or a Two.Group for Two.js). Called by `setModel` before `init()`.
     */
    protected abstract _initRenderObject():void;

    /**
     * Attach this view's render object as a child of `parentView`'s render
     * object. Backend-specific.
     */
    abstract addToParentView(parentView:ANodeView):void;

    /**
     * Whether this view's render object is already attached somewhere in the
     * backend display hierarchy.
     */
    abstract get isAttachedToRenderHierarchy():boolean;

    /**
     * Backend-specific visibility write. Called when the model's `visible` changes, and once during `setModel`.
     */
    protected abstract _setVisible(value:boolean):void;
    /**
     * Backend-specific render-order write. Called when the model's `renderOrder` changes, and once during
     * `setModel`. Backends without a render-order setting (in Two.js, z-order is child order) implement it as a
     * no-op.
     */
    protected abstract _setRenderOrder(value:number):void;

    /** Attaches a graphic's render object to this view's render object (backend-specific). */
    protected abstract _attachGraphic(graphic:AGraphicObject):void;
    /** Detaches a graphic's render object from this view's render object (backend-specific). */
    protected abstract _detachGraphic(graphic:AGraphicObject):void;

    /** Frees the view's graphics and removes its render object from the backend's display hierarchy. */
    abstract dispose():void;

    protected _model!:ANodeModel;
    /** The node model this view draws. Subclasses often override the getter to return their model's type. */
    get model(){
        return this._model;
    }

    /** The `uid` of this view's model. */
    get modelID():string{
        return this.model.uid;
    }

    /** The scene controller this view belongs to. */
    get controller():ASceneController{return this._controller as ASceneController;}

    /**
     * Called when the model signals `TRANSFORM_UPDATE`: after each transform edit while the model's
     * `autoTransformUpdate` is on, or when `signalTransformUpdate()` is called. Transform edits don't reach the
     * general state listener (it skips the model's `transformStateKeys`), so this is how the view follows its
     * model's transform.
     *
     * The default calls `update()`, which is right for any view whose `update()` applies the transform, including
     * views that compute their own matrix. A view whose `update()` does nothing with the transform beyond applying
     * `model.transform` should override this to call `updateTransform()` only, which is cheaper.
     */
    onTransformUpdate():void{
        this.update();
    }

    /**
     * Connects the view to its model. In order: creates the render object, calls `init()` and then `update()`,
     * applies the model's render order, registers the model listeners (`setModelListeners`), and applies the
     * model's visibility. The scene view calls this from `createViewForNodeModel`.
     * @param model The node model to draw.
     */
    setModel(model:ANodeModel){
        this._model = model;
        this._initRenderObject();
        this.init();
        this.update();
        this._setRenderOrder(this.model.renderOrder);
        this.setModelListeners()
        this._setVisible(this.model.visible);
    }

    /**
     * Registers the view's listeners on its model (replacing any registered before):
     * - model released: `dispose()`
     * - any state change except the transform's (`model.transformStateKeys`): `update()`
     * - `TRANSFORM_UPDATE`: `onTransformUpdate()`
     * - geometry update: `update()`
     * - render order change: `_setRenderOrder`
     * - visibility change: `_setVisible`
     */
    setModelListeners(){
        const self=this;
        this.unsubscribe(BASIC_VIEW_SUBSCRIPTIONS.MODEL_RELEASE_LISTENER, false);
        this.subscribe(this.model.addEventListener(ANodeModel.AModelEvents.RELEASE, ()=>{self.dispose()}), BASIC_VIEW_SUBSCRIPTIONS.MODEL_RELEASE_LISTENER);
        this.unsubscribe(BASIC_VIEW_SUBSCRIPTIONS.MODEL_STATE_LISTENER, false);
        // Every state change except the transform's: transform changes arrive as TRANSFORM_UPDATE events (below),
        // so that a model with autoTransformUpdate off can batch them.
        this.subscribe(this.model.addStateListenerExcept(this.model.transformStateKeys, ()=>{self.update()}), BASIC_VIEW_SUBSCRIPTIONS.MODEL_STATE_LISTENER);
        this.unsubscribe(BASIC_VIEW_SUBSCRIPTIONS.MODEL_TRANSFORM_EVENT_LISTENER, false);
        this.subscribe(this.model.addTransformListener(()=>{self.onTransformUpdate()}), BASIC_VIEW_SUBSCRIPTIONS.MODEL_TRANSFORM_EVENT_LISTENER);
        this.unsubscribe(BASIC_VIEW_SUBSCRIPTIONS.MODEL_GEOMETRY_LISTENER, false);
        this.subscribe(this.model.addGeometryListener(()=>{self.update()}), BASIC_VIEW_SUBSCRIPTIONS.MODEL_GEOMETRY_LISTENER);

        this.unsubscribe(BASIC_VIEW_SUBSCRIPTIONS.MODEL_RENDER_ORDER, false);
        this.subscribe(this.model.addRenderOrderListener( ()=>{self._setRenderOrder(self.model.renderOrder)},), BASIC_VIEW_SUBSCRIPTIONS.MODEL_RENDER_ORDER);

        this.unsubscribe(BASIC_VIEW_SUBSCRIPTIONS.MODEL_VISIBLE, false);
        this.subscribe(this.model.addVisibilityListener(()=>{
                self._setVisible(self.model.visible);
            }),
            BASIC_VIEW_SUBSCRIPTIONS.MODEL_VISIBLE);
    }

    //##################//--Graphic Objects--\\##################
    //<editor-fold desc="Graphic Objects">

    /**
     * The view's graphic objects, keyed by `uid`. Each is one visual element of the view. Add them with
     * `registerAndAddGraphic`.
     */
    protected graphics:{[uid:string]:AGraphicObject}={};
    /**
     * Registers a graphic with the view (see `registerGraphic`) and attaches its render object to the view's render
     * object, so it is drawn with the view's transform.
     * @param graphic The graphic to add.
     */
    registerAndAddGraphic(graphic:AGraphicObject){
        this.registerGraphic(graphic);
        this._attachGraphic(graphic);
    }

    /**
     * Adds the graphic to the view's `graphics` dictionary without attaching it to the render object. This is
     * bookkeeping, so the view disposes of the graphic with the rest.
     */
    registerGraphic(graphic:AGraphicObject){
        this.graphics[graphic.uid]=graphic;
    }

    /** Detaches the graphic, removes it from `graphics`, and disposes of it. */
    disposeGraphic(graphic:AGraphicObject){
        this._removeGraphic(graphic);
        graphic.dispose();
    }

    /**
     * Detaches a graphic and removes it from `graphics`. Does not free the graphic's resources, which is done by
     * `graphic.dispose()`.
     */
    protected _removeGraphic(graphic:AGraphicObject){
        this._detachGraphic(graphic);
        delete this.graphics[graphic.uid];
    }

    /** Moves the graphic to the end of the view's graphics by detaching and re-adding it. */
    moveGraphicToBack(graphic:AGraphicObject){
        this._removeGraphic(graphic);
        this.registerAndAddGraphic(graphic);
    }

    /** Returns the view's graphics as an array. */
    getGraphicList(){
        return Object.values(this.graphics);
    }

    /**
     * Calls `fn` on each of the view's graphics.
     * @returns The array of `fn`'s return values.
     */
    mapOverGraphics(fn:(graphic:AGraphicObject)=>any[]|void){
        return this.getGraphicList().map(fn);
    }

    /** Turns wireframe rendering on or off for every graphic in the view. */
    setWireframe(value:boolean){
        this.mapOverGraphics((g:AGraphicObject)=>{
            g.setWireframe(value);
        })
    }

    /**
     * Disposes of every graphic in `graphics`: detaches it, removes it, and frees any GPU resources it used.
     */
    disposeGraphics(){
        let graphicKeys = Object.keys(this.graphics);
        for(let e of graphicKeys){
            let graphic = this.graphics[e];
            this._removeGraphic(graphic);
            graphic.dispose();
        }
    }

    //</editor-fold>
    //##################\\--Graphic Objects--//##################

    /** Disposes of the view (see `dispose`) and then releases it. */
    release() {
        this.dispose();
        super.release();
    }
}
