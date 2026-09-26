import {ASerializable} from "../../../base";
import {AParticle} from "../../../physics";
import {AParticleSystemModel2D} from "../../../effects";

/**
 * Base class for a 2D particle system drawn with GPU instancing (see {@link InstancedParticleSystemView2D}).
 * Subclasses implement `initParticles(n)` to create the particles. Instanced graphics allocate a fixed number of
 * instances, so create as many particles as you will ever need up front and hide the unused ones.
 */
@ASerializable("InstancedParticleSystemModel2D")
export abstract class InstancedParticleSystemModel2D<P extends AParticle<any>> extends AParticleSystemModel2D<P>{
    /** Creates the system's `nParticles` particles. Called by the constructor when `nParticles` is given. */
    abstract initParticles(nParticles:number):void;
    /**
     * @param nParticles number of particles to create with `initParticles`. If omitted (or 0), `initParticles` is
     * not called, and no particles are created: call `initParticles(n)` yourself afterward, which is what the
     * example scenes do (e.g. `new MySystem()` followed by `system.initParticles(N_PARTICLES)`).
     */
    constructor(nParticles?:number) {
        super();
        if(nParticles) {
            this.initParticles(nParticles);
        }
    }
}
