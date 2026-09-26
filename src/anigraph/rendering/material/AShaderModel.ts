import * as THREE from "three";
import {IUniform} from "three";
import {ATexture} from "../ATexture";
import {AShaderProgramSource} from "./ShaderManager";
import {AMaterialModelBase} from "./AMaterialModel";
import {AShaderMaterial} from "./AShaderMaterial";
import type {ShaderMaterialParameters} from "three/src/materials/ShaderMaterial";
import {Color} from "../../math";
import {folder} from "leva";
import {TextureKeyForName, TextureProvidedKeyForName} from "../../defines";
import {assert, ClassInterface} from "../../basictypes";
import {AControlSpecGroup} from "../../controlpanel/AControlSpecGroup";
import {GetAAppState} from "../../appstate/AAppState";
import {GetAppState} from "../../appstate";
import {ALabel} from "../../base";
import {AssetManager} from "../../fileio/AAssetManager";

/** A dictionary of shader uniforms, keyed by uniform name (each entry is `{value, type?}`). */
export type ShaderUniformDict = {[name:string]:IUniform<any>};




/**
 * Base class for material models backed by a custom GLSL shader. Holds the shader source (loaded through
 * `AssetManager.shaders`), Three.js shader settings (`lights`, `transparent`, ...), a default uniform dictionary, and
 * default textures. `CreateMaterial` makes a new {@link AShaderMaterial} (or `ShaderMaterialClass`) instance.
 *
 * The model's `uniforms` and `textures` are copied into each material when it is created, so changing them later
 * does not affect materials that already exist.
 */
export abstract class AShaderModelBase<ParamInterface extends {[name:string]:any}> extends AMaterialModelBase<ParamInterface>{
    /** Default uniforms, copied into the Three.js material of each new material. */
    uniforms!:ShaderUniformDict;
    /** Default textures, copied into each new material's `textures`. */
    public textures:{[name:string]:ATexture|undefined}={};
    /** The material class `CreateMaterial` instantiates. Subclasses set this to use their own material subclass. */
    ShaderMaterialClass:ClassInterface<AShaderMaterial>=AShaderMaterial;

    // UniformSpecs:[]

    protected _shaderSource!:AShaderProgramSource;
    /** The vertex shader GLSL source. */
    get vertexSource(){return this._shaderSource.vertexSource;}
    /** The fragment shader GLSL source. */
    get fragSource(){return this._shaderSource.fragSource;}

    protected _shaderSettings:ShaderMaterialParameters={};
    /** Three.js `ShaderMaterial` parameters passed when a material is created (e.g. `lights`, `transparent`, `side`). */
    get settingArgs(){return this._shaderSettings;}
    /** Whether the shader receives Three.js scene light uniforms. */
    get usesLights(){return this.settingArgs['lights'];}
    /** Whether materials from this model are transparent. Changes affect only materials created afterward. */
    get supportsTransparency(){return this.settingArgs['transparent'];}
    set supportsTransparency(value:boolean|undefined){
        this.settingArgs['transparent'] = value;
    }
    /** Whether materials from this model use per-vertex colors. Changes affect only materials created afterward. */
    get usesVertexColors(){return this.settingArgs['vertexColors'];}
    set usesVertexColors(value:boolean|undefined){this.settingArgs['vertexColors']=value;}
    /** Whether materials from this model render as wireframe. */
    get rendersWireframe(){return this.settingArgs['wireframe'];}

    // public shaderSourcesLoadedPromise!:Promise<ShaderProgramSource>;


    /** Resolves once the shader source files have loaded. Throws if `setShader` hasn't been called. */
    get sourcesLoadedPromise(){
        // if(this._shaderSource instanceof Promise<ShaderProgramSource>){
        //     return this._shaderSource;
        // }else{
            return this._shaderSource.sourcesLoadedPromise;
        // }

    }





    /** Returns a `Textures` control-panel folder with an image-upload control for each of `material`'s textures. */
    getTextureGUIParams(material:AShaderMaterial) {
        let texs = {}
        for(let t in material.textures){
            texs = {
                ...texs,
                ...AShaderModelBase.ShaderTextureGUIUpload(material, t),
            }
        }
        return {
            Textures: folder({
                    ...texs
                },
                {collapsed: false}
            ),
        }
    }

