import {ALabel, Color, Mat3} from "../../../../anigraph";
import {
    AInstancedParticleSystemView2D
} from "../../../../anigraph/starter/nodes/instancedparticlesystem2d/AInstancedParticleSystemView2D";
import {TutParticle} from "./TutParticle";

/**
 * Step 11.1: draws each visible particle as a textured square, copied from ParticlePlayground2D's
 * `PlaygroundParticleSystemView`. The GPU draws the same square once per particle, with the transform and color
 * these two functions give it.
 */
@ALabel("TutParticleSystemView")
export class TutParticleSystemView extends AInstancedParticleSystemView2D<TutParticle>{
    /**
     * A particle's transform: move it to its position and scale it to its size.
     * @param i the particle's index
     */
    get2DTransformForParticleIndex(i: number): Mat3 {
        const particle = this.model.particles[i];
        return Mat3.Translation2D(particle.position).times(Mat3.Scale2D(particle.size));
    }

    /**
     * A particle's color.
     * @param i the particle's index
     */
    getColorForParticleIndex(i: number): Color {
        return this.model.particles[i].color;
    }

    /** Copies every particle to the GPU. Hidden particles get an all-zero transform, which shrinks them to nothing. */
    updateParticles(...args: any[]) {
        for(let i=0;i<this.model.particles.length;i++){
            if(!this.model.particles[i].visible){
                this.particlesElement.setMatrixAt(i, Mat3.Zeros());
            }else{
                this.particlesElement.setMatrixAndColorAt(i, this._getTransformForParticleIndex(i), this._getColorForParticleIndex(i), true);
            }
        }
        this.particlesElement.setNeedsUpdate();
    }
}
