import {AObject, ASerializable} from "../../base";
import {Particle3D} from "../../physics/particles/AParticle3D";
import {ANodeModel3D} from "../../scene";
import {BasicParticle} from "../../physics";
import {ParticleEvents} from "../../physics/particles/AParticleEnums";
import {ParticleSystemModelInterface} from "./ParticleSystemModelInterface";


/**
 * A 3D node model that holds an array of particles of type `P`. Call `signalParticlesUpdated()` after changing the
 * particles so that views listening with `addParticlesListener` (e.g., `AParticleSystemView3D`) redraw them.
 * @typeParam P The particle type.
 */
@ASerializable("AParticleSystemModel3D")
export class AParticleSystemModel3D<P extends BasicParticle<any>> extends ANodeModel3D implements ParticleSystemModelInterface<any>{
    /** The particles in this system. */
    particles:P[]=[];
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

    // timeUpdate(t: number, ...args:any[]) {
    //     super.timeUpdate(t, ...args);
    //     this.signalParticlesUpdated();
    // }

}