    /**
     * Returns a color-picker control spec that edits the vec4 color uniform `paramKey` (default `'color'`) on
     * `material` via `setUniformColor`.
     */
    static ShaderUniformGUIColorControl(material:AShaderMaterial, paramKey?:string){
        const paramName = paramKey?paramKey:'color';
        return AMaterialModelBase.GUIControlSpec(paramName, material.getUniformValue(paramName), "#aaaaaa",
            (v: string) => {
                let selectedColor = Color.FromString(v);
                material.setUniformColor(paramName, selectedColor);
            },
            (raw) => Color.FromTHREEVector4(raw).toHexString());
    }

    /**
     * Returns a control spec that edits the float uniform `paramName` on `material`.
     * @param otherSpecs extra control options such as `{min, max, step}`
     */
    static ShaderUniformGUIControl(material:AShaderMaterial, paramName:string, defaultValue:any, otherSpecs:{[name:string]:any}){
        return AMaterialModelBase.GUIControlSpec(paramName, material.getUniformValue(paramName), defaultValue,
            (v: string) => {
                material.setUniform(paramName, v, 'float');
            },
            undefined, otherSpecs);
    }

    /**
     * Returns an image-upload control spec (keyed `{paramName}Map`) that loads the chosen image and sets it as
     * `material`'s `paramName` texture.
     */
    static ShaderTextureGUIUpload(material:AShaderMaterial, paramName:string, otherSpecs?:{[name:string]:any}){
        let rval:{[name:string]:any} = {};
        rval[TextureKeyForName(paramName)] ={
            image: undefined,
            onChange:(v:any)=>{
                if(v) {
                    let loader = new THREE.TextureLoader();
                    loader.setCrossOrigin("");
                    loader.load(v, (tex:THREE.Texture)=>{
                        let atex = new ATexture();
                        atex._setTHREETexture(tex);
                        material.setTexture(paramName, atex);
                    });
                }
            }
        }
        return rval;
    }



    // async _setShader(shaderName:string){
    //     const self = this;
    //     self._shaderSource= await AssetManager.shaders.GetShaderSource(shaderName);
    //     return self._shaderSource;
    // }

    /**
     * Uses the shader registered under `shaderName` in `AssetManager.shaders`. The shader must already have been
     * loaded with `LoadShader` (its files may still be downloading); otherwise the model has no source.
     */
    setShader(shaderName:string){
        // this.shaderSourcesLoadedPromise = this._setShader(shaderName);
        this._shaderSource= AssetManager.shaders.GetShaderSource(shaderName);
    }

    /** Replaces the model's default uniform dictionary. */
    setUniformsDict(uniforms:ShaderUniformDict){
        this.uniforms = uniforms;
    }
    /**
     * Sets a default texture for new materials. A string is treated as an image path and loaded into a new
     * {@link ATexture}. Also sets the uniforms `{name}Map` (the texture) and `{name}MapProvided` (a bool); passing
     * `undefined` clears both. Unlike {@link AShaderMaterial.setTexture}, this does not set `{name}Size`.
     */
    setTexture(name:string, texture?:ATexture|string){
        if(texture) {
            if (texture instanceof ATexture) {
                this.textures[name] = texture;
            } else {
                this.textures[name] = new ATexture(texture);
            }
            this.setUniform(TextureKeyForName(name), this.getTexture(name)?.threejs, 't');
            this.setUniform(TextureProvidedKeyForName(name), !!this.getTexture(name), 'bool');
        }else if(texture===undefined){
            this.textures[name] = texture;
            this.setUniform(TextureKeyForName(name), null, 't');
            this.setUniform(TextureProvidedKeyForName(name), false, 'bool');
        }
    }

    /** Returns the model's default texture named `name`, if any. */
    getTexture(name:string){
        return this.textures[name];
    }

    /**
     * Sets a default uniform for materials created afterward. Unlike {@link AShaderMaterial.setUniform}, this stores
     * `value` as given (no conversion of AniGraph vector or color types).
     */
    setUniform(name:string, value:any, type?:string) {
        let uval: { [name: string]: any } = {value:value};
        if (type !== undefined) {
            uval['type'] = type;
        }
        // @ts-ignore
        this.uniforms[name] = uval;
    }

