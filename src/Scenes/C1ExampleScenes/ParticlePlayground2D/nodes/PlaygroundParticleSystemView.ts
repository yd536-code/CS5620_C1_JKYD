import {ALabel, Color, Mat3} from "../../../../anigraph";
import {
    InstancedParticleSystemView2D
} from "../../../../anigraph/starter/nodes/instancedParticlesSystem/InstancedParticleSystemView2D";
import {PlaygroundParticle} from "./PlaygroundParticle";

/**
 * Draws a `PlaygroundParticleSystemModel`. Each particle is drawn as a square textured with `gradientParticle.png`
 * (a soft white dot), tinted by the particle's `color` and scaled by its `size`.
 *
 * The view only reads particle data; it never changes it. Whenever the model calls `signalParticlesUpdated()`, the
 * view's `updateParticles()` runs and copies each particle's current state to the GPU.
 */
@ALabel("PlaygroundParticleSystemView")
export class PlaygroundParticleSystemView extends InstancedParticleSystemView2D<PlaygroundParticle>{

    /**
     * The transform that places particle i's square: scale the unit square to the particle's size, then move it to
     * the particle's position.
     * @param i
     */
    get2DTransformForParticleIndex(i: number): Mat3 {
        let particle = this.model.particles[i];
        return Mat3.Translation2D(particle.position).times(Mat3.Scale2D(particle.size));
    }

    /**
     * The color for particle i. It multiplies the texture, so a white dot becomes a dot of this color.
     * @param i
     */
    getColorForParticleIndex(i: number): Color {
        return this.model.particles[i].color;
    }

    /**
     * Copies every particle's transform and color to the GPU. Hidden particles get an all-zero transform, which shrinks
     * them to nothing so they aren't drawn.
     */
    updateParticles(...args:any[]) {
        for(let i=0;i<this.model.particles.length;i++){
            if(!this.model.particles[i].visible){
                this.particlesElement.setMatrixAt(i, Mat3.Zeros());
            }else{
                // The final `true` tells the shader to use the color's alpha as the particle's opacity.
                this.particlesElement.setMatrixAndColorAt(i, this._getTransformForParticleIndex(i), this._getColorForParticleIndex(i), true);
            }
        }
        this.particlesElement.setNeedsUpdate();
    }

    // update() is inherited: it applies the particle system's own transform, including its `zValue` (drawing order).
}
