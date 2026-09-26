import {AShaderMaterial} from "../material";
import {GetAAppState} from "../../appstate/AAppState";
import {ABasicDiffuseShaderModel, DiffuseMaterial} from "./ABasicDiffuseShaderModel";
import {BlinnPhongShaderAppState, ClassInterface} from "../../basictypes";
import {GUISpecs} from "../../controlpanel/GUISpecs";
import {AControlSpecGroup} from "../../controlpanel/AControlSpecGroup";
import {BlinnPhongDefaults} from "../../defines";

/** A shader material with typed accessors for the Blinn-Phong uniforms (`specular`, `specularExp`, plus diffuse/ambient). */
export class BlinnPhongMaterial extends DiffuseMaterial{
    /** Sets the `specular` uniform (specular strength). */
    setSpecular(v:number){
        this.setUniform(BlinnPhongShaderAppState.Specular, v)
    }
    /** Sets the `specularExp` uniform (the specular exponent; higher is shinier). */
    setSpecularExp(v:number){
        this.setUniform(BlinnPhongShaderAppState.SpecularExp, v)
    }
    /** Returns the `specular` uniform. */
    getSpecular(){
        return this.getUniformValue(BlinnPhongShaderAppState.Specular)
    }
    /** Returns the `specularExp` uniform. */
    getSpecularExp(){
        return this.getUniformValue(BlinnPhongShaderAppState.SpecularExp)
    }
}




/**
 * Shader model for Blinn-Phong lighting (ambient + diffuse + specular). Its materials are `BlinnPhongMaterial`s.
 * Its class-wide control folder is named `BlinnPhong` and is not added by default (`AddAppStateByDefault` is false);
 * pass `addAppState = true` to `CreateModel` or call `AddAppState()` to add it.
 *
 * @example
 * ```ts
 * const model = await ABlinnPhongShaderModel.CreateModel("blinnphong", true);
 * const material = model.CreateMaterial({specularExp: 10});
 * ```
 */
export class ABlinnPhongShaderModel extends ABasicDiffuseShaderModel{
    ShaderMaterialClass:ClassInterface<AShaderMaterial>=BlinnPhongMaterial;
    static ShaderAppState = BlinnPhongShaderAppState;
    static ControlSpecFolderName:string="BlinnPhong"
    static AddAppStateByDefault:boolean = false;
    static _appStateAdded:boolean=false;

    /** `ABasicDiffuseShaderModel`'s Ambient/Diffuse group (under this class's folder name), plus Specular/SpecularExp. */
    static getClassControlSpecGroup(): AControlSpecGroup {
        let appState = GetAAppState();
        let group = super.getClassControlSpecGroup();
        group.addSliderControl(this.ShaderAppState.Specular, BlinnPhongDefaults.Specular,
            (v) => appState.setState(this.ShaderAppState.Specular, v), 0.0, 1.0, 0.001);
        group.addSliderControl(this.ShaderAppState.SpecularExp, BlinnPhongDefaults.SpecularExp,
            (v) => appState.setState(this.ShaderAppState.SpecularExp, v), 0.0, 20.0, 0.01);
        return group;
    }

    /** Same as the parent version, plus `specular` and `specularExp`. */
    static attachMaterialUniformsToAppState(mat:AShaderMaterial){
        super.attachMaterialUniformsToAppState(mat);
        mat.attachUniformToAppState(ABlinnPhongShaderModel.ShaderAppState.Specular)
        mat.attachUniformToAppState(ABlinnPhongShaderModel.ShaderAppState.SpecularExp)

        // mat.attachUniformToAppState(GUISpecs.KeyNameInFolder(ABlinnPhongShaderModel.ShaderAppState.Ambient, ABlinnPhongShaderModel.ControlSpecFolderName))
        // mat.attachUniformToAppState(GUISpecs.KeyNameInFolder(ABlinnPhongShaderModel.ShaderAppState.Diffuse, ABlinnPhongShaderModel.ControlSpecFolderName))
        // mat.attachUniformToAppState(GUISpecs.KeyNameInFolder(ABlinnPhongShaderModel.ShaderAppState.Specular, ABlinnPhongShaderModel.ControlSpecFolderName))
        // mat.attachUniformToAppState(GUISpecs.KeyNameInFolder(ABlinnPhongShaderModel.ShaderAppState.SpecularExp, ABlinnPhongShaderModel.ControlSpecFolderName))

    }

    /**
     * Creates a material with `specular`/`specularExp` (and the parent's `diffuse`/`ambient`) defaulting to
     * `BlinnPhongDefaults`; `uniforms` override them.
     */
    CreateMaterial(uniforms:{[name:string]:any}={}, ...args:any[]){
        let defaults = {
            specular: BlinnPhongDefaults.Specular,
            specularExp:BlinnPhongDefaults.SpecularExp
        };
        return super.CreateMaterial(Object.assign(defaults, uniforms), ...args);
    }


}



