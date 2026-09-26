import {Particle3D} from "../../physics/particles/AParticle3D";
import {AGLNodeView} from "../../scene";
import {AGraphicGroup, AInstancedGraphic} from "../../rendering";
import {AParticleSystemModel3D} from "./AParticleSystemModel3D";
import {Color, Mat4} from "../../math";
import {AInstancedParticleSystemGraphic3D} from "./InstancedParticles";
import {BasicParticle} from "../../physics/particles";
import {ParticleSystemModelInterface} from "./ParticleSystemModelInterface";

/**
 * Base view for 3D particle systems. `init()` creates a graphic group holding the particle graphic returned by
 * `createParticlesElement()`, and the view calls `updateParticles()` whenever its model signals `PARTICLES_UPDATED`.
 * @typeParam P The particle type.
 */
export abstract class AParticleSystemView3D<P extends BasicParticle<any>> extends AGLNodeView{

    /** Copies the model's particle data into the particle graphic. Called on each `PARTICLES_UPDATED` event. */
    abstract updateParticles():void;
    /** Creates the graphic that draws the particles. Called once from `init()`. */
    abstract createParticlesElement(...args:any[]):AInstancedParticleSystemGraphic3D;

    /** Group that holds the particle graphic. */
    particleGroup!:AGraphicGroup;
    _particlesElement!:AInstancedParticleSystemGraphic3D;
    /** The graphic that draws the particles. */
    get particlesElement(){
        return this._particlesElement;
    }

    /** The particle system model this view draws. */
    get model():ParticleSystemModelInterface<P>{
        return this._model as AParticleSystemModel3D<P>;
    }



    /** Creates `particleGroup` and adds the particle graphic from `createParticlesElement()` to it. */
    init() {
        this.particleGroup = new AGraphicGroup();
        this.registerGraphic(this.particleGroup);
        this.add(this.particleGroup);
        this._particlesElement = this.createParticlesElement();
        this.particleGroup.add(this.particlesElement);
    }

    /** Adds the usual model listeners plus the particle-update listener (see `addParticleSubscriptions`). */
    setModelListeners() {
        super.setModelListeners();
        this.addParticleSubscriptions();
    }

    /** Subscribes to the model's particle updates so that each one calls `updateParticles()`. */
    addParticleSubscriptions(){
        this.subscribe(this.model.addParticlesListener(()=>{
            this.updateParticles();
        }))
    }



    // update(...args:any[]) {
    //     for(let p=0;p<this.model.particles.length;p++){
    //         this.particlesElement.setParticle(p, this.model.particles[p]);
    //     }
    //     this.particlesElement.setNeedsUpdate();
    // }
}



