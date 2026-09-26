import {ASerializable} from "../../../../anigraph";
import {
    AInstancedParticleSystemModel2D
} from "../../../../anigraph/starter/nodes/instancedparticlesystem2d/AInstancedParticleSystemModel2D";
import {PlaygroundParticle} from "./PlaygroundParticle";

/**
 * The model for the particle system: a list of `PlaygroundParticle`s (`this.particles`), plus the material they are
 * drawn with. It holds data only. The logic that decides what particles do lives in `LabCatParticlePlaygroundModel`.
 *
 * It is an "instanced" system: the same square is drawn once per particle (each drawing is an "instance"), with a
 * different position, size and color each time. The GPU needs to know the number of instances up front, which is why
 * `initParticles` creates every particle at the start and hides them.
 */
@ASerializable("PlaygroundParticleSystemModel")
export class PlaygroundParticleSystemModel extends AInstancedParticleSystemModel2D<PlaygroundParticle>{
    /**
     * Creates `nParticles` hidden particles. This is the most particles that can ever be visible at once.
     * @param nParticles
     */
    initParticles(nParticles: number){
        for(let i=0;i<nParticles;i++){
            this.addParticle(new PlaygroundParticle());
        }
        this.signalParticlesUpdated();
    }
}
