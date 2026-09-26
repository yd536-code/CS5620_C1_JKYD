import {AObject} from "../aobject";
import {AView} from "./AView";
import {AModelInterface} from "./AModel";
import type {ANodeView} from "../../scene/nodeView/ANodeView";


/** Map from model uid to model. */
export type MVMModelMap = {[modelID: string]:AModelInterface};
/** Map from model uid to that model's views, keyed by view uid. */
export type MVMViewMap = {[modelID: string]: {[viewID: string]:ANodeView}};



/** Something that keeps track of a set of models by uid (implemented by `AModelGraph` and `ASceneModel`). */
export interface HasModelMap extends AObject{
    /** The tracked models, keyed by uid. */
    get modelMap():MVMModelMap;
    // _addModel(model:AModelInterface):void;
    // _removeModel(model:AModelInterface):void;
    /** Whether `model` is tracked. */
    hasModel(model:AModelInterface):boolean;
    /** Whether a model with this uid is tracked. */
    hasModelID(modelID:string):boolean;
}

/** Something that keeps track of the views for each model (implemented by `ASceneView` and `ASceneController`). */
export interface HasModelViewMap{
    /** The views, keyed by model uid and then view uid. */
    get viewMap():MVMViewMap;
    /** Registers a view under its model. */
    addView(view:AView):void;
    /** Unregisters a view. */
    removeView(view:AView):void;
    /** Returns the views registered for `model`. */
    getViewListForModel(model:AModelInterface):AView[];
    /** Whether `view` is registered. */
    hasView(view:AView):boolean;
    /** Disposes of all registered views. */
    disposeViews():void;
}




// export class AModelViewMap extends AObject implements HasModelViewMap{
//     protected _modelMap:MVMModelMap = {};
//     protected _viewMap: MVMViewMap = {};
//
//     /** Get set map */
//     get modelMap(){return this._modelMap;}
//     get viewMap(){return this._viewMap;}
//
//     hasModel(model:AModelInterface){
//         return (model.uid in this.modelMap);
//     }
//
//     _hasModelID(modelID:string){
//         return (modelID in this.modelMap);
//     }
//
//     addModel(model:AModelInterface){
//         if(this.hasModel(model)){
//             throw new Error(`Model ${model} with uid ${model.uid} already in AModelViewMap`)
//         }
//         this.modelMap[model.uid]=model;
//         this.viewMap[model.uid]={};
//     }
//
//     removeModel(model:AModelInterface){
//         delete this._modelMap[model.uid];
//         delete this._viewMap[model.uid];
//     }
//
//     hasView(view:AView){
//         return (this._hasModelID(view.modelID) && view.uid in this.modelMap);
//     }
//
//     addView(view:AView){
//         let modelViews = this.viewMap[view.modelID][view.uid]=view;
//     }
//
//     removeView(view:AView){
//         delete this.viewMap[view.modelID][view.uid];
//     }
//
//     getViewListForModel(model:AModelInterface){
//         if(this.hasModel(model)) {
//             return Object.values(this.viewMap[model.uid]);
//         }
//         else{
//             return [];
//         }
//     }
// }

