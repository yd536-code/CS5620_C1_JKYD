import {AObject} from "../base";
import {AModelGraph} from "./AModelGraph";
import {AGLSceneView, AGLSceneViewMap} from "./AGLSceneView";
import {ARenderTarget} from "../rendering/target/ARenderTarget";
import {ASceneController} from "./ASceneController";

/**
 * Holds an {@link AGLSceneController}'s scene views (by name) and its render targets.
 */
export class ASceneViewsAndTargets extends  AObject{
    protected _sceneViews:AGLSceneViewMap=new AGLSceneViewMap();
    _renderTargets:ARenderTarget[]=[];


    //<editor-fold desc="Render Targets">

    /** Render targets added with `addRenderTarget`. */
    get renderTargets(){
        return this._renderTargets;
    }

    /** Adds a floating-point RGBA render target of the given size (in pixels). */
    addRenderTarget(width:number, height:number){
        this.renderTargets.push(ARenderTarget.CreateFloatRGBATarget(width, height));
    }

    //</editor-fold>


    //<editor-fold desc="Scene Views">

    /** The scene views, keyed by name. */
    get sceneViews():AGLSceneViewMap{
        return this._sceneViews;
    }

    /** Calls `f` on every scene view. */
    mapOverSceneViews(f:(rp:AGLSceneView)=>void){
        this.sceneViews.mapOverSceneViews(f);
    }

    /**
     * Creates an {@link AGLSceneView} that shows `modelGraph` and stores it under `name`. Throws if a scene view with
     * that name already exists.
     * @returns the new scene view
     */
    createSceneView(sceneController:ASceneController, name:string, modelGraph:AModelGraph){
        if(this.sceneViews.has(name)){
            throw new Error(`SceneView ${name} already exists`);
        }
        this.sceneViews.set(name, new AGLSceneView(sceneController, modelGraph));
        return this.sceneViews.get(name);
    }
    //</editor-fold>

    /** Releases all scene views and render targets. */
    release(){
        this.releaseSceneViews();
        this.releaseTargets();
    }

    /** Releases all scene views. */
    releaseSceneViews(){
        this.sceneViews.release()
    }

    /** Releases all render targets. */
    releaseTargets():void{
        for(let a of this.renderTargets){
            a.release();
        }
    }

}
