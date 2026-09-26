import {AParticleSystemModel3D} from "./AParticleSystemModel3D";
import {AObject, ASerializable} from "../../base";
import {AParticle} from "../../physics";
import {ANodeModel2D} from "../../scene";
import {ParticleEvents} from "../../physics/particles/AParticleEnums";
import {ParticleSystemModelInterface} from "./ParticleSystemModelInterface";


/**
 * A 2D node model that holds an array of particles of type `P`. Call `signalParticlesUpdated()` after changing the
 * particles so that views listening with `addParticlesListener` redraw them.
 * @typeParam P The particle type.
 */
@ASerializable("AParticleSystemModel2D")
export class AParticleSystemModel2D<P extends AParticle<any>> extends ANodeModel2D implements ParticleSystemModelInterface<P>{
    _particles:P[]=[];
    /** The particles in this system. */
    set particles(value){this._particles = value;}
    get particles(){return this._particles;}
    /** Number of particles. */
    get nParticles(){
        return this.particles.length;
    }

    /**
     * Adds a listener that is called whenever `signalParticlesUpdated()` sends the `PARTICLES_UPDATED` event.
     * @param callback Called when the particles are updated.
     * @param handle Optional handle for the listener.
     * @param synchronous ignored; events always run synchronously. Kept so existing calls still type-check.
     * @returns An {@link AEventCallbackSwitch} that can deactivate the listener.
     */
    addParticlesListener(callback:(self:AObject)=>void, handle?:string, synchronous:boolean=true,){
        return this.addEventListener(ParticleEvents.PARTICLES_UPDATED,callback, handle);
    }

    /** Sends the `PARTICLES_UPDATED` event so listening views redraw the particles. */
    signalParticlesUpdated(...args:any[]){
        this.signalEvent(ParticleEvents.PARTICLES_UPDATED, ...args);
    }


    /** Appends a particle to `particles`. Does not signal an update; call `signalParticlesUpdated()` when ready. */
    addParticle(particle:P){
        this.particles.push(particle);
    }

}
