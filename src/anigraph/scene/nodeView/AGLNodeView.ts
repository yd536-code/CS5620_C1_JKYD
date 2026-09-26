import * as THREE from "three";
import {ANodeView} from "./ANodeView";
import {AView} from "../../base/amvc/AView";
import {AGLGraphicObject, AMaterial} from "../../rendering";
import type {AGraphicObject} from "../../rendering";
import type {TransformationInterface} from "../../math";
import {AObject} from "../../base/aobject/AObject";
import {AObject3DModelWrapper} from "../../geometry";
import {ALoadedElement, ALoadedElementInterface} from "../../rendering/loaded/ALoadedElement";

/** Material event names, exposed as `AGLNodeView.MaterialUpdates`. */
export enum ANODEVIEW_MATERIAL_EVENTS{
    UPDATE="AVIEW_MATERIAL_UPDATE",
    CHANGE="AVIEW_MATERIAL_CHANGE",
    COLOR="AVIEW_MATERIAL_COLOR"

}

/**
 * Key under which a view's root Object3D tags itself in `userData`, so a
 * raycast hit on any of its descendants can be resolved back to the owning
 * `AGLNodeView`. See `AGLSceneController.getNodeViewAtCursor`.
 */
export const AGL_NODE_VIEW_USERDATA_KEY = "aniGraphNodeView";

/**
 * Base class for node views in the Three.js backend. Each view owns a `THREE.Object3D` (a `THREE.Group` by
 * default), nested under its parent view's object, with the node's graphics as children. A subclass decides how its
 * model turns into Three.js objects: it creates graphics in `init()` and makes them match the model in `update()`.
 *
 * The render object's matrix is set by hand (`matrixAutoUpdate` is off): call `updateTransform()` (or
 * `setTransform(...)`) in `update()` to apply the model's transform. Works for 2D and 3D nodes alike.
 */
export abstract class AGLNodeView extends ANodeView{
    /** Graphics made from loaded 3D models (see `initLoadedObjects`), keyed by `uid`. */
    protected _loadedElements:{[uid:string]:ALoadedElementInterface}= {};

    static MaterialUpdates = ANODEVIEW_MATERIAL_EVENTS;

    /**
     * The Three.js object for this view (a `THREE.Group` unless a subclass overrides
     * `_initializeThreeJSObject`). Its `userData` holds a reference back to the view.
     */
    _threejs!:THREE.Object3D;
    /** The Three.js object for this view (see `_threejs`). */
    get threejs():THREE.Object3D{
        return this._threejs;
    }

    /** Creates the Three.js object and turns off Three.js's automatic matrix updates. */
    protected _initRenderObject(){
        this._initializeThreeJSObject();
        this._threejs.matrixAutoUpdate=false;
    }

    /** Creates `_threejs` as a `THREE.Group` and tags it with this view (see `AGL_NODE_VIEW_USERDATA_KEY`). */
    protected _initializeThreeJSObject(){
        this._threejs = new THREE.Group() as THREE.Object3D;
        this._threejs.userData[AGL_NODE_VIEW_USERDATA_KEY] = this;
    }

    protected _setVisible(value:boolean){
        this.threejs.visible=value;
    }

    protected _setRenderOrder(value:number){
        this.threejs.renderOrder = value;
    }

    /** Applies the model's `visible` to the render object. */
    _updateVisible(){
        this._setVisible(this.model.visible);
    }

    /** Applies the model's `renderOrder` to the render object. */
    updateRenderOrder(){
        this._setRenderOrder(this.model.renderOrder);
    }

    get isAttachedToRenderHierarchy():boolean{
        return this.threejs.parent !== null;
    }

    /**
     * Adds this view's Three.js object as a child of `newParent`'s Three.js object.
     * @param newParent The parent view. If undefined, nothing happens.
     * @throws Error if this view's object already has a parent.
     */
    setParentView(newParent?:AView){
        if(this.threejs.parent){
            throw new Error("Tried to parent view that already had parent");
        }
        if(newParent !== undefined){
            (newParent as unknown as {threejs:THREE.Object3D}).threejs.add(this.threejs);
        }
    }

    /** Same as `setParentView(parentView)`. */
    addToParentView(parentView:ANodeView){
        this.setParentView(parentView);
    }

    /**
     * Default `init()`: creates graphics for any loaded 3D models in the model's geometry (`initLoadedObjects`),
     * then calls `update()`. Most subclasses override it.
     */
    init(): void {
        this.initLoadedObjects();
        this.update();
    }

    /** The model's material. */
    get mainMaterial(){
        return this.model.material;
    }

