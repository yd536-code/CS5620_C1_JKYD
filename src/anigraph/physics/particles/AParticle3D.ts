import {V3, Vec3} from "../../math";
import {AParticle} from "./AParticle";

/** A 3D particle with mass, position, and velocity. */
export interface Particle3D extends AParticle<Vec3>{
    mass:number;
    position:Vec3;
    velocity:Vec3;
}

/** A basic 3D particle with mass, position, velocity, size, and a visibility flag. */
export class AParticle3D implements Particle3D{
    mass:number;
    position:Vec3;
    velocity:Vec3;
    visible:boolean=true;
    size:number;

    /** True when `visible` is false. */
    get hidden(){
        return !this.visible;
    }

    /**
     * @param position Defaults to the origin.
     * @param velocity Defaults to zero.
     * @param mass Defaults to 1.
     * @param size Defaults to 1.
     */
    constructor(position?:Vec3, velocity?:Vec3, mass?:number, size?:number){
        this.position = position??V3();
        this.velocity = velocity??V3();
        this.mass = mass??1;
        this.size = size??1;
    }
}



