import * as THREE from "three";
import {AView} from "../base/amvc/AView";
import {ASceneView} from "./ASceneView";
import {ASceneController} from "./ASceneController";
import {ANodeView} from "./nodeView/ANodeView";
import {AGLNodeView} from "./nodeView/AGLNodeView";
import {ATexture} from "../rendering";
import {Quaternion} from "../math";
import {ClassInterface} from "../basictypes";
import {ACameraModel2D, ACameraModel3D, ACameraView} from "./camera";
import {AGroupNodeModel2D, AGroupNodeModel3D, ANodeModel} from "./nodeModel";
import {AGroupNodeView} from "./nodeView/AGroupNodeView";
import {APointLightModel3D, APointLightView3D} from "./lights";
import {ALoadedModel3D, ALoadedView3D} from "./nodes/loaded";
import {AModelGraph} from "./AModelGraph";


/**
 * Three.js scene view: maps one model graph to a `THREE.Scene`. Each node model in the graph gets an
 * {@link AGLNodeView} whose Three.js object is added under its parent's object, or under this view's root group
 * (`threejs`) for top-level nodes. Supports one view per model.
 *
 * Several scene views can show the same model graph (for example, a second render pass that draws the scene with
 * different view classes).
 */
export class AGLSceneView extends ASceneView {

    // The view map and model-class-to-view-class registry are inherited from ASceneView.
    protected _controller!:ASceneController;
    protected _threeJSScene!:THREE.Scene;
    /** The scene controller that owns this view. */
    get controller(){return this._controller;}
    /** The controller's scene model. */
    get model(){return this.controller.model;}
    get modelID(){return this.model.uid;}
    _threejs!:THREE.Object3D;

    /**
     * @param controller the scene controller that owns this view
     * @param modelGraph the model graph to show (can also be set later with `setModelGraph`)
     */
    constructor(controller:ASceneController, modelGraph?:AModelGraph, ...args:any[]) {
        super();
        this._controller = controller;
        this._threeJSScene = new THREE.Scene();
        this._threejs = new THREE.Group();
        this._threejs.matrixAutoUpdate=false;
        this._threeJSScene.add(this.threejs);
        this.onModelNodeAdded = this.onModelNodeAdded.bind(this);
        this.onModelNodeRemoved = this.onModelNodeRemoved.bind(this);
        this.initModelViewSpecs();
        if(modelGraph) {
            this.setModelGraph(modelGraph);
        }
    }

    /** The `THREE.Scene` this view renders. */
    get threeJSScene(){
        return this._threeJSScene;
    }

    /** The root group inside `threeJSScene` that top-level node views are added to. */
    get threejs():THREE.Group{
        return this._threejs as THREE.Group;
    }

    /** Returns all node views in this scene view as a list. */
    getNodeViews():AGLNodeView[]{
        let rval:AGLNodeView[] = [];
        for (let v in this.viewMap){
            let views = this.viewMap[v];
            for (let vkey in views){
                rval.push(this.viewMap[v][vkey] as AGLNodeView);
            }
        }
        return rval;
    }

    /**
     * Registers the built-in model class to view class mappings, which decide which view class is created for new
     * node models: `ACameraModel3D`/`ACameraModel2D` → `ACameraView`, `AGroupNodeModel2D`/`AGroupNodeModel3D` →
     * `AGroupNodeView`, `APointLightModel3D` → `APointLightView3D`, and `ALoadedModel3D` → `ALoadedView3D`. Called
     * from the constructor.
     */
    initModelViewSpecs():void{
        // Camera (3D and 2D: `ACameraView` only uses members both camera classes have, so one view class renders both)
        this.addModelViewSpec(ACameraModel3D, ACameraView);
        this.addModelViewSpec(ACameraModel2D, ACameraView);

        // Group node (2D)
        this.addModelViewSpec(AGroupNodeModel2D, AGroupNodeView);

        // Group node (3D)
        this.addModelViewSpec(AGroupNodeModel3D, AGroupNodeView);

        // Point light
        this.addModelViewSpec(APointLightModel3D, APointLightView3D);

        // Loaded model
        this.addModelViewSpec(ALoadedModel3D, ALoadedView3D);
    }

    /**
     * Creates a view for `nodeModel`. Uses `viewClass` if given, otherwise the class registered for the model's class
     * (see `addModelViewSpec`), otherwise `defaultViewClass`. Throws if none applies. The view is not added to the
     * view map or the render hierarchy.
     * @returns the new view
     */
    createViewForNodeModel(nodeModel: ANodeModel, viewClass?:ClassInterface<ANodeView>, ...args:any[]){
        if(viewClass === undefined){
            let spec = this.classMap.getSpecForModel(nodeModel);
            if(spec !== undefined){
                viewClass = spec.viewClass;
            }else{
                if(this.defaultViewClass){
                    viewClass = this.defaultViewClass
                }
            }
        }

        if(viewClass !== undefined){
            let view = new viewClass();
            view.setController(this.controller);
            view.setModel(nodeModel);
            return view;
        } else{
            throw new Error(`Unsure how to create view for ${nodeModel} with class ${nodeModel.constructor.name}`)
        }
    }