    /** Returns the value of the model's default uniform `name`, or `undefined`. */
    getUniformValue(name:string) {
        let uniform = this.uniforms[name];
        return uniform?.value;
    }

    /**
     * Creates a new Three.js material from the shader source, `settingArgs`, `defaults`, `sharedParameters`, and a
     * copy of Three.js's light uniforms merged with the model's `uniforms`.
     */
    _CreateTHREEJS(){
        let uniforms = {uniforms:THREE.UniformsUtils.merge([
                THREE.UniformsLib['lights'],
                {...this.uniforms}
            ])};
        return new this.materialClass({
            vertexShader: this.vertexSource,
            fragmentShader: this.fragSource,
            ...this.settingArgs,
            ...this.defaults,
            ...uniforms,
            ...this.sharedParameters,
        });
    }

    /**
     * Creates a new material (an instance of `ShaderMaterialClass`) from this model and applies `uniforms` to it
     * with `setUniform`.
     * @param uniforms uniform values to set on the new material, keyed by name
     */
    CreateMaterial(uniforms:{[name:string]:any}={}, ...args:any[]){
        let material =  new this.ShaderMaterialClass(...args);
        material.init(this);
        for(let uniformName in uniforms){
            material.setUniform(uniformName, uniforms[uniformName]);
        }
        return material;
    }

}

/** Something with an async `CreateModel` factory for shader models (like {@link AShaderModel.CreateModel}). */
export interface CreatesShaderModels{
    CreateModel(...args:any[]):Promise<AShaderModel>;
}

/**
 * The standard shader material model, which builds `THREE.ShaderMaterial`s. Create one with
 * `await AShaderModel.CreateModel(shaderName)` (which loads the shader if needed) or register one by name with
 * `AssetManager.loadShaderMaterialModel`. By default, lights are on and materials are transparent-capable and
 * double-sided.
 *
 * @example
 * ```ts
 * const model = await AShaderModel.CreateModel("myshader");
 * const material = model.CreateMaterial();
 * material.setUniform("exposure", 1.0);
 * ```
 */
@ALabel("AShaderModel")
export class AShaderModel extends AShaderModelBase<{[name:string]:any}>{
    /** The control-panel folder name for this model's instance controls (set by `AddInstancesControlToGUI`). */
    instanceControlSpecsFolderName!:string;
    _instanceControlsInGUI:boolean = false;
    /** Whether `AddInstancesControlToGUI` has been called. */
    get instanceControlsInGUI(){return this._instanceControlsInGUI;}
    private _instanceControlSpecGroup?:AControlSpecGroup;

    /** Whether `AddInstancesControlToGUI` has been called. */
    get hasInstanceControlsFolderInGUI(){
        return this._instanceControlsInGUI;
    }

    /**
     * Returns this model's control-panel group for per-material controls, creating it on first use. It is named
     * after `instanceControlSpecsFolderName`, so call `AddInstancesControlToGUI` first. Add each material's controls
     * as a nested group, e.g. `getInstanceControlSpecGroup().addControlSpecGroup(instanceName, {})`; when the group
     * changes, it updates its folder in the control panel.
     */
    getInstanceControlSpecGroup(): AControlSpecGroup {
        if(!this._instanceControlSpecGroup){
            this._instanceControlSpecGroup = new AControlSpecGroup(this.instanceControlSpecsFolderName, {
                onUpdate: () => {
                    GetAppState().updateControlSpecEntry(
                        this.instanceControlSpecsFolderName,
                        this._instanceControlSpecGroup!.getFolderSpec()
                    );
                },
            });
        }
        return this._instanceControlSpecGroup;
    }

    /**
     * Returns this class's class-wide control-panel controls (shared by all materials of the class), or `undefined`
     * (the default). `ABasicDiffuseShaderModel` and `ABlinnPhongShaderModel` override this; their
     * `static AddAppState()` adds the returned group to the control panel.
     */
    static getClassControlSpecGroup(): AControlSpecGroup | undefined {
        return undefined;
    }

