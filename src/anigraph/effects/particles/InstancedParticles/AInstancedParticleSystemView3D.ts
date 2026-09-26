import {Color, Mat4} from "../../../index";
import {AInstancedParticleSystemGraphic3D} from "./AInstancedParticleSystemGraphic3D";
import {AParticleSystemView3D} from "../AParticleSystemView3D";
import {AParticle} from "../../../index";


/**
 * View for instanced particle systems. `updateParticles()` writes each particle's color and transform into the
 * instanced graphic. Subclasses implement `createParticlesElement` (from `AParticleSystemView3D`),
 * `_getColorForParticleIndex`, and `_getTransformForParticleIndex`.
 * @typeParam P The particle type.
 */
export abstract class AInstancedParticleSystemView3D<P extends AParticle<any>> extends AParticleSystemView3D<P>{
    /**
     * Subclasses must also implement `createParticlesElement` from `AParticleSystemView3D`.
     * (`updateParticles` is implemented below.)
     */
    // abstract updateParticles():void;
    // abstract createParticlesElement(...args:any[]):AInstancedParticleSystemGraphic3D;

    /** Returns the color of particle `i`. */
    abstract _getColorForParticleIndex(i:number):Color;
    /** Returns the instance transform of particle `i`. */
    abstract _getTransformForParticleIndex(i:number):Mat4;


    /** The particle graphic, as an `AInstancedParticleSystemGraphic3D`. */
    get particlesElement():AInstancedParticleSystemGraphic3D{
        return this._particlesElement as AInstancedParticleSystemGraphic3D;
    }

    init() {
        super.init();
    }


    /** Applies the model's transform to the view. */
    update(...args:any[]) {
        this.setTransform(this.model.transform);
    }

    /** Writes every particle's color and transform into the instanced graphic and marks it for re-upload. */
    updateParticles(...args:any[]) {
        for(let i=0;i<this.model.particles.length;i++){
            this.particlesElement.setColorAt(i, this._getColorForParticleIndex(i));
            this.particlesElement.setMatrixAt(i, this._getTransformForParticleIndex(i));
        }
        this.particlesElement.setNeedsUpdate();
    }

}
