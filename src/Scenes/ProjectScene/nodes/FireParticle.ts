import {Color, Particle2D, V2} from "../../../anigraph";

export class FireParticle implements Particle2D {
    position = V2(0, 0);
    velocity = V2(0, 0);
    color = Color.FromString("#ffe066");
    size = 0.2;
    startSize = 0.2;
    t0 = 0;
    lifespan = 1.5;
    visible = false;
    depth = 0;
}