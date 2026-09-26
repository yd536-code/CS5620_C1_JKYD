import {Mat4, Vec2, Vec3, VectorBase, VectorType} from "../../math/linalg";

/**
 * The smallest particle contract: anything with a `position` of vector type `V` (e.g., `Vec2` or `Vec3`).
 * Particle system models are parameterized over a particle type that satisfies this interface.
 *
 * Not to be confused with the classes `BasicParticle2D`/`BasicParticle3D` in `BasicInterfaceParticles.ts`: those
 * satisfy this interface (through `ABasicParticle`), but they're an alternate design. The particle systems use the
 * `Particle2D`/`AParticle2D` and `Particle3D`/`AParticle3D` family, which extends this interface.
 * @typeParam V The vector type of the particle's position.
 */
export interface BasicParticle<V extends VectorType>{
    get position():V;
}
