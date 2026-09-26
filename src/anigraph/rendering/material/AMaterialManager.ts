import * as THREE from "three";
import {LineBasicMaterialParameters, MeshBasicMaterialParameters} from "three";
import {ALabel, AObject} from "../../base";
import {AMaterialModelBase} from "./AMaterialModel";
import {AMaterial} from "./AMaterial";
import {Color} from "../../math";
import {MeshStandardMaterialParameters} from "three/src/materials/MeshStandardMaterial";
import {AShaderModel, AShaderModelBase} from "./AShaderModel";
import {AShaderMaterial} from "./AShaderMaterial";
import {ALineMaterialModel} from "./ALineMaterialModel";
// import {ATexture} from "../ATexture";
import {DefaultMaterials} from "./MaterialConstants";

/**
 * Built-in model for `THREE.MeshBasicMaterial` (unlit, flat color), registered as `DefaultMaterials.Basic`.
 * Defaults to a green, double-sided, transparent-capable material.
 */
@ALabel("ABasicMaterialModel")
export class  ABasicMaterialModel extends AMaterialModelBase<MeshBasicMaterialParameters>{
    constructor() {
        super(
            DefaultMaterials.Basic,
            THREE.MeshBasicMaterial,
            {},
            {
                color: Color.FromString("#00aa00").asThreeJS(),
                transparent: true,
                opacity: 1,
                side: THREE.DoubleSide,
                depthWrite: true
            });
    }
    /** The shared `color` parameter. Setting it only affects materials created afterward. */
    get color(){
        return Color.FromThreeJS(this.sharedParameters['color']);
    }
    set color(c:Color){
        this.sharedParameters['color'] = c.asThreeJS();
    }
    /** Returns an opacity slider for `material`. */
    getMaterialGUIParams(material:AMaterial){
        const self = this;
        return {
            // ...AMaterialModelBase.MaterialGUIColorControl(material),
            ...AMaterialModelBase.MaterialGUIControl(material, 'opacity', 1, {
                min:0,
                max:1,
                step:0.01
            })
        }
    }
}

/**
 * Built-in model for `THREE.MeshStandardMaterial` (Three.js physically based shading), registered as
 * `DefaultMaterials.Standard`. Defaults to non-metallic, fully rough, and double-sided.
 */
@ALabel("AStandardMaterialModel")
export class  AStandardMaterialModel extends AMaterialModelBase<MeshStandardMaterialParameters> {
    constructor() {
        super(
            DefaultMaterials.Standard,
            THREE.MeshStandardMaterial,
            {},
            {
                // color: Color.FromString('#888888').asThreeJS(),
                transparent: true,
                opacity: 1,
                side: THREE.DoubleSide,
                depthWrite: true,
                metalness: 0.0,
                roughness: 1.0,
            });
    }

    /** Returns opacity, roughness, and metalness sliders for `material`. */
    getMaterialGUIParams(material:AMaterial){
        const self = this;
        return {
            // ...AMaterialModelBase.MaterialGUIColorControl(material),
            ...AMaterialModelBase.MaterialGUIControl(material, 'opacity', 1, {
                min:0,
                max:1,
                step:0.01
            }),
            ...AMaterialModelBase.MaterialGUIControl(material, 'roughness', 1, {
                min:0,
                max:1,
                step:0.01
            }),
            ...AMaterialModelBase.MaterialGUIControl(material, 'metalness', 0, {
                min:0,
                max:1,
                step:0.01
            })
        }
    }
}




/**
 * Built-in model for `THREE.LineBasicMaterial` (thin lines, per-vertex colors), registered as
 * `DefaultMaterials.LineBasicMaterial`.
 */
@ALabel("ABasicLineMaterialModel")
export class ABasicLineMaterialModel extends AMaterialModelBase<LineBasicMaterialParameters>{
    constructor() {
        super(
            DefaultMaterials.LineBasicMaterial,
            THREE.LineBasicMaterial,
            {},
            {
                transparent: true,
                opacity: 1,
                side: THREE.DoubleSide,
                depthWrite: true,
                vertexColors: true
            });
    }