    /** Removes `view`'s Three.js object from the root group and removes the view from the view map. */
    removeView(view:AView){
        this.threejs.remove((view as AGLNodeView)._threejs);
        delete this.viewMap[view.modelID][view.uid];
    }

    /** Removes `view`'s Three.js object from the root group, disposes its graphics, and removes it from the view map. */
    releaseView(view:AView){
        this.threejs.remove((view as AGLNodeView)._threejs);
        this.viewMap[view.modelID][view.uid].disposeGraphics();
        delete this.viewMap[view.modelID][view.uid];

    }


    /** Sets the scene background to a cube texture (a sky box). */
    setBackgroundCubeTexture(cubeTexture:THREE.CubeTexture):void{
        this.threeJSScene.background=cubeTexture;
    }

    /** Sets the scene background to a texture. */
    setBackgroundTexture(texture:ATexture){
        this._threeJSScene.background = texture.threejs
    }

    /**
     * Rotates the background (e.g. a cube texture) by `transform`. The scene is rotated by `transform` and the root
     * group by its inverse, so the scene's content stays where it was. Only rotations are supported.
     */
    setBackgroundTransform(transform:Quaternion){
        this._threeJSScene.rotation.setFromQuaternion(transform);
        this.threejs.rotation.setFromQuaternion(transform.getInverse());
        this._threeJSScene.matrixWorldNeedsUpdate=true;
        this.threejs.matrixWorldNeedsUpdate=true;
    }

    /**
     * Creates a view for a newly added node model that has no view yet and adds it to the view map.
     * @protected
     */
    protected _onNewModelNodeAdded(nodeModel:ANodeModel, viewClass?:ClassInterface<ANodeView>, ...args:any[]){
        let newView = this.createViewForNodeModel(nodeModel, viewClass, ...args);
        this.addView(newView);
    }

    /**
     * Called whenever a node model is added to the model graph (every scene view showing that graph gets the call).
     * Same as `updateViewForModelAdded(nodeModel)`.
     */
    onModelNodeAdded(nodeModel: ANodeModel, ...args:any[]) {
        return this.updateViewForModelAdded(nodeModel, undefined, ...args);
    }

    /**
     * Creates a view for `nodeModel` if it doesn't have one, then attaches the view under its parent's view (or the
     * root group). Throws if the model has more than one view. Called by `onModelNodeAdded`; you can also call it
     * directly when building a custom scene view.
     * @param viewClass optional view class to use instead of the registered one
     */
    updateViewForModelAdded(nodeModel:ANodeModel, viewClass?:ClassInterface<ANodeView>, ...args:any[]) {
        let modelViewList = this.getViewListForModel(nodeModel);
        if(modelViewList.length<1){
            this._onNewModelNodeAdded(nodeModel, viewClass, ...args);
            modelViewList = this.getViewListForModel(nodeModel);
        }
        if(modelViewList.length>0) {
            if(modelViewList.length>1){
                throw new Error("Have not implemented multiple views for a given model in one scene controller yet!")
            }
            this._attachViewToParent(modelViewList[0], nodeModel);
        }
    }

    /** Adds `view`'s Three.js object to the root group. */
    protected addNodeViewToRoot(view: ANodeView): void {
        this.threejs.add((view as AGLNodeView).threejs);
    }

    /** Detaches the model's view from its Three.js parent. Throws unless the model has exactly one view. */
    onModelNodeRemoved(nodeModel: ANodeModel) {
        let viewList = this.getViewListForModel(nodeModel);
        if(viewList.length !== 1){
            throw new Error(`invalid number of views for node ${nodeModel}. ViewList ${viewList}`);
        }
        (viewList[0] as AGLNodeView).threejs.removeFromParent();
    }

    // onModelNodeReleased, disposeViews and release() are inherited from ASceneView.
}

/** A map from name to {@link AGLSceneView}, with helpers that apply an operation to every scene view. */
export class AGLSceneViewMap extends Map<string, AGLSceneView>{
    constructor(...args:any[]) {
        super(...args);
    }

    /** Calls `f` on every scene view. */
    mapOverSceneViews(f:(rp:AGLSceneView)=>void){
        this.forEach((value, key)=>{
            f(value);
        })
    }

    /** Calls `setBackgroundTransform(transform)` on every scene view. */
    setCommonBackgroundTransform(transform:Quaternion){
        function setbgt(rp:AGLSceneView){
            rp.setBackgroundTransform(transform);
        }
        this.mapOverSceneViews(setbgt);
    }

    /** Calls `setBackgroundCubeTexture(cubeTexture)` on every scene view. */
    _setBackgroundCubeTexture(cubeTexture:THREE.CubeTexture){
        function setbgt(rp:AGLSceneView){
            rp.setBackgroundCubeTexture(cubeTexture);
        }
        this.mapOverSceneViews(setbgt);
    }

    /** Releases every scene view. */
    release(){
        this.forEach((value, key)=>{
            value.release();
        })
    }
}


