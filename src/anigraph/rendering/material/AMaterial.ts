import {folder} from "leva";
import {ASerializable, AObject} from "../../base";
import {MaterialParameters} from "three/src/materials/Material";
import {AMaterialModel} from "./AMaterialModel";
import {Color} from "../../math";
import * as THREE from "three";
import {AssetManager} from "../../fileio/AAssetManager";

/** Event names signaled by {@link AMaterial}. */
export enum AMaterialEvents{
    CHANGE='MATERIAL_CHANGE',
    UPDATE='MATERIAL_UPDATE'
}

/**
 * A material instance: wraps a live `THREE.Material` built from an {@link AMaterialModel} (the "template" that holds
 * the material class and default parameters). Create one with the model's `CreateMaterial()` or
 * `AssetManager.CreateMaterial(name)` rather than with `new`.
 *
 * Only `setValue`/`setValues` signal `AMaterial.Events.UPDATE`. The `CHANGE` event is signaled by the node model
 * when a node's material is replaced, not by the material itself.
 */
@ASerializable("AMaterial")
export class AMaterial extends AObject{
    protected _model!:AMaterialModel;
    /** The wrapped Three.js material. Prefer the `threejs` getter. */
    public _material!:THREE.Material;
    static Events = AMaterialEvents;

    /**
     * Returns a new material that shares `material`'s model and has a clone of its `THREE.Material`.
     * Called on a subclass, creates an instance of that subclass. Subclasses with more fields copy them too
     * ({@link AShaderMaterial.Clone} copies its uniforms and textures).
     */
    static Clone(material:AMaterial){
        let clone = new this();
        clone._model = material.model;
        clone._material = material._material.clone();
        return clone;
    }


    /** Values for {@link AMaterial.setRenderSide}: which faces of the geometry get drawn. */
    static GEOMETRY_SIDE = {
        FRONT:THREE.FrontSide,
        BACK:THREE.BackSide,
        BOTH:THREE.DoubleSide
    };
    /** The wrapped Three.js material. */
    get threejs(){return this._material;}

    /** The material model this material was created from. */
    get model(){
        return this._model;
    }

    constructor(...args:any[]) {
        super();
    }

    /** Sets the model and creates the underlying `THREE.Material` from it. */
    init(model:AMaterialModel){
        this.setModel(model);
    }

    /** Whether the material uses per-vertex colors (the Three.js `vertexColors` parameter). */
    get usesVertexColors(){return this.getValue('vertexColors');}
    set usesVertexColors(value:boolean|undefined){this.setValue('vertexColors',value);}

    /** Whether depth testing is enabled when drawing with this material. */
    get depthTest(){return this.getValue('depthTest');}
    set depthTest(value:boolean|undefined){this.setValue('depthTest',value)}

    /** Whether drawing with this material writes to the depth buffer. */
    get depthWrite(){return this.getValue('depthWrite');}
    set depthWrite(value:boolean|undefined){this.setValue('depthWrite',value)}

    /** The depth comparison function (a `THREE.DepthModes` value). */
    set depthFunc(value:THREE.DepthModes){this.setValue('depthFunc',value)}
    get depthFunc(){return this.getValue('depthFunc');}

    /** Whether the material is rendered as transparent (uses its opacity/alpha). */
    get transparent(){return this.getValue('transparent');}
    set transparent(value:boolean|undefined){this.setValue('transparent',value);}


    /** Whether the geometry is drawn as wireframe. */
    get wireframe(){
        return this.getValue("wireframe")
    }
    set wireframe(value:boolean){
        this.setValue('wireframe',value);
    }

    /** Whether objects using this material are drawn. */
    get visible(){return this.getValue('visible');}
    set visible(value:boolean|undefined){this.setValue('visible',value)}


    /**
     * Sets which faces are drawn. Writes the Three.js material directly and does not signal an event.
     * @param renderSide `AMaterial.GEOMETRY_SIDE.FRONT`, `.BACK`, or `.BOTH`
     */
    setRenderSide(renderSide:THREE.Side){
        this._material.side = renderSide;
    }

