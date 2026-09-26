import {AInstancedParticleSystemGraphic3D} from "../../../effects";
import {AMaterial} from "../../../rendering";

/** Instanced particle graphic for 2D particle systems. Same as {@link AInstancedParticleSystemGraphic3D}, plus a
 * `Create` factory. */
export class InstancedParticleSystemGraphic2D extends AInstancedParticleSystemGraphic3D{
    /** Creates a graphic with room for `nParticles` instances, drawn with `material`. */
    static Create(nParticles:number=100, material?:AMaterial|THREE.Material, ...args:any[]){
        let psystem = new this();
        psystem.init(nParticles, material)
        return psystem;
    }
}
