import {ASerializable, AssetManager, Color, V2, Vec2} from "../../../../anigraph";
import {
    AInstancedParticleSystemModel2D
} from "../../../../anigraph/starter/nodes/instancedparticlesystem2d/AInstancedParticleSystemModel2D";
import {TutParticle} from "./TutParticle";

/** The name the particle texture is stored under. */
const PARTICLE_TEXTURE_NAME = "TutParticleTexture";

/**
 * Steps 11.1 and 11.2: a small instanced particle system. It creates a fixed set of hidden particles at the start
 * and never creates or destroys any more: to "emit" one, it takes the next particle in line, sets its fields, and
 * makes it visible.
 *
 * Emitting uses the `t0 = -1` pattern from the Particles page: `fire()` only marks a particle, and the next
 * `timeUpdate` emits it, so every particle's `t0` is a frame time. Emitted particles stay where they were put.
 * Everything else particles could do (move, fade, have lifespans) is left to you.
 */
@ASerializable("TutParticleSystemModel")
export class TutParticleSystemModel extends AInstancedParticleSystemModel2D<TutParticle>{
    /** How many particles exist; the most that can be visible at once. */
    static NParticles = 50;

    /** The index of the particle the next `fire()` uses. Wraps around, reusing the oldest particle. */
    nextParticle: number = 0;

    /** Where marked particles are emitted. The scene model sets it (it's another node's position). */
    emitPosition: Vec2 = V2(0, 0);

    /** The time of the current frame, in seconds. */
    time: number = 0;

    /** The time of the last `timeUpdate`, for computing `dt`. */
    lastTime?: number;

    /**
     * Loads the particle shaders (the scene model's `super.PreloadAssets()` loads only the standard materials) and
     * the particle texture, a soft white dot.
     */
    static async PreloadAssets(){
        await AssetManager.loadShaderMaterialModel(AssetManager.DEFAULT_MATERIALS.INSTANCED_TEXTURE2D_SHADER);
        await AssetManager.loadShaderMaterialModel(AssetManager.DEFAULT_MATERIALS.PARTICLE_TEXTURE_2D_SHADER);
        await AssetManager.loadTexture("./images/gradientParticle.png", PARTICLE_TEXTURE_NAME);
    }

    constructor(){
        super();
        this.initParticles(TutParticleSystemModel.NParticles);
        // The particle material draws each particle as the texture times the particle's color.
        // "opacityInMatrix" lets each particle's color alpha control its opacity.
        const material = AssetManager.CreateShaderMaterial(AssetManager.DEFAULT_MATERIALS.PARTICLE_TEXTURE_2D_SHADER);
        material.setUniform("opacityInMatrix", true);
        material.setTexture("diffuse", AssetManager.getTexture(PARTICLE_TEXTURE_NAME));
        this.setMaterial(material);
    }

    /**
     * Creates the fixed set of particles, all hidden.
     * @param nParticles how many to create
     */
    initParticles(nParticles: number){
        for(let i=0;i<nParticles;i++){
            this.addParticle(new TutParticle());
        }
        this.signalParticlesUpdated();
    }

    /** Marks the next particle to be emitted on the next frame, then moves on to the one after it. */
    fire(){
        this.particles[this.nextParticle].t0 = -1;
        this.nextParticle = (this.nextParticle + 1) % this.particles.length;
    }

    /**
     * Puts a particle at the emit position, stamps it with the current time, and shows it. The positions are
     * cloned, so the particle doesn't share a `Vec2` with anything else.
     * @param particle the particle to emit
     */
    emit(particle: TutParticle){
        particle.position = this.emitPosition.clone();
        particle.position0 = this.emitPosition.clone();
        particle.t0 = this.time;
        particle.color = Color.FromString("#ff8800");
        particle.size = 0.6;
        particle.visible = true;
    }

    /**
     * Emits any marked particles. Called every frame from `timeUpdate`.
     * @param t the current time, in seconds
     * @param dt the time since the last frame, in seconds
     */
    updateParticles(t: number, dt: number){
        for(const particle of this.particles){
            if(particle.t0 === -1){
                this.emit(particle);
            }
        }
        // Particle changes aren't detected on their own: this tells the view to redraw them.
        this.signalParticlesUpdated();
    }

    /**
     * Records the frame time and updates the particles.
     * @param t the current time, in seconds
     * @param args anything else the caller passes
     */
    timeUpdate(t: number, ...args: any[]){
        super.timeUpdate(t, ...args);
        const dt = (this.lastTime === undefined) ? 0 : t - this.lastTime;
        this.lastTime = t;
        this.time = t;
        this.updateParticles(t, dt);
    }
}