    //##################//--Values--\\##################
    //<editor-fold desc="Values">
    /** Returns the material's `color` parameter as a {@link Color}, or a default green if it has none. */
    getModelColor(){
        let c = this.getValue('color');
        if(c){
            return Color.FromThreeJS(c);
        }else{
            return Color.FromString("#77bb77");
        }
    }
    /** Sets the material's `color` parameter. */
    setModelColor(v:Color|THREE.Color){
        if(v instanceof  Color){
            this.setValue('color', v.asThreeJS());
        }else{
            this.setValue('color', v);
        }
    }
    /** Sets one Three.js material parameter (e.g. `'opacity'`). See {@link AMaterial.setValues}. */
    setValue(name:string, value:any){
        let vals:{[name:string]:any}={};
        vals[name]=value;
        this.setValues(vals);
    }
    /**
     * Sets Three.js material parameters on the live material, then signals `AMaterial.Events.UPDATE` with `values`.
     * These edits are not recorded anywhere else, so `toJSON` does not save them.
     */
    setValues(values:MaterialParameters){
        this.threejs.setValues(values);
        this.signalEvent(AMaterial.Events.UPDATE, values);
    }
    /** Returns the named property of the live Three.js material (e.g. `'opacity'`). */
    getValue(name:string):any{
        // @ts-ignore
        return this.threejs[name];
    }

    /** Sets the Three.js blending mode. Writes the material directly and does not signal an event. */
    setBlendingMode(mode:THREE.Blending){
        this.threejs.blending=mode;
    }

    //</editor-fold>
    //##################\\--Values--//##################

    /** Sets the model and creates a new `THREE.Material` from it (via the model's `_CreateTHREEJS`). */
    setModel(model:AMaterialModel){
        this._model = model;
        this._material = model._CreateTHREEJS();
        // this.threejs.setValues(this._model.defaults);
    }

    /** Returns control-panel specs for this material, in a `MaterialProps` folder (built by the model). */
    getMaterialGUIParams() {
        const self = this;
        return {
            MaterialProps: folder(
                self.model.getMaterialGUIParams(self),
                { collapsed: false }
            ),
        }
    }

    /**
     * Serializes the material as a reference to its model: `{modelName}`. Because it wraps a live
     * `THREE.Material`, the material is not saved field by field; `fromJSON` rebuilds it with the registered model's
     * `CreateMaterial()`.
     *
     * Limitation: parameters changed afterward with `setValue`/`setValues` are not saved, so a material tuned after
     * creation comes back with its model's defaults. {@link AShaderMaterial.toJSON} additionally saves its uniforms
     * and textures.
     */
    toJSON(){
        return {modelName: this.model?.name};
    }

    /**
     * Rebuilds a material from `toJSON` output by looking up `modelName` in `AssetManager.materials`. If the model
     * isn't registered (or no name was saved), warns and returns a bare `AMaterial` with no `THREE.Material`.
     */
    static fromJSON(data:{modelName?:string}){
        if(data.modelName){
            const model = AssetManager.materials.getMaterialModel(data.modelName);
            if(model){
                return model.CreateMaterial();
            }
            if(process.env.NODE_ENV !== "production"){
                console.warn(`AMaterial.fromJSON: no material model registered under "${data.modelName}" -- reviving a bare, unconfigured AMaterial instead. Was this model registered (e.g. via AssetManager.loadShaderMaterialModel) before loading?`);
            }
        }else if(process.env.NODE_ENV !== "production"){
            console.warn(`AMaterial.fromJSON: saved data has no "modelName" -- reviving a bare, unconfigured AMaterial.`);
        }
        return new this();
    }

    /** Frees the GPU resources of the wrapped Three.js material. */
    dispose(){
        this._material.dispose();
    }

    release() {
        this.dispose();
        super.release();
    }

}