    /** Returns an opacity slider for `material`. */
    getMaterialGUIParams(material:AMaterial){
        const self = this;

        return {
            // ...AMaterialModelBase.MaterialGUIColorControl(material),
            ...AMaterialModelBase.MaterialGUIControl(material, 'opacity', 1, {
                min:0,
                max:1,
                step:0.01
            })
        }
    }

}


/**
 * Registry of material models by name (the app's instance is `AssetManager.materials`). The constructor registers
 * the built-in Basic, Standard, LineBasicMaterial, and LineMaterial models; shader models are added later (e.g. by
 * `AssetManager.loadShaderMaterialModel`).
 */
export class AMaterialManager extends AObject{
    /** Registered material models, keyed by name. */
    materials:{[name:string]:AMaterialModelBase<any>};
    static DefaultMaterials = DefaultMaterials;
    /** Resolves once the built-in models have been registered. */
    public materialsLoadedPromise:Promise<void>;

    get ClassConstructor(){
        return (this.constructor as (typeof AMaterialManager));
    }
    constructor() {
        super();
        this.materials={};
        this.materialsLoadedPromise = this.initMaterialModels();
    }

    /** Registers the built-in (non-shader) material models. Called by the constructor. */
    async initMaterialModels(){

        const self = this;

        this.setMaterialModel(
            DefaultMaterials.Basic,
            new ABasicMaterialModel()
        );

        this.setMaterialModel(
            DefaultMaterials.Standard,
            new AStandardMaterialModel()
        );

        this.setMaterialModel(
            DefaultMaterials.LineBasicMaterial,
            new ABasicLineMaterialModel()
        )
        this.setMaterialModel(
            DefaultMaterials.LineMaterial,
            new ALineMaterialModel()
        )

        // await AssetManager.shaders._shaderPromises['standard'];
        // self.setMaterialModel(
        //     'Standard',
        //     new AShaderModel('standard')
        // )

        // await AssetManager.shaders._shaderPromises['normal'];
        // self.setMaterialModel(
        //     'Normals',
        //     new AShaderModel('normal')
        // )
    }

    /** Creates a material from the built-in `LineMaterial` model. */
    createLineShaderMaterial(){
        return this.CreateMaterial(DefaultMaterials.LineMaterial);
    }
    /** Creates a material from the `rgba` shader model. Throws if that model hasn't been loaded and registered yet. */
    createRGBAShaderMaterial(){
        return this.CreateMaterial(DefaultMaterials.RGBA_SHADER);
    }
    // createTexturedShaderMaterial(){
    //     return this.CreateMaterial(DefaultMaterials.TEXTURED_SHADER);
    // }
    /** Creates a material from the built-in `Basic` model (a `THREE.MeshBasicMaterial`, not a custom shader). */
    createBasicShaderMaterial(){
        return this.CreateMaterial(DefaultMaterials.Basic);
    }

    /** Returns `{name: name}` for every registered model, for use as a control-panel dropdown. */
    getGUIMaterialOptionsList(){
        // await this.materialsLoadedPromise;
        let rval:{[name:string]:string}= {};
        for(let m in this.materials){
            rval[m]=m;
        }
        return rval;
    }

    /**
     * Registers `m` under `name`, replacing any model already there. For shader models, the model is only
     * registered after its shader sources finish loading, so await this before looking the model up.
     */
    async setMaterialModel(name:string, m:AMaterialModelBase<any>){
        if(m instanceof AShaderModelBase){
            await m.sourcesLoadedPromise;
        }
        this.materials[name]=m;
    }

    /** Returns the model registered under `name`, or `undefined`. */
    getMaterialModel(name:string){
        return this.materials[name];
    }

    /** Same as `getMaterialModel`, typed as an {@link AShaderModel} (no runtime check). */
    getShaderMaterialModel(name:string):AShaderModel{
        return this.materials[name] as AShaderModel;
    }

    /**
     * Creates a material from the model registered under `modelName`, passing `args` to its `CreateMaterial`.
     * Throws if no such model is registered.
     */
    CreateMaterial(modelName:string, ...args:any[]){
        return this.getMaterialModel(modelName).CreateMaterial(...args);
    }

    /** Same as `CreateMaterial`, typed as an {@link AShaderMaterial} (no runtime check). */
    CreateShaderMaterial(modelName:string, ...args:any[]){
        return this.getMaterialModel(modelName).CreateMaterial(...args) as AShaderMaterial;
    }
}

