import {AShaderMaterial, AShaderModel, ATexture} from "../../../rendering";
import {ClassInterface} from "../../../basictypes";
import * as THREE from "three";


/** Shader material for instanced particles, with a particle texture and an `opacityInMatrix` flag. */
export class InstancedParticleSystemMaterial extends AShaderMaterial{
    /** The texture bound to the shader's `particle` texture slot. */
    set particleTexture(value:ATexture|undefined){
        this.setTexture("particle", value);
    }
    get particleTexture(){
        return this.getTexture("particle");
    }

    /** The `opacityInMatrix` bool uniform, which tells the shader to read per-particle opacity from the instance matrix. */
    set opacityInMatrix(value:boolean){
        this.setUniform("opacityInMatrix", value, 'bool');
    }
    get opacityInMatrix(){
        return this.getUniformValue("opacityInMatrix");
    }
}


/**
 * Shader model for instanced particle systems. Its materials are `InstancedParticleSystemMaterial`s that test
 * depth but do not write it, and use this model's default particle texture unless given another.
 */
export class AInstancedParticleSystemShaderModel extends AShaderModel{
    ShaderMaterialClass:ClassInterface<AShaderMaterial>=InstancedParticleSystemMaterial;
    private _particleTexture?:ATexture;
    /** Sets the default particle texture used by `CreateMaterial` when none is given. */
    set diffuseTexture(value){this._particleTexture = value;}

    /** The default particle texture, if one was set. */
    get diffuseTexture(){return this._particleTexture;}

    /**
     * Creates a particle material with depth testing on and depth writing off.
     * @param particleTexture Texture to use; defaults to this model's `diffuseTexture` (may be undefined).
     * @param args Passed on to {@link AShaderModel.CreateMaterial}.
     */
    CreateMaterial(particleTexture?:ATexture, ...args:any[]){
        // Use the given texture, or this model's default if there is one.
        particleTexture =particleTexture??this._particleTexture;
        let mat = super.CreateMaterial(...args) as InstancedParticleSystemMaterial;

        mat.depthWrite=false;
        mat.depthTest = true;
        mat.depthFunc = THREE.LessDepth;

        mat.particleTexture = particleTexture;
        return mat;
    }

}

