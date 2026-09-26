import {Mat4, Vec2, Vec3, VectorBase, VectorType} from "../../math/linalg";

/**
 * The smallest particle contract: anything with a `position` of vector type `V` (e.g., `Vec2` or `Vec3`).
 * Particle system models are parameterized over a particle type that satisfies this interface.
 * @typeParam V The vector type of the particle's position.
 */
export interface AParticle<V extends VectorType>{
    get position():V;
}
