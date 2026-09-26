import {Color, V2, Vec2, VectorBase} from "../../math";
import {AParticle} from "./AParticle";


/** A 2D particle: a position, a depth (draw order), and optional visibility. */
export interface Particle2D extends AParticle<Vec2>{
    position:Vec2;
    /** Depth used for draw ordering. */
    depth:number;
    visible?:boolean;
}

/**
 * Properties for constructing a 2D particle (see {@link AParticle2D} and {@link AParticleEuler2D}). Only the
 * fields those constructors read are used: `position`, `size` (as a number), `depth`, `visible`, and, for
 * {@link AParticleEuler2D}, `velocity` and `mass`.
 */
export interface ParticleProperties2D extends Particle2D{
    velocity?:Vec2;
    mass?:number;
    size?:number|VectorBase;
    color?:Color;
    get id():number|string;
}

/** A basic 2D particle with a position, size, depth, and visibility flag. */
export class AParticle2D implements Particle2D{
    protected _id!:number;
    position:Vec2;
    visible:boolean=true;
    size:number;
    depth:number=0;

    /** Half of `size`. */
    get radius(){
        return this.size*0.5;
    }



    /** The particle's id. Not set by the constructor. */
    set id(value){this._id = value;}
    get id(){return this._id;}

    /** True when `visible` is false. */
    get hidden(){
        return !this.visible;
    }

    /** Sets `visible` to true. */
    show(){
        this.visible=true;
    }
    /** Sets `visible` to false. */
    hide(){
        this.visible=false;
}

    /**
     * @param properties Optional initial `position` (default origin), `size` (default 1; a size of 0 stays 0),
     * `depth` (default 0), and `visible` (default true).
     */
    constructor(properties?:ParticleProperties2D){
        if(properties !== undefined){
            this.position = properties.position??V2();
            // `??` (not `||`) so that a size of 0 is kept; only a missing size becomes 1.
            this.size = (properties.size as number|undefined)??1;
            this.depth = properties.depth??0;
            this.visible = properties.visible??true;
        }else{
            this.position = V2();
            this.size = 1;
            this.depth = 0;
        }
    }
}


/** A 2D particle with a velocity and mass, for simple Euler-integration simulations. */
export class AParticleEuler2D extends AParticle2D{
    velocity:Vec2;
    mass:number=1;
    /** @param properties Same as {@link AParticle2D}'s, plus optional `velocity` (default zero) and `mass` (default 1). */
    constructor(properties?:ParticleProperties2D) {
        super(properties);
        if(properties !== undefined){
            this.velocity = properties.velocity??V2();
            this.mass = (properties.mass !== undefined)?properties.mass:1;
        }else{
            this.velocity = V2();
            this.mass = 1;
        }
    }

}