    /**
     * Creates an `ALoadedElement` graphic for each `AObject3DModelWrapper` in the model's geometry and adds it to
     * the view. Each gets `material` if one is passed, otherwise the model's material, or a plain
     * `THREE.MeshBasicMaterial` if the model has none either.
     * @param material Optional material to use instead of the model's (e.g. a view-specific copy).
     */
    initLoadedObjects(material?:AMaterial){
        const useMaterial = material ?? this.mainMaterial;
        for(let mname in this.model.geometry.members){
            let m = this.model.geometry.members[mname];
            if (m instanceof AObject3DModelWrapper){
                let obj = new ALoadedElement(m);
                if(useMaterial) {
                    obj.setMaterial(useMaterial.threejs);
                }else{
                    obj.setMaterial(new THREE.MeshBasicMaterial())
                }
                this.addLoadedElement(obj);
            }
        }
    }

    /** Applies `material` to every loaded-model graphic in the view. */
    setMaterialForLoadedObjects(material:AMaterial){
        for(let elid in this._loadedElements){
            this._loadedElements[elid].setMaterial(material.threejs);
        }
    }

    /** Registers and adds a loaded-model graphic, and records it in `_loadedElements`. */
    addLoadedElement(element:ALoadedElement){
        this.registerAndAddGraphic(element);
        this._loadedElements[element.uid]=element;
    }

    //##################//--Graphic Objects--\\##################
    //<editor-fold desc="Graphic Objects">

    /**
     * Attaches the graphic's Three.js object to this view's Three.js object without registering it. Prefer
     * `registerAndAddGraphic`, which also lets the view dispose of it.
     */
    add(graphic:AGLGraphicObject){
        this._attachGraphic(graphic);
    }

    protected _attachGraphic(graphic:AGraphicObject){
        this.threejs.add((graphic as AGLGraphicObject).threejs);
    }

    protected _detachGraphic(graphic:AGraphicObject){
        this.threejs.remove((graphic as AGLGraphicObject).threejs);
    }

    /**
     * Disposes of the view's graphics and removes its Three.js object from its parent.
     */
    dispose(){
        this.disposeGraphics();
        this.threejs.removeFromParent();
    }

    //</editor-fold>
    //##################\\--Graphic Objects--//##################

    /**
     * Applies a transform of this node's space (its local transform, its world transform, or an already-embedded
     * `Mat4`) to the render object. The model decides how the transform is embedded into the renderer's 4x4 space
     * (`ANodeModel.embedTransform`), so this works for 2D and 3D nodes alike and never inspects the transform's type.
     * @param transform The transform to apply.
     */
    setTransform(transform:TransformationInterface){
        this.model.embedTransform(transform).assignTo(this.threejs.matrix);
    }

    /**
     * Applies the model's own transform to the render object: `model.getRenderMatrix()`.
     */
    updateTransform() {
        this.model.getRenderMatrix().assignTo(this.threejs.matrix);
    }

    /** Registers the listeners from `ANodeView.setModelListeners`, plus material listeners (`_initMaterialListener`). */
    setModelListeners(){
        super.setModelListeners();
        this._initMaterialListener();
    }

    /**
     * Calls `onMaterialUpdate()` when the model's material changes its values and `onMaterialChange()` when the
     * model's material is replaced.
     */
    _initMaterialListener(){
        const self=this;
        this.addMaterialUpdateCallback((...args:any[])=>{
                self.onMaterialUpdate(...args);
            },
            AMaterial.Events.UPDATE)
        this.addMaterialChangeCallback(()=>{
                self.onMaterialChange();
            },
            AMaterial.Events.CHANGE)
    }

    /** Passes a material update on to every graphic (`AGraphicObject.onMaterialUpdate`). */
    onMaterialUpdate(...args:any[]){
        const self = this;
        this.mapOverGraphics((element:AGraphicObject)=>{
            element.onMaterialUpdate(self.model.material, ...args);
        })
    }

    /** Passes the model's new material to every graphic (`AGraphicObject.onMaterialChange`). */
    onMaterialChange(){
        const self = this;
        this.mapOverGraphics((element:AGraphicObject)=>{
            element.onMaterialChange(self.model.material);
        })
    }

    /**
     * Subscribes `callback` to the model's material updates (see `ANodeModel.addMaterialUpdateListener`). The
     * callback is called with no arguments: the event's arguments are not forwarded.
     * @param handle Subscription handle on this view; a unique one is generated if omitted.
     */
    addMaterialUpdateCallback(callback:(self?:AObject)=>void, handle?:string){
        const self = this;
        this.subscribe(
            self.model.addMaterialUpdateListener( ()=>{
                callback();
            }),
            handle
        );
    }

    /**
     * Subscribes `callback` to the model's material being replaced (see `ANodeModel.addMaterialChangeListener`).
     * The callback is called with no arguments.
     * @param handle Subscription handle on this view; a unique one is generated if omitted.
     */
    addMaterialChangeCallback(callback:(self?:AObject)=>void, handle?:string){
        const self = this;
        this.subscribe(
            self.model.addMaterialChangeListener( ()=>{
                callback();
            }),
            handle
        );
    }
}

