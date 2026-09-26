import * as THREE from "three";
import { VectorBase } from "../VectorBase";
import { Random } from "../../Random";
import { ASerializable } from "../../../base/aserial";
import { Vec2 } from "../2D/Vec2";
import { Vec4 } from "./Vec4";
import { Quaternion } from "./Quaternion";

/**
 * A 3-component vector. Used both for 3D points/directions and for 2D points/directions in homogeneous coordinates
 * `(x, y, h)`, which is why it lives in the `2D` folder: {@link Mat3} multiplies `Vec3`s. `h` is another name for
 * `z`.
 */
@ASerializable("Vec3")
export class Vec3 extends VectorBase {
  static N_DIMENSIONS: number = 3;
  /** Creates a Vec3 from x, y, and z, or from an array of elements. With no arguments, creates `(0, 0, 0)`. */
  public constructor(x: number, y: number, z: number);
  public constructor(elements?: Array<number>);
  public constructor(...args: Array<any>) {
    // common logic constructor
    super(...args);
  }

  /** Returns `(1, 0, 0)`. */
  static UnitX(){
    return new this(1,0,0);
  }

  /** Returns `(0, 1, 0)`. */
  static UnitY(){
    return new this(0,1,0);
  }

  /** Returns `(0, 0, 1)`. */
  static UnitZ(){
    return new this(0,0,1);
  }


  toString() {
    return `Vec3(${this.x},${this.y},${this.z})`;
  }

  get nDimensions() {
    return 3;
  }

  /** The x and y components, as a new `Vec2`. Setting it changes x and y in place. */
  get xy() {
    return new Vec2(this.elements[0], this.elements[1]);
  }
  set xy(value: Vec2) {
    this.elements[0] = value.x;
    this.elements[1] = value.y;
  }

  get z() {
    return this.elements[2];
  }
  set z(val: number) {
    this.elements[2] = val;
  }
  /** The homogeneous coordinate for a 2D point or direction. Same as `z`. */
  get h() {
    return this.elements[2];
  }
  set h(val: number) {
    this.elements[2] = val;
  }

  // get i(){
  //     return this.elements[0];
  // }
  // get j(){
  //     return this.elements[1];
  // }
  // get k(){
  //     return this.elements[2];
  // }

  _setToDefault() {
    this.elements = [0, 0, 0];
  }

  /**
   * Returns the cross product `this x other`.
   */
  cross(other: Vec3): Vec3 {
    return new Vec3(
      this.y * other.z - this.z * other.y,
      this.z * other.x - this.x * other.z,
      this.x * other.y - this.y * other.x
    );
  }

  /**
   * Treats this as a homogeneous 2D point: divides x and y by `h` and sets `h` to 1, in place. Does nothing if `h`
   * is 1 or exactly 0 (a direction).
   */
  homogenize() {
    if (this.h === 1 || this.h === 0) {
      return;
    }
    let ooh: number = 1.0 / this.h;
    this.elements[0] = this.elements[0] * ooh;
    this.elements[1] = this.elements[1] * ooh;
    this.h = 1;
  }

  /** Returns a homogenized copy (see {@link Vec3.homogenize}). */
  getHomogenized() {
    const h = this.clone();
    h.homogenize();
    return h;
  }

  /** Returns x and y as a new `Vec2` (same as `xy`, but read-only). */
  get XY() {
    return new Vec2(this.x, this.y);
  }

  /** Returns the 2D point this homogeneous vector represents (homogenized, with `h` dropped). */
  get Point2D() {
    let h = this.getHomogenized();
    return new Vec2(h.x, h.y);
  }
  /** Returns this 3D point in homogeneous coordinates: `Vec4(x, y, z, 1)`. */
  get Point3DH() {
    return new Vec4(this.x, this.y, this.z, 1);
  }

  /** Returns this 3D direction in homogeneous coordinates: `Vec4(x, y, z, 0)`. */
  get Vec3DH() {
    return new Vec4(this.x, this.y, this.z, 0);
  }

