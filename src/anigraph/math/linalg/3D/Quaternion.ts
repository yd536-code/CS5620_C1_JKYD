import * as THREE from "three";
import { Matrix4, Vector3 } from "three";
import { V4, Vec4 } from "./Vec4";
import { V3, Vec3 } from "./Vec3";
import { Mat4 } from "./Mat4";
import { Mat3 } from "../2D";
import { Precision } from "../../Precision";
import { ASerializable } from "../../../base/aserial";

/**
 * A rotation stored as a unit quaternion `(x, y, z, w)`. Used for {@link NodeTransform3D.rotation}.
 *
 * It uses the standard convention, the same one three.js uses: a rotation by angle `θ` about the unit axis `a` is
 * stored as `(sin(θ/2)·a, cos(θ/2))`. So a `Quaternion` holds the same x, y, z, w as the `THREE.Quaternion` for the
 * same rotation, and the methods inherited from `THREE.Quaternion` (`setFromEuler`, `setFromAxisAngle`, `slerp`, ...)
 * agree with AniGraph's own.
 *
 * `FromAxisAngle`, `FromMatrix`, `Mat3()`/`Mat4()`, and `appliedTo` all agree with each other (e.g.,
 * `Quaternion.FromAxisAngle(axis, a).Mat4()` equals `Mat4.RotationAxisAngle(axis, a)` for a unit axis), and
 * `a.times(b)` follows matrix order: it applies `b` first, then `a` (see {@link Quaternion.times}).
 *
 * It extends `THREE.Quaternion`, which has no serialization support, so it defines its own `toJSON`/`fromJSON`;
 * that way a saved quaternion loads back as a `Quaternion` with its methods, not as a plain object.
 */
@ASerializable("Quaternion")
export class Quaternion extends THREE.Quaternion {
  protected _x!: number;
  protected _y!: number;
  protected _z!: number;
  protected _w!: number;

