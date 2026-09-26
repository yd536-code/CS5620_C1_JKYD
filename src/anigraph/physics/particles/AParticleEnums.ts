/** Particle-system defaults. */
export enum AParticleEnums{
    /** Number of particles an instanced particle system model creates when no count is given. */
    DEFAULT_MAX_N_PARTICLES=200
}


/** Event names used by particle system models. */
export enum ParticleEvents{
    /** Sent by `signalParticlesUpdated()`; particle system views redraw their particles when they hear it. */
    PARTICLES_UPDATED="PARTICLES_UPDATED"
}