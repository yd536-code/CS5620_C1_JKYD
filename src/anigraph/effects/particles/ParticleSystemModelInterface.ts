import { ANodeModel} from "../../scene";
import {AParticle} from "../../physics";
import {AEventCallbackSwitch, AObject} from "../../base";


/**
 * What a particle system view needs from its model: the array of particles and a way to hear when they change.
 * Implemented by `AParticleSystemModel2D` and `AParticleSystemModel3D`.
 * @typeParam P The particle type.
 */
export interface ParticleSystemModelInterface<P extends AParticle<any>> extends ANodeModel{
    particles:P[];
    get nParticles():number;
    /** Adds a listener for the `PARTICLES_UPDATED` event. Returns a switch that can deactivate it. */
    addParticlesListener(callback:(self:AObject)=>void, handle?:string, synchronous?:boolean):AEventCallbackSwitch;
}
