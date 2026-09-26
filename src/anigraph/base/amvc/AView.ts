import {AObject} from "../aobject/AObject";
import {AController} from "./AController";


// export interface AViewInterface extends AObject {
//     model:AModelInterface;
//     controller:AControllerInterface;
// }

/** A callback that takes a view (plus any extra arguments). */
export type ViewCallback = (view:AView, ...args: any[]) => any;

/**
 * Base class for views in AniGraph's model-view-controller design. A view decides how a model is drawn by one
 * rendering backend and holds that backend's render objects. This base class doesn't depend on a backend: it only
 * has a uid and subscriptions (from {@link AObject}) and a reference to its controller. Backend-specific render
 * objects live on subclasses (e.g. `AGLNodeView`, `ATwoJSNodeView`).
 */
export abstract class AView extends AObject{
    protected _controller!:AController;
    /** The controller this view belongs to. */
    get controller(){return this._controller;}

    /** Sets the controller this view belongs to. */
    setController(controller:AController){
        this._controller = controller;
    }

    /** The uid of the model this view draws. */
    abstract get modelID():string;


    // constructor(controller:AController){
    //     super();
    //     this._controller = controller
    // }


    // //##################//--viewRef--\\##################
    // // viewRefs is a place to hold references that aren't class members.
    // //<editor-fold desc="viewRef">
    // public viewRefs:{[name:string]:any}={};
    // setViewRef(name:string, value:any){
    //     this.viewRefs[name]=value;
    // }
    // getViewRef(name:string){
    //     return this.viewRefs[name];
    // }
    // clearViewRefs(){
    //     this.viewRefs={};
    // }
    // //</editor-fold>
    // //##################\\--viewRef--//##################

}
