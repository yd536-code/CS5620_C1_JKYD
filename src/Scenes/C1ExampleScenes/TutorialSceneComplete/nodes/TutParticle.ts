import {Color, Particle2D, V2, Vec2} from "../../../../anigraph";

/**
 * Step 11.1: the data for one particle, copied from ParticlePlayground2D's `PlaygroundParticle`. A particle is just
 * a bundle of numbers; {@link TutParticleSystemModel} decides what they are, and {@link TutParticleSystemView}
 * draws them.
 */
export class TutParticle implements Particle2D {
    /** Where the particle is drawn. */
    position: Vec2 = V2();

    /** Where it was emitted. */
    position0: Vec2 = V2();

    /** When it was emitted, in seconds. -1 means "emit on the next frame". */
    t0: number = 0;

    /** Its color. The alpha (`color.a`) is its opacity. */
    color: Color = Color.White();

    /** The width of its square, in world units. */
    size: number = 1;

    /** Hidden particles aren't drawn. */
    visible: boolean = false;

    /** Required by the `Particle2D` interface; unused here. */
    depth: number = 0;
}
