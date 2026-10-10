import {ALabel, Mat3, Color} from "../../../anigraph";
import {AInstancedParticleSystemView2D} from "../../../anigraph/starter/nodes/instancedparticlesystem2d/AInstancedParticleSystemView2D";
import {FireParticle} from "./FireParticle";

@ALabel("FireView")
export class FireView extends AInstancedParticleSystemView2D<FireParticle>{

    //initing the particles
    init() {
        super.init();
        this.updateParticles();
    }

    //work on the position and size of particle i
    get2DTransformForParticleIndex(i: number): Mat3 {
        let particle = this.model.particles[i];
        return Mat3.Translation2D(particle.position).times(Mat3.Scale2D(particle.size));
    }

    //returns particle i's color
    getColorForParticleIndex(i: number): Color {
        return this.model.particles[i].color;
    }

    // Update the drawing using each particles position, size, and color.
    updateParticles(...args: any[]) {
        for (let i=0; i<this.model.particles.length; i++) {
            let particle = this.model.particles[i];

            if (particle.visible){
                this.particlesElement.setMatrixAndColorAt(i, this._getTransformForParticleIndex(i),
                    this._getColorForParticleIndex(i), true);
            } else {
                this.particlesElement.setMatrixAt(i, Mat3.Zeros());
            }
        }

        this.particlesElement.setNeedsUpdate();
    }
}