  /** Returns the 2D point `p` in homogeneous coordinates: `(x, y, 1)`. */
  static From2DHPoint(p: Vec2) {
    return new Vec3(p.x, p.y, 1.0);
  }
  /** Returns `(p.x, p.y, 0)` (a 2D direction in homogeneous coordinates, or a 3D point in the z = 0 plane). */
  static FromVec2(p: Vec2) {
    return new Vec3(p.x, p.y, 0.0);
  }

  /**
   * Returns a random vector. Each component is uniform in `[0, 1]`, or in `[range[0], range[1]]` if `range` is given.
   */
  static Random(range?:[number,number]) {
    var r = new this(Random.floatArray(3));
    if(range !== undefined){
      r = new this(range[0],range[0], range[0]).plus(r.times(range[1]-range[0]));
    }
    return r;
  }

  /** Returns a Vec3 copy of a `THREE.Vector3`. */
  static FromThreeJS(vec: THREE.Vector3) {
    return new this(vec.x, vec.y, vec.z);
  }

  /** Returns a short string like `[1,2,3]`, with `precision` significant digits if given. */
  sstring(precision?:number) {
    return `[${this.x.toPrecision(precision)},${this.y.toPrecision(precision)},${this.z.toPrecision(precision)}]`;
  }

  /** Returns this vector as a new `THREE.Vector3`. */
  asThreeJS() {
    return new THREE.Vector3(this.x, this.y, this.z);
  }

  /**
   * Returns this vector rotated by the quaternion `q`, the same rotation as `q.Mat3()`. Usually called through
   * {@link Quaternion.appliedTo}.
   */
  getRotatedByQuaternion(q: Quaternion) {
    const x = this.x,
      y = this.y,
      z = this.z;
    const qx = q.x,
      qy = q.y,
      qz = q.z,
      qw = q.w;

    // calculate quat * vector
    const ix = qw * x + qy * z - qz * y;
    const iy = qw * y + qz * x - qx * z;
    const iz = qw * z + qx * y - qy * x;
    const iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    let rval = new Vec3();
    rval.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    rval.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    rval.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return rval;
  }
}

/** Shorthand for `new Vec3(...)`: `V3(x, y, z)` or `V3([x, y, z])`. */
export function V3(...elements: any[]) {
  return new Vec3(...elements);
}

function _Vec2DH(x: number, y: number) {
  return new Vec3(x, y, 0);
}
function _Point2DH(x: number, y: number) {
  return new Vec3(x, y, 1);
}

/** Returns a 2D direction in homogeneous coordinates, `Vec3(x, y, 0)`. Takes `x, y`, a `Vec2`, or `[x, y]`. */
export function Vec2DH(x: number, y: number): Vec3;
export function Vec2DH(vec2: Vec2): Vec3;
export function Vec2DH(xy: [number, number]): Vec3;
export function Vec2DH(...args: any[]) {
  if (args[0] instanceof VectorBase) {
    return _Vec2DH(args[0].x, args[0].y);
  } else if (Array.isArray(args[0])) {
    return _Vec2DH(args[0][0], args[0][1]);
  } else {
    return _Vec2DH(args[0], args[1]);
  }
}

/** Returns a 2D point in homogeneous coordinates, `Vec3(x, y, 1)`. Takes `x, y`, a `Vec2`, or `[x, y]`. */
export function Point2DH(x: number, y: number): Vec3;
export function Point2DH(vec2: Vec2): Vec3;
export function Point2DH(xy: [number, number]): Vec3;
export function Point2DH(...args: any[]) {
  if (args[0] instanceof VectorBase) {
    return _Point2DH(args[0].x, args[0].y);
  } else if (Array.isArray(args[0])) {
    return _Point2DH(args[0][0], args[0][1]);
  } else {
    return _Point2DH(args[0], args[1]);
  }
}

