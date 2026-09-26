import {AShaderMaterial, AShaderModel} from "../material";
import {GetAAppState} from "../../appstate/AAppState";
import {BasicDiffuseShaderAppState} from "../../basictypes";
import {GUISpecs} from "../../controlpanel/GUISpecs";
import {AControlSpecGroup} from "../../controlpanel/AControlSpecGroup";
import {BlinnPhongDefaults} from "../../defines";

/** A shader material with typed accessors for the `diffuse` and `ambient` uniforms. */
export class DiffuseMaterial extends AShaderMaterial{
    /** Sets the `diffuse` uniform (diffuse strength). */
    setDiffuse(v:number){
        this.setUniform(BasicDiffuseShaderAppState.Diffuse, v)
    }
    /** Returns the `diffuse` uniform. */
    getDiffuse(){
        return this.getUniformValue(BasicDiffuseShaderAppState.Diffuse)
    }
    /** Sets the `ambient` uniform (ambient strength). */
    setAmbient(v:number){
        this.setUniform(BasicDiffuseShaderAppState.Ambient, v)
    }
    /** Returns the `ambient` uniform. */
    getAmbient(){
        return this.getUniformValue(BasicDiffuseShaderAppState.Ambient)
    }
}

/**
 * Shader model for a diffuse + ambient lighting shader (the `basic` shader by default). Can add one set of
 * class-wide Ambient/Diffuse sliders to the control panel, shared by every material of this class.
 *
 * Note: this class does not set `ShaderMaterialClass`, so its materials are plain {@link AShaderMaterial}s, not
 * `DiffuseMaterial`s.
 */
export class ABasicDiffuseShaderModel extends AShaderModel{
    /** The uniform / app-state key names this shader uses. */
    static ShaderAppState = BasicDiffuseShaderAppState;
    /** The control-panel folder name for this class's sliders. */
    static ControlSpecFolderName:string="Basic"
    /** Whether `CreateModel` adds the class-wide control folder when its `addAppState` argument is omitted. */
    static AddAppStateByDefault:boolean = true;
    /**
     * Whether this class's control folder has been added. `ABlinnPhongShaderModel` redeclares it so the two
     * folders are tracked separately; a subclass that doesn't (e.g. `ATerrainShaderModel`) reads its nearest
     * declaring ancestor's value, while `AddAppState` writes it on the class it was called on.
     */
    static _appStateAdded:boolean=false;

    /**
     * Returns this class's class-wide control-panel controls: one shared Ambient/Diffuse slider pair no matter how
     * many materials of this shader exist. The sliders set the app-state values `ambient`/`diffuse`.
     * `ABlinnPhongShaderModel` extends this group with Specular/SpecularExp.
     */
    static getClassControlSpecGroup(): AControlSpecGroup {
        let appState = GetAAppState();
        let group = new AControlSpecGroup(this.ControlSpecFolderName);
        group.addSliderControl(this.ShaderAppState.Ambient, BlinnPhongDefaults.Ambient,
            (v) => appState.setState(this.ShaderAppState.Ambient, v), 0.0, 1.0, 0.001);
        group.addSliderControl(this.ShaderAppState.Diffuse, BlinnPhongDefaults.Diffuse,
            (v) => appState.setState(this.ShaderAppState.Diffuse, v), 0.0, 1.0, 0.001);
        return group;
    }

    /**
     * Adds the group from `getClassControlSpecGroup()` to the control panel under `ControlSpecFolderName` and marks
     * the class as added. `CreateModel` calls this for you when needed.
     */
    static AddAppState(...args:any[]){
        let appState = GetAAppState();
        this._appStateAdded = true;
        appState.addControlSpecGroup(this.ControlSpecFolderName, this.getClassControlSpecGroup(), true, true);
    }

    /**
     * Loads the shader if needed and returns a new model of this class. Adds the class-wide control folder first
     * if requested and not already added.
     * @param shaderName defaults to "basic"
     * @param addAppState whether to add the class-wide control folder (once); defaults to `AddAppStateByDefault`
     */
    static async CreateModel(shaderName?:string, addAppState?:boolean, ...args:any[]){
        if(shaderName === undefined){
            shaderName = "basic";
        }
        if((addAppState ?? this.AddAppStateByDefault) && !this._appStateAdded){
            this.AddAppState();
        }
        await AShaderModel.ShaderSourceLoaded(shaderName);
        return new this(shaderName, ...args);
    }

    /**
     * Makes `mat`'s `ambient` and `diffuse` uniforms follow the app-state values of the same names (the class-wide
     * sliders). See {@link AShaderMaterial.attachUniformToAppState}.
     */
    static attachMaterialUniformsToAppState(mat:AShaderMaterial){
        // mat.attachUniformToAppState(GUISpecs.KeyNameInFolder(ABasicDiffuseShaderModel.ShaderAppState.Diffuse, ABasicDiffuseShaderModel.ControlSpecFolderName))
        // mat.attachUniformToAppState(GUISpecs.KeyNameInFolder(ABasicDiffuseShaderModel.ShaderAppState.Diffuse, ABasicDiffuseShaderModel.ControlSpecFolderName))
        mat.attachUniformToAppState(ABasicDiffuseShaderModel.ShaderAppState.Ambient)
        mat.attachUniformToAppState(ABasicDiffuseShaderModel.ShaderAppState.Diffuse)
    }


    /** Creates a material with `diffuse` and `ambient` defaulting to `BlinnPhongDefaults`; `uniforms` override them. */
    CreateMaterial(uniforms:{[name:string]:any}={}, ...args:any[]){
        let defaults = {
            diffuse: BlinnPhongDefaults.Diffuse,
            ambient: BlinnPhongDefaults.Ambient
        };
        return super.CreateMaterial(Object.assign(defaults, uniforms), ...args);
    }
}



