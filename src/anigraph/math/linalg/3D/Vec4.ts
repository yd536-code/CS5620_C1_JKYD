import { VectorBase } from "../VectorBase";
import { Random } from "../../Random";
import { ASerializable } from "../../../base/aserial";
import { Vec2, Vec3 } from "../2D";
import { Precision } from "../../Precision";

import * as THREE from "three";

/**
 * A 4D vector, usually a 3D point or direction in homogeneous coordinates `(x, y, z, h)`: `h = 1` for points and
 * `h = 0` for directions. {@link Mat4} multiplies `Vec4`s.
 */
@ASerializable("Vec4")
export class Vec4 extends VectorBase{
    static N_DIMENSIONS:number=4;
    /** Creates a Vec4 from its four components, or from an array of elements. With no arguments, creates all zeros. */
    public constructor(x: number, y: number, z: number, h:number);
    public constructor(elements?: Array<number>);
    public constructor(...args: Array<any>) { // common logic constructor

        super(...args);
    }

  toString() {
    return `Vec4(${this.x},${this.y},${this.z},${this.h})`;
  }

  get nDimensions() {
    return 4;
  }

  /** Returns `(1, 0, 0, 0)`. */
  static i() {
    return new Vec4(1, 0, 0, 0);
  }
  /** Returns `(0, 1, 0, 0)`. */
  static j() {
    return new Vec4(0, 1, 0, 0);
  }
  /** Returns `(0, 0, 1, 0)`. */
  static k() {
    return new Vec4(0, 0, 1, 0);
  }
  /** Returns `(0, 0, 0, 1)`. */
  static h() {
    return new Vec4(0, 0, 0, 1);
  }

  /** Returns the 2D point `v2` as a homogeneous 3D point in the z = 0 plane: `(x, y, 0, 1)`. */
  static FromPoint2DXY(v2: Vec2) {
    return new Vec4(v2.x, v2.y, 0.0, 1.0);
  }
  /** Returns the 2D direction `v2` as a homogeneous 3D direction: `(x, y, 0, 0)`. */
  static FromVec2DXY(v2: Vec2) {
    return new Vec4(v2.x, v2.y, 0.0, 0.0);
  }

  get z() {
    return this.elements[2];
  }
  set z(val: number) {
    this.elements[2] = val;
  }
  /** The homogeneous (fourth) coordinate. */
  get h() {
    return this.elements[3];
  }
  set h(val: number) {
    this.elements[3] = val;
  }

  /**
   * Divides x, y, and z by `h` and sets `h` to 1, in place. Does nothing if `h` is already 1 or is (nearly) zero
   * (a direction).
   */
  homogenize() {
    if (this.h === 1 || Precision.isTiny(this.h)) {
      return;
    }
    let ooh: number = 1.0 / this.h;
    this.elements[0] = this.elements[0] * ooh;
    this.elements[1] = this.elements[1] * ooh;
    this.elements[2] = this.elements[2] * ooh;
    this.h = 1;
  }

  _setToDefault() {
    this.elements = [0, 0, 0, 0];
  }

  /** Returns a homogenized copy of this vector (see {@link Vec4.homogenize}). */
  getHomogenized() {
    const h = this.clone();
    h.homogenize();
    return h;
  }

  /** Returns the 3D point this homogeneous vector represents (homogenized, with `h` dropped). */
  get Point3D() {
    let h = this.getHomogenized();
    return new Vec3(h.x, h.y, h.z);
  }

  /** Returns a vector with each component uniform in `[0, 1]`. */
  static Random() {
    var r = new this(Random.floatArray(4));
    return r;
  }

  /** Returns a short string with the x, y, and z components (`h` is left out). */
  sstring() {
    return `[${this.x},${this.y},${this.z}]`;
  }

  /** Returns this vector as a `THREE.Vector4` (with `h` as `w`). */
  asThreeJS() {
    return new THREE.Vector4(this.x, this.y, this.z, this.h);
  }
}

/** Shorthand for `new Vec4(x, y, z, h)`. */
export function V4(x:number, y:number, z:number, h:number){
    return new Vec4(x,y,z,h);
// export function V4(...elements:any[]){
//     return new Vec4(...elements);
}
/** Shorthand for `new Vec4(...elements)`: takes four numbers or one array. */
export function V4A(...elements:any[]){
    return new Vec4(...elements);
}
