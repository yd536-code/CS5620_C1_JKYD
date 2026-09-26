import {Mat4, Vec2, Vec3, VectorBase} from "../../math";
import {BasicParticle} from "./BasicParticle";

/**
 * An alternative particle base class that separates how the position is stored (`StoredType`) from how it is
 * exposed (`InterfaceType`), e.g., a 2D position stored as a homogeneous `Vec3`. Adds mass, radius, an id, and a
 * visibility flag.
 *
 * Particles start hidden (`visible` is false) on purpose, so a particle system can create all of its particles up
 * front and show each one only when it is used. Call `show()` to make a particle visible.
 * @typeParam InterfaceType The vector type `position` returns.
 * @typeParam StoredType The vector type the position is stored as.
 */
export abstract class ABasicParticle<InterfaceType extends VectorBase, StoredType extends VectorBase> implements BasicParticle<InterfaceType>{
    mass:number=1;
    protected _position!:StoredType;
    abstract get position():InterfaceType;
    abstract set position(v:InterfaceType|StoredType);
    protected _radius:number=1;
    /** Particle radius (default 1). */
    get radius(){return this._radius;}
    set radius(v:number){this._radius = v;}
    protected _id:number=0;
    /** The particle's id (read-only; default 0). */
    get id(){return this._id;}
    protected _visible:boolean=false;
    /** Whether the particle is shown. Starts false (see the class docs); `show()` and `hide()` change it. */
    get visible(){
        return this._visible;
    }
    /** Makes the particle visible. */
    show(){
        this._visible=true;
    }
    /** Hides the particle. */
    hide(){
        this._visible=false;
    }
}

/** An `ABasicParticle` that also has a velocity, stored as `StoredType` and exposed as `InterfaceType`. */
export abstract class PhysicalParticle<InterfaceType extends VectorBase, StoredType extends VectorBase> extends ABasicParticle<InterfaceType, StoredType>{
    public _velocity!:StoredType;
    abstract get velocity():InterfaceType;
    abstract set velocity(v:InterfaceType|StoredType);
    mass:number=1;
}


/** An `ABasicParticle` with a `Vec3` position stored as-is. */
export class BasicParticle3D extends ABasicParticle<Vec3, Vec3>{
    get position(){
        return this._position;
    }
    set position(v:Vec3){
        this._position = v;
    }
}

/** A `PhysicalParticle` with `Vec3` position and velocity stored as-is. */
export class AParticleOther3D extends PhysicalParticle<Vec3, Vec3>{
    get position(){
        return this._position;
    }
    set position(v:Vec3){
        this._position = v;
    }

    _velocity!:Vec3
    get velocity(): Vec3 {
        return this._velocity;
    }
    set velocity(v:Vec3){
        this._velocity=v;
    }



}

/**
 * An `ABasicParticle` whose 2D position is stored as a homogeneous `Vec3`. Setting `position` stores `(x, y, 1)`;
 * reading it returns the stored x and y. `position3D` gives the stored `Vec3` directly.
 */
export class BasicParticle2D extends ABasicParticle<Vec2, Vec3>{
    projection!:Mat4;
    get position(){
        return this._position.xy;
    }
    set position(v:Vec2){
        this._position = new Vec3(v.x, v.y, 1);
    }
    set position3D(v:Vec3){
        this._position = v;
    }
    get position3D(){return this._position;}
}
