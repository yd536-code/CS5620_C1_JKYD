import {Vec3} from "../../../math";

/** Basic physical state shared by character models: mass, position, and velocity. */
export interface CharacterInterface{
    mass:number;
    position:Vec3;
    velocity:Vec3;
}
