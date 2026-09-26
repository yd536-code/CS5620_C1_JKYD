import {Color, Particle2D, V2, Vec2} from "../../../../anigraph";

/**
 * The data for one particle. A particle is just a bundle of numbers: it has no behavior of its own. Everything a
 * particle does (when it appears, how it moves, when it disappears) is decided by
 * `LabCatParticlePlaygroundModel.updateParticles()`, which reads and writes these fields every frame.
 *
 * The particle system allocates a fixed number of these up front and never creates or destroys any. To "create" a
 * particle you take an existing one, set its fields, and make it visible. To "destroy" one you hide it.
 */
export class PlaygroundParticle implements Particle2D {
    /** Where the particle is right now, in the playground's coordinates. This is what gets drawn. */
    position: Vec2 = V2();

    /** Where the particle was when it was emitted. Handy for motion that is defined relative to a starting point. */
    position0: Vec2 = V2();

    /**
     * The time at which the particle was emitted.
     * A value of -1 is special: it means "emit this particle on the next frame" (see `fire()` and `updateParticles()`).
     */
    t0: number = 0;

    /** The particle's color. Its alpha (`color.a`) controls opacity. */
    color: Color = Color.White();

    /** The width of the particle's square, in world units. */
    size: number = 1;

    /** Hidden particles are not drawn. Every particle starts hidden. */
    visible: boolean = false;

    /** Required by the `Particle2D` interface, which the particle view expects. This scene doesn't use it. */
    depth: number = 0;
}
