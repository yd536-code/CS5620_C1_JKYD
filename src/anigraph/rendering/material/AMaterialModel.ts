import * as THREE from "three";
import {ColorRepresentation} from "three";
import type {MaterialParameters} from "three/src/materials/Material";
import {ALabel} from "../../base/aserial/ASerializable";
import {AObjectState} from "../../base/aobject/AObject";
import {AModel} from "../../base/amvc/AModel";
// import {AObjectState, AModel} from "../../base/aserial";
import type {ClassInterface} from "../../basictypes"
import {AMaterial} from "./AMaterial";
import {Color} from "../../math";


/**
 * Three.js material parameters, with `color` accepting any Three.js color representation.
 * @internal
 */
export type MaterialParams = {
    [P in keyof MaterialParameters]?:MaterialParameters[P];
} & {
    color?:ColorRepresentation|undefined;
};

/**
 * A plain object of material parameters, keyed by name.
 * @internal
 */
export type ParamDict = {[name:string]:any};


/**
 * Base class for material models. A material model is a template for a kind of material: it stores the Three.js
 * material class to build (`materialClass`), default parameters, and shared parameters. Models are usually created
 * once and registered by name in the `AMaterialManager` (`AssetManager.materials`); each call to
 * `CreateMaterial` then makes a new {@link AMaterial} instance from the template.
 *
 * @typeParam ParamInterface the parameter dictionary type for the Three.js material class
 */
export abstract class AMaterialModelBase<ParamInterface extends ParamDict> extends AModel{
    /** Parameters applied to every material created from this model (they override `defaults`). */
    @AObjectState sharedParameters!:{[name:string]:any};
    public _defaults!:ParamInterface;
    /** The Three.js material class that `_CreateTHREEJS` instantiates. */
    public materialClass!:ClassInterface<THREE.Material>;
    /** The name this model is registered under. */
    public name!:string;
    /** Default parameters for materials created from this model. */
    get defaults(){return this._defaults;}
    set defaults(v:ParamInterface){this._defaults=v;}

    // abstract get color():Color;
    // abstract set color(c:Color);

    /**
     * Sets one shared parameter. Warns that this is not fully implemented: existing materials are not updated;
     * only materials created afterward see the new value.
     */
    setSharedParam(name:string, val:any){
        console.warn("Shader params not implemented yet. Need to add listeners to model.");
        this.sharedParameters[name]=val;
    }
    /** Replaces all shared parameters. Only affects materials created afterward. */
    setSharedParameters(params:ParamInterface){
        this.sharedParameters = params;
    }

    /** Returns control-panel specs for editing `material`. Empty by default; subclasses override. */
    getMaterialGUIParams(material:AMaterial){
        return {}
    }

    /**
     * Builds a single control spec `{[paramName]: {value, onChange, ...otherSpecs}}`. Shared by
     * `MaterialGUIControl`/`MaterialGUIColorControl` here and `AShaderModelBase.ShaderUniformGUIControl`/
     * `ShaderUniformGUIColorControl`. The displayed value is `toValue(rawValue)` when `rawValue` is truthy and
     * `fallback` otherwise -- note a stored `0` shows `fallback`. `otherSpecs` is spread last, so it can override
     * `value`/`onChange`.
     */
    static GUIControlSpec(paramName:string, rawValue:any, fallback:any, onChange:(v:any)=>void,
                          toValue:(raw:any)=>any = (raw)=>raw, otherSpecs?:{[name:string]:any}){
        let rval:{[name:string]:any} = {};
        rval[paramName] = {
            value: rawValue?toValue(rawValue):fallback,
            onChange: onChange,
            ...otherSpecs
        }
        return rval;
    }

    /** Returns a color-picker control spec that edits the material parameter `paramKey` (default `'color'`). */
    static MaterialGUIColorControl(material:AMaterial, paramKey?:string){
        const paramName = paramKey?paramKey:'color';
        return AMaterialModelBase.GUIControlSpec(paramName, material.getValue(paramName), "#000000",
            (v: string) => {
                let selectedColor = Color.FromString(v);
                material.setValue(paramName, selectedColor.asThreeJS());
            },
            (raw) => Color.FromThreeJS(raw).toHexString());
    }

    /**
     * Returns a control spec that edits the material parameter `paramName` with `material.setValue`.
     * @param otherSpecs extra control options such as `{min, max, step}`
     */
    static MaterialGUIControl(material:AMaterial, paramName:string, defaultValue:any, otherSpecs:{[name:string]:any}){
        return AMaterialModelBase.GUIControlSpec(paramName, material.getValue(paramName), defaultValue,
            (v: string) => {
                material.setValue(paramName, v);
            },
            undefined, otherSpecs);
    }

    /**
     * @param name the name to register the model under
     * @param materialClass the Three.js material class to build
     * @param defaults default material parameters
     * @param sharedParams parameters applied to every material (override `defaults`)
     */
    constructor(name?:string, materialClass?:ClassInterface<THREE.Material>, defaults?:ParamInterface, sharedParams?:ParamInterface, ...args:any[]) {
        super();
        if(name){this.name=name;}
        if(materialClass){this.materialClass=materialClass;}
        if(sharedParams){this.sharedParameters=sharedParams;}else{this.sharedParameters={};}
        if(defaults){this.defaults=defaults;}
    }

    /** Creates a new Three.js material from `materialClass`, `defaults`, and `sharedParameters`. */
    _CreateTHREEJS(){
        return new this.materialClass({
            ...this.defaults,
            ...this.sharedParameters
        }, );
    }

    /** Creates a new {@link AMaterial} from this model. */
    CreateMaterial(...args:any[]){
        let material =  new AMaterial();
        material.init(this);
        material.setValues({...this.defaults, ...this.sharedParameters});
        return material;
    }

}


/**
 * A concrete material model for any Three.js material class.
 *
 * @example
 * ```ts
 * const model = new AMaterialModel("myBasic", THREE.MeshBasicMaterial, {transparent: true}, {opacity: 0.5});
 * const material = model.CreateMaterial(); // transparent, with opacity 0.5
 * ```
 */
@ALabel("AMaterialModel")
export class  AMaterialModel extends AMaterialModelBase<MaterialParams>{
    /**
     * @param name the name to register the model under
     * @param materialClass the Three.js material class to build
     * @param defaults default material parameters
     * @param sharedParams parameters applied to every material (override `defaults`)
     */
    constructor(name?:string, materialClass?:ClassInterface<THREE.Material>, defaults?:MaterialParameters, sharedParams?:MaterialParams, ...args:any[]) {
        super(name, materialClass, defaults, sharedParams);
    }


}