  /** Creates a quaternion from its components. With no arguments, creates the identity `(0, 0, 0, 1)`. */
  constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
    // super(x,y,z,w);
    super();
    this._x = x;
    this._y = y;
    this._z = z;
    this._w = w;
  }

  /**
   * The value `toJSON` writes in the `convention` field. It marks data saved with the standard (three.js)
   * convention, so `fromJSON` can tell it apart from data saved by older versions of AniGraph.
   */
  static readonly JSONConvention = "std";

  /** Set once `fromJSON` has warned about loading old-convention data, so it only warns once. */
  static _warnedOldConventionJSON = false;

  /** Returns `{x, y, z, w, convention: "std"}` for `JSON.stringify`. */
  toJSON() {
    return { x: this._x, y: this._y, z: this._z, w: this._w, convention: Quaternion.JSONConvention };
  }

  /**
   * Creates a quaternion from the object written by `toJSON`.
   *
   * Older versions of AniGraph stored the conjugate of the standard quaternion and wrote no `convention` field.
   * Data without that field is converted (x, y, z negated) so it loads as the same rotation it was saved as, and a
   * warning is logged the first time this happens.
   */
  static fromJSON(data: { x: number; y: number; z: number; w: number; convention?: string }) {
    if (data.convention === Quaternion.JSONConvention) {
      return new Quaternion(data.x, data.y, data.z, data.w);
    }
    if (!Quaternion._warnedOldConventionJSON) {
      Quaternion._warnedOldConventionJSON = true;
      console.warn(
        "Loading a Quaternion saved by an older version of AniGraph (no `convention` field). Converting it to the " +
        "current convention so it keeps the same rotation. Re-save the data to update it."
      );
    }
    return new Quaternion(-data.x, -data.y, -data.z, data.w);
  }

  /** Creates a quaternion from an array ordered `[w, x, y, z]`. */
  static FromWXYZ(wxyz: number[]) {
    return new Quaternion(wxyz[1], wxyz[2], wxyz[3], wxyz[0]);
  }

  /** Creates a quaternion with the same x, y, z, w as `q` (for example, a three.js object's `quaternion`). */
  static FromQuaternion(q: THREE.Quaternion) {
    return new Quaternion(q.x, q.y, q.z, q.w);
  }

  /** Returns a rotation by `radians` about the x axis. */
  static RotationX(radians: number) {
    return Quaternion.FromAxisAngle(new Vec3(1, 0, 0), radians);
  }
  /** Returns a rotation by `radians` about the y axis. */
  static RotationY(radians: number) {
    return Quaternion.FromAxisAngle(new Vec3(0, 1, 0), radians);
  }
  /** Returns a rotation by `radians` about the z axis. */
  static RotationZ(radians: number) {
    return Quaternion.FromAxisAngle(new Vec3(0, 0, 1), radians);
  }


  /** Returns the rotated x axis, `appliedTo((1, 0, 0))`. */
  getLocalX():Vec3{
    return this.appliedTo(V3(1,0,0));
  }
  /** Returns the rotated y axis, `appliedTo((0, 1, 0))`. */
  getLocalY():Vec3{
    return this.appliedTo(V3(0,1,0));
  };
  /** Returns the rotated z axis, `appliedTo((0, 0, 1))`. */
  getLocalZ():Vec3{
    return this.appliedTo(V3(0,0,1));
  };

  /** Scales this quaternion to unit length, in place. Returns this quaternion. */
  normalize(): Quaternion {
    super.normalize();
    return this;
  }

  /** Returns the components as a {@link Vec4} `(x, y, z, w)`. */
  get Vec4() {
    return new Vec4(this._x, this._y, this._z, this._w);
  }

  /** Returns `v` rotated by this quaternion (the same as `this.Mat3().times(v)`). */
  appliedTo(v: Vec3) {
    return v.getRotatedByQuaternion(this);
  }

  /**
   * Returns the normalized product of this quaternion and `q` (a matrix is first converted with `FromMatrix`).
   *
   * Order: `a.times(b)` follows matrix order. It rotates by `b` first and then by `a`, so `a.times(b).Mat4()` equals
   * `a.Mat4().times(b.Mat4())`.
   */
  times(q: Quaternion | Mat3 | Mat4) {
    let r = new Quaternion();
    if (q instanceof Quaternion) {
      r.multiplyQuaternions(this, q);
      return r.normalize();
    } else {
      let qm = Quaternion.FromMatrix(q);
      r.multiplyQuaternions(this, qm);
      return r.normalize();
    }
  }

  /** Returns a readable string like `Q(w=1, x=0, y=0, z=0)`. */
  asPrettyString(){
    return `Q(w=${this._w}, x=${this._x}, y=${this._y}, z=${this._z})`;
  }

  /**
   * Checks whether two quaternions represent the same rotation: every component (x, y, z, w) must match
   * within `tolerance`. Since `q` and `-q` are the same rotation, `other` also counts as equal if its
   * negation matches.
   * @param other The quaternion to compare to.
   * @param tolerance Allowed difference per component (default `Precision.epsilon`).
   */
  isEqualTo(other: Quaternion, tolerance?: number) {
    let epsilon: number =
      tolerance !== undefined ? tolerance : Precision.epsilon;
    const close = (sign: number) =>
      Math.abs(this.x - sign * other.x) <= epsilon &&
      Math.abs(this.y - sign * other.y) <= epsilon &&
      Math.abs(this.z - sign * other.z) <= epsilon &&
      Math.abs(this.w - sign * other.w) <= epsilon;
    return close(1) || close(-1);
  }

  /** Returns the inverse rotation as a new quaternion. */
  getInverse() {
    let r = new Quaternion(this.x, this.y, this.z, this.w);
    r.invert();
    return r;
  }

  /** Sets this quaternion to a uniformly random rotation, in place. Returns this quaternion. */
  randomize() {
    // Derived from http://planning.cs.uiuc.edu/node198.html
    // Note, this source uses w, x, y, z ordering,
    // so we swap the order below.

    const u1 = Math.random();
    const sqrt1u1 = Math.sqrt(1 - u1);
    const sqrtu1 = Math.sqrt(u1);

    const u2 = 2 * Math.PI * Math.random();

    const u3 = 2 * Math.PI * Math.random();

    return this.set(
      sqrt1u1 * Math.cos(u2),
      sqrtu1 * Math.sin(u3),
      sqrtu1 * Math.cos(u3),
      sqrt1u1 * Math.sin(u2)
    );
  }

  /**
   * Returns the rotation of a rotation matrix. Accepts a `Mat3`, a `Mat4` (its upper-left 3x3 is used), or a
   * `THREE.Matrix4`. The matrix's columns are normalized first, so a rotation times a positive scale works too.
   */
  static FromMatrix(m: Mat3 | Mat4 | Matrix4) {
    let r = new Quaternion();
    let mr = m;
    if (mr instanceof Matrix4) {
      mr = Mat4.FromThreeJS(mr);
    }
    if (mr instanceof Mat4) {
      r._setWithRotationMatrix(mr.getLinearPart());
    } else if (mr instanceof Mat3) {
      r._setWithRotationMatrix(mr);
    } else {
      console.error(`Issue with ${mr}`);
    }
    return r;
  }

  /**
   * Sets this quaternion, in place, to the rotation of the 3x3 matrix `M_in` (columns normalized first). `M_in` is
   * row-major, and its entries are named `m<row><col>`.
   */
  _setWithRotationMatrix(M_in: Mat3) {
    let m = M_in.clone();
    m.c0 = m.c0.getNormalized();
    m.c1 = m.c1.getNormalized();
    m.c2 = m.c2.getNormalized();
    // Each branch computes 4*s*(x, y, z, w) for some s > 0, using the largest of the diagonal-based terms to stay
    // numerically stable; `normalize()` below removes the scale.
    let q: Quaternion;
    if (m.m22 < 0) {
      if (m.m00 > m.m11) {
        let t = 1 + m.m00 - m.m11 - m.m22;
        q = new Quaternion(t, m.m01 + m.m10, m.m20 + m.m02, m.m21 - m.m12);
      } else {
        let t = 1 - m.m00 + m.m11 - m.m22;
        q = new Quaternion(m.m01 + m.m10, t, m.m12 + m.m21, m.m02 - m.m20);
      }
    } else {
      if (m.m00 < -m.m11) {
        let t = 1 - m.m00 - m.m11 + m.m22;
        q = new Quaternion(m.m20 + m.m02, m.m12 + m.m21, t, m.m10 - m.m01);
      } else {
        let t = 1 + m.m00 + m.m11 + m.m22;
        q = new Quaternion(m.m21 - m.m12, m.m02 - m.m20, m.m10 - m.m01, t);
      }
    }
    q.normalize();
    this.x = q.x;
    this.y = q.y;
    this.z = q.z;
    this.w = q.w;
  }

  /**
   * Returns a camera-style orientation: the local -z axis points along `forward` and the local y axis is as close to
   * `up` as possible.
   */
  static FromCameraOrientationVectors(forward: Vec3, up: Vec3) {
    let z = forward.getNormalized().times(-1);
    // let z = forward.getNormalized();
    let y = up;
    let x = y.cross(z).getNormalized();
    let upn = z.cross(x).getNormalized();
    let q = Quaternion.FromMatrix(
        Mat3.FromColumns(x, upn, z)
    );
    return q;
  }

  /** Returns an orientation whose local +z axis points along `z` and whose local y axis is as close to `up` as possible. */
  static FromZAndUp(z: Vec3, up: Vec3) {
    return Quaternion.FromCameraOrientationVectors(z.times(-1), up);
  }

  // static FromVectors(forward:Vec3, up:Vec3){
  //     let oaxis = forward.times(-1);
  //     // let oaxis = forward;
  //     if(Precision.PEQ(forward.dot(up), 1)){
  //         return Quaternion.FromRotationBetweenTwoVectors(oaxis, V3(0,0,-1));
  //     }
  //     return Quaternion.FromMatrix(
  //         Mat3.FromColumns(
  //             oaxis.cross(up).getNormalized(),
  //             up,
  //             oaxis
  //         )
  //     )
  // }

  /** Returns this rotation as a 3x3 rotation matrix. */
  Mat3() {
    var w = this._w;
    var x = this._x;
    var y = this._y;
    var z = this._z;

    var n = w * w + x * x + y * y + z * z;
    var s = n === 0 ? 0 : 2 / n;
    var wx = s * w * x,
      wy = s * w * y,
      wz = s * w * z;
    var xx = s * x * x,
      xy = s * x * y,
      xz = s * x * z;
    var yy = s * y * y,
      yz = s * y * z,
      zz = s * z * z;

    // The standard rotation matrix of a unit quaternion, row by row.
    return new Mat3(
      1 - (yy + zz), xy - wz, xz + wy,
      xy + wz, 1 - (xx + zz), yz - wx,
      xz - wy, yz + wx, 1 - (xx + yy)
    );
  }

  /** Same as `Mat4()`. */
  getMatrix() {
    return this.Mat4();
  }

  /** Returns this rotation as a 4x4 homogeneous rotation matrix. */
  Mat4() {
    var w = this._w;
    var x = this._x;
    var y = this._y;
    var z = this._z;

    var n = w * w + x * x + y * y + z * z;
    var s = n === 0 ? 0 : 2 / n;
    var wx = s * w * x,
      wy = s * w * y,
      wz = s * w * z;
    var xx = s * x * x,
      xy = s * x * y,
      xz = s * x * z;
    var yy = s * y * y,
      yz = s * y * z,
      zz = s * z * z;

    // The standard rotation matrix of a unit quaternion, row by row, in the upper-left 3x3.
    return new Mat4(
        1 - (yy + zz), xy - wz, xz + wy, 0,
        xy + wz, 1 - (xx + zz), yz - wx, 0,
        xz - wy, yz + wx, 1 - (xx + yy), 0,
        0, 0, 0, 1
    );
  }

  /** Returns the identity rotation. */
  static Identity() {
    let q = new Quaternion();
    q.identity();
    return q;
  }

  /** Returns the spherical linear interpolation between `qa` (at `t = 0`) and `qb` (at `t = 1`). */
  static Slerp(qa: Quaternion, qb: Quaternion, t: number): Quaternion {
    let r = new Quaternion();
    r.slerpQuaternions(qa, qb, t);
    return r;
  }

  /**
   * Returns a rotation by `angle` radians about `axis` (right-hand rule; the axis does not need to be unit length).
   */
  static FromAxisAngle(axis: Vec3 | Vector3, angle: number): Quaternion {
    const halfAngle = angle * 0.5;
    let s = Math.sin(halfAngle);
    let w = Math.cos(halfAngle);
    let sinorm =
      s / Math.sqrt(axis.x * axis.x + axis.y * axis.y + axis.z * axis.z);
    let x = axis.x * sinorm;
    let y = axis.y * sinorm;
    let z = axis.z * sinorm;
    return new Quaternion(x, y, z, w);
  }

  /**
   * Returns the rotation as a unit `axis` and an `angle` in radians between 0 and pi, so that
   * `FromAxisAngle(axis, angle)` is the same rotation. For example, `FromAxisAngle(a, t).getAxisAndAngle()` gives
   * `(a, t)` for `t` between 0 and pi (with `a` normalized), and `(-a, -t)` for `t` between -pi and 0. For the
   * identity rotation (angle 0), the axis is `(1, 0, 0)`; any axis would do.
   */
  getAxisAndAngle() {
    // q and -q are the same rotation; use the one with w >= 0 so the angle is at most pi.
    const sign = this.w < 0 ? -1 : 1;
    const x = sign * this.x, y = sign * this.y, z = sign * this.z, w = sign * this.w;
    const sinHalf = Math.sqrt(x * x + y * y + z * z);
    if (sinHalf < Precision.epsilon) {
      return { axis: new Vec3(1, 0, 0), angle: 0 };
    }
    return {
      axis: new Vec3(x / sinHalf, y / sinHalf, z / sinHalf),
      angle: 2 * Math.atan2(sinHalf, w),
    };
  }

  // public get axis(){
  //
  // }

  /**
   * Returns the rotation that turns the direction of `vFrom` into the direction of `vTo`. The inputs are not
   * changed.
   */
  static FromRotationBetweenTwoVectors(
    vFrom: Vec3 | Vector3,
    vTo: Vec3 | Vector3
  ): Quaternion {
    // Copy into new three.js vectors, so normalizing them doesn't change the caller's vectors.
    const start = new Vector3(vFrom.x, vFrom.y, vFrom.z).normalize();
    const end = new Vector3(vTo.x, vTo.y, vTo.z).normalize();
    let r = new Quaternion();
    r.setFromUnitVectors(start, end);
    return r;
  }

  /** Returns a uniformly random rotation. */
  static Random() {
    let r = new Quaternion();
    r.randomize();
    return r.normalize();
  }
}
