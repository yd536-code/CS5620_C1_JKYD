import {ASerializable} from "../../../base";
import {AParticleSystemModel3D} from "../AParticleSystemModel3D";
import {BasicParticle} from "../../../physics";
import {AParticleEnums} from "../../../physics/particles/AParticleEnums";
import {AShaderModel, ATexture} from "../../../rendering";
import {
    AInstancedParticleSystemShaderModel,
    InstancedParticleSystemMaterial
} from "./AInstancedParticleSystemShaderModel";


/**
 * Base model for particle systems drawn with instancing (see `AInstancedParticleSystemView3D`). Subclasses
 * implement `initParticles`, which the constructor calls. The model signals a particle update on every
 * `timeUpdate`, so views redraw the particles each frame.
 *
 * Call `await LoadShaderModel()` once before `CreateMaterial`.
 * @typeParam P The particle type.
 */
@ASerializable("AInstancedParticleSystemModel3D")
export abstract class AInstancedParticleSystemModel3D<P extends BasicParticle<any>> extends AParticleSystemModel3D<P>{
    /** The shader model class that `LoadShaderModel` creates. */
    static ShaderModelClass:(typeof AShaderModel)=AInstancedParticleSystemShaderModel;
    /** The loaded shader model; undefined until `LoadShaderModel` finishes. */
    static ShaderModel:AShaderModel;
    /**
     * Loads the shader model (once) and stores it in `ShaderModel`.
     * @param name Shader name (default `"instancedparticle"`).
     */
    static async LoadShaderModel(name?:string, ...args:any[]){
        if(this.ShaderModel === undefined) {
            this.ShaderModel = await this.ShaderModelClass.CreateModel(name??"instancedparticle", ...args)
        }
    }

    /** Whether the shader reads per-particle opacity from the instance matrix (the `opacityInMatrix` uniform). */
    set useOpacity(value:boolean){
        this.material.setUniform("opacityInMatrix", value);
    }
    get useOpacity(){
        return this.material.getUniformValue("opacityInMatrix");
    }

    /**
     * Creates a material from the loaded `ShaderModel` (call `LoadShaderModel` first).
     * @param particleTexture Optional particle texture to set on the material.
     */
    static CreateMaterial(particleTexture?:ATexture, ...args:any[]):InstancedParticleSystemMaterial{
        let mat =  (this.ShaderModel.CreateMaterial(...args) as InstancedParticleSystemMaterial);
        if(particleTexture) {
            mat.particleTexture = particleTexture;
        }
        return mat;
    }

    /** This model's material, as an `InstancedParticleSystemMaterial`. */
    get material():InstancedParticleSystemMaterial{return this._material as InstancedParticleSystemMaterial;}

    /** Sets the particle texture on this model's material. */
    setParticleTexture(texture:ATexture){
        this.material.particleTexture = texture;
    }

    /**
     * Creates the system's particles (typically with `addParticle`). Called from the base constructor, so fields
     * declared on your subclass are not initialized yet when it runs.
     */
    abstract initParticles(nParticles:number):void;

    // initParticles(nParticles:number){
    //     for(let i=0;i<nParticles;i++){
    //         let newp = new ABillboardParticle();
    //         newp.visible=false;
    //         this.addParticle(newp);
    //     }
    // }


    /** Runs the usual time update, then signals a particle update. */
    timeUpdate(t: number, ...args:any[]) {
        super.timeUpdate(t, ...args);
        this.signalParticlesUpdated();
    }

    /** @param nParticles Passed to `initParticles` (default `AParticleEnums.DEFAULT_MAX_N_PARTICLES`). */
    constructor(nParticles?:number) {
        super();
        this.initParticles(nParticles??AParticleEnums.DEFAULT_MAX_N_PARTICLES);
        this.signalParticlesUpdated();
    }


}