    /**
     * @param shaderName name of a shader already loaded into `AssetManager.shaders`
     * @param shaderSettings Three.js `ShaderMaterial` parameters; defaults to lights on, transparent, double-sided
     * @param uniforms default uniforms
     * @param _sharedUniforms ignored. The slot is kept so that arguments passed after it (`args`) keep their
     * positions.
     */
    constructor(
        shaderName?:string,
        shaderSettings?:ShaderMaterialParameters,
        uniforms?:ShaderUniformDict,
        _sharedUniforms?:ShaderUniformDict,
        ...args:any[]
    ) {
        super(shaderName, THREE.ShaderMaterial, ...args);
        this._shaderSettings = shaderSettings??{
            lights:true,
            transparent: true,
            side: THREE.DoubleSide,
            opacity:1.0
        };
        this.uniforms=uniforms??{};
        if(shaderName) {
            this.setShader(shaderName);
        }
    }

    /**
     * Adds a control-panel folder for this model's per-material controls (see `getInstanceControlSpecGroup`).
     * The folder is named `folder_name` (default: the shader name), made unique if taken. Asserts if called twice.
     */
    AddInstancesControlToGUI(folder_name?:string){
        assert(!this.hasInstanceControlsFolderInGUI, "Tried to add instances control folder for the same model twice")
        let appState = GetAppState();
        let new_folder_name:string;
        if(folder_name!==undefined){
            new_folder_name =appState._GetUniqueFolderName(folder_name);
        }else{
            new_folder_name =appState._GetUniqueFolderName(this._shaderSource.name);
        }
        this._instanceControlsInGUI = true;
        this.instanceControlSpecsFolderName = new_folder_name;
        appState.addControlSpecGroup(this.instanceControlSpecsFolderName, this.getInstanceControlSpecGroup(), false, true);
    }


    /**
     * Resolves once the named shader's source files have loaded. If the shader isn't registered yet, this starts
     * loading it (from the default paths). If it is registered but its files are still downloading (for example,
     * a module called `LoadShader` when it was imported), this waits for that download instead of loading again.
     */
    static async ShaderSourceLoaded(shaderName:string){
        let shaderSource = AssetManager.shaders.GetShaderSource(shaderName);
        if(shaderSource === undefined){
            await AssetManager.shaders.LoadShader(shaderName);
        }else{
            await shaderSource.sourcesLoadedPromise;
        }
    }

    /**
     * Loads the shader if needed (see `ShaderSourceLoaded`) and returns a new model of this class that uses it.
     * Throws if `shaderName` is missing. Extra `args` go to the constructor after the shader name.
     */
    static async CreateModel(shaderName?:string, ...args:any[]){
        if(shaderName ===undefined){
            throw new Error("must provide shader name")
        }
        await AShaderModel.ShaderSourceLoaded(shaderName);
        return new this(shaderName, ...args);
    }

    /**
     * Connects `mat`'s `ambient`, `diffuse`, `specular`, and `specularExp` uniforms to app-state sliders of the same
     * names, adding each slider if it doesn't exist yet. The uniforms then follow the sliders.
     */
    AddStandardUniforms(mat:AShaderMaterial){
        let appState = GetAAppState();
        function checkAppState(name:string, initialValue?:number, min?:number, max?:number, step?:number){
            if(appState.getState(name)===undefined){
                appState.addSliderControl(name, initialValue??1.0, min, max, step);
            }
        }

        checkAppState('ambient', 0.15, 0, 2, 0.01);
        checkAppState('diffuse', 1.0, 0, 3, 0.01);
        checkAppState('specular', 1.0, 0, 3, 0.01);
        checkAppState('specularExp', 2.5, 0, 5, 0.1);

        function setMatUniformFunc(name:string){
            function setu(){
                mat.setUniform(name, appState.getState(name));
            }
            setu();
            mat.subscribe(appState.addStateValueListener(name, ()=>{
                setu();
            }), `${name}_update`);
        }

        setMatUniformFunc('ambient');
        setMatUniformFunc('diffuse');
        setMatUniformFunc('specular');
        setMatUniformFunc('specularExp');

        //
        // function setAmbient(){
        //     mat.setUniform('ambient', appState.getState(AAppState.AppStateDefaultKeys.AmbientLight));
        // }
        // setAmbient();
        // mat.subscribe(appState.addStateValueListener(AAppState.AppStateDefaultKeys.AmbientLight, ()=>{
        //     setAmbient();
        // }), "ambient_update");
    }

}


