import { ASerializable } from "../../base";
import { NodeTransform } from "./NodeTransform";
import {Vec2, Vec3, Mat3, Mat4, Quaternion, V4, V3, V2} from "../linalg";
import { Precision } from "../Precision";
import { NodeTransform3D } from "./NodeTransform3D";
import {TransformationInterface} from "../TransformationInterface";

/**
 * A 2D transform stored as position, rotation, scale, and anchor (PRSA). Its matrix is the product `M = P*R*S*A`,
 * where:
 * - P is a translation by `position`,
 * - R is a rotation by the angle `rotation` (radians, counterclockwise),
 * - S is a scale by `scale` (x and y factors),
 * - A is a translation by `-anchor`.
 *
 * The anchor is the point, in the object's own coordinates, that the object rotates and scales about; `position` is
 * where that point ends up in the parent's coordinates. (Translating by `-anchor` first is a convention used in
 * many animation tools.)
 *
 * Notes:
 * - The representation has redundancy: the same matrix can be reached with different position/anchor pairs (and,
 *   more subtly, with different rotation/scale pairs, e.g. a rotation by pi and a scale of -1).
 * - Not every 3x3 matrix can be written this way: PRSA cannot represent shear. Building one from a matrix
 *   ({@link NodeTransform2D.setWithMatrix}, {@link NodeTransform2D.FromMatrix}) is exact when the matrix has no
 *   shear, and otherwise best effort (with a one-time warning). {@link NodeTransform2D.TryFromMatrix} returns
 *   `undefined` instead of approximating.
 */
@ASerializable("NodeTransform2D")
export class NodeTransform2D implements NodeTransform<Vec2, Mat3> {
  /** Where the anchor point ends up in the parent's coordinates. */
  public position!: Vec2;
  /** The point, in the object's own coordinates, that rotation and scale happen about. */
  public anchor!: Vec2;
  /** Storage for `scale`. */
  public _scale!: Vec2;
  /** Rotation angle in radians. */
  public rotation!: number;

  /**
   * Returns a new identity transform.
   */
  static Identity(){
    return new this();
  }

  /** The x and y scale factors. */
  get scale(): Vec2 {
    return this._scale;
  }

  /**
   * Set to a number for uniform scaling (`myTransform.scale = 2` sets both factors to 2), or to a `Vec2` for
   * non-uniform scaling. A `Vec2` is stored as is, not copied.
   */
  set scale(value: Vec2 | number) {
    if (value instanceof Vec2) {
      this._scale = value;
    } else {
      this._scale = new Vec2(value, value);
    }
  }

  /**
   * Creates a transform from its parameters (the preferred way).
   * @param position Default `(0, 0)`.
   * @param rotation Angle in radians. Default 0.
   * @param scale Default `(1, 1)`.
   * @param anchor Default `(0, 0)`.
   */
  constructor(position?: Vec2, rotation?: number, scale?: Vec2, anchor?: Vec2);
  /**
   * Creates a transform from a matrix, best effort (see {@link NodeTransform2D.setWithMatrix}): exact if the matrix
   * has no shear, otherwise approximate with a one-time warning.
   * @param matrix The matrix to decompose.
   * @param position Optional position to keep (the anchor is solved for).
   */
  constructor(matrix: Mat3, position?: Vec2);
  constructor(...args: any[]) {
    if (args[0] instanceof Mat3) {
      let pos = args.length > 1 ? args[1] : undefined;
      this.setWithMatrix(args[0], pos);
      if (!this.position) {
        this.position = new Vec2(0, 0);
      }
    } else {
      this.position = (args.length > 0) ? args[0]?? V2(0, 0): new Vec2(0, 0);
      this.rotation = (args.length > 1) ? args[1]?? 0 : 0;
      this.scale = (args.length > 2) ? args[2]?? V2(1, 1): new Vec2(1, 1);
      this.anchor = (args.length > 3) ? args[3]?? V2(0, 0): new Vec2(0, 0);
    }
  }

  /**
   * Returns a `NodeTransform2D` for any transform: a new identity if `t` is undefined, a copy if it is already a
   * `NodeTransform2D`, and otherwise `FromMatrix(t)` (treating `t` as a `Mat3`).
   */
  static FromTransformationInterface(t?:TransformationInterface){
    if(t===undefined){
      return new NodeTransform2D();
    }
    if(t instanceof NodeTransform2D){
      return t.clone()
    }else{
      return NodeTransform2D.FromMatrix(t as Mat3);
    }
  }

  /** Returns the position as a `Vec3` with z = 0. */
  getPosition(): Vec3 {
    return Vec3.FromVec2(this.position);
  }
  /** Not implemented for 2D transforms; throws. */
  _getQuaternionRotation(): Quaternion {
    throw new Error("Method not implemented.");
    }
  /** Not implemented for 2D transforms; throws. */
  _setQuaternionRotation(q: Quaternion): void {
    throw new Error("Method not implemented.");
  }
  /** Sets the position to the x and y of `position` (z is ignored). */
  setPosition(position: Vec3): void {
    this.position = position.xy;
  }

  /** Returns a copy of this transform (its vectors are copied too). */
  clone() {
    return new NodeTransform2D(
      this.position.clone(),
      this.rotation,
      this.scale.clone(),
      this.anchor.clone()
    );
  }

  /**
   * Returns the 3x3 homogeneous matrix `P*R*S*A` for this transform.
   */
  getMatrix() {
    const position = Mat3.Translation2D(this.position);
    const rotation = Mat3.Rotation(this.rotation);
    const scale = Mat3.Scale2D(this.scale);
    const anchor = Mat3.Translation2D(this.anchor.times(-1));
    return position.times(rotation).times(scale).times(anchor);
  }

  /** Returns this transform as a 4x4 matrix acting on the z = 0 plane (see {@link Mat4.From2DMat3}). */
  getMat4(): Mat4 {
    return this.getMatrix().Mat4From2DH();
  }

  /**
   * Builds a `NodeTransform2D` from a matrix, best effort: see `setWithMatrix`. If the matrix has shear (or is not
   * affine), the result does not reproduce it, and a warning is logged once per session. Use `TryFromMatrix` to
   * find out instead.
   * @param m The matrix to decompose.
   * @param position Optional position to keep (the anchor is solved for). By default the anchor is zero and the
   * position is `m`'s translation.
   * @param useOldRotation Passed to `setWithMatrix`. A new transform's rotation is 0, so `true` keeps rotation 0.
   * Usually left out.
   */
  static FromMatrix(m:Mat3, position?:Vec2, useOldRotation?:boolean){
    let newNT = new NodeTransform2D();
    newNT.setWithMatrix(m, position, useOldRotation);
    return newNT;
  }

  /**
   * Builds a `NodeTransform2D` whose matrix equals `m` (within `DecompositionTolerance(m)`), or returns `undefined`
   * if there is none: `m` has shear, or its last row is not `[0, 0, 1]`.
   *
   * The linear part of `m` (rotation and scale) is always read from `m`. The translation is split between position
   * and anchor by at most one of the options:
   * - `anchor`: keep this anchor, and solve for the position (`m` applied to the anchor point). This is what
   *   `ANodeModel2D.setTransform` uses, so that the node keeps rotating and scaling about the same pivot.
   * - `position`: keep this position, and solve for the anchor.
   * - neither: the anchor is zero, and the position is `m`'s translation.
   * @param m The matrix to decompose.
   * @param options At most one of `position` and `anchor`.
   * @returns The exact decomposition, or `undefined`.
   */
  static TryFromMatrix(m:Mat3, options?:{position?:Vec2, anchor?:Vec2}):NodeTransform2D|undefined{
    let newNT = new NodeTransform2D();
    return newNT._setWithMatrix(m, options?.position, options?.anchor, false) ? newNT : undefined;
  }

  /**
   * The tolerance used to decide whether a decomposition reproduces a matrix: `1e-5` times the largest entry of
   * `m` (or `1e-5` if every entry is smaller than 1).
   * @param m The matrix being decomposed.
   */
  static DecompositionTolerance(m:Mat3):number{
    let maxAbs = 1;
    for(const e of m.elements){
      maxAbs = Math.max(maxAbs, Math.abs(e));
    }
    return 1e-5*maxAbs;
  }

  /** Whether the once-per-session warning about an inexact `setWithMatrix` has been logged. */
  static _warnedInexactSetWithMatrix:boolean=false;

  /**
   * Sets the transform properties based on the given affine transformation matrix and optional position, so that
   * `getMatrix()` reproduces `m` (`m = P*R*S*A`, as in `getMatrix()`).
   *
   * The rotation and scale come from `m`'s linear part. The two translations (P and A) are redundant, so the
   * position is a constraint: if you give one, it is kept and the anchor is solved for, and changes to rotation or
   * scale then rotate and scale about that position. If you don't, the anchor is zero and the position is `m`'s
   * translation. (`TryFromMatrix` can keep an anchor instead.)
   *
   * A `NodeTransform2D` can't represent shear. If `m` has shear, or its last row is not `[0, 0, 1]`, this sets the
   * closest transform it can (rotation from `m`'s first column, scale from the diagonal after un-rotating) and logs
   * a warning once per session. `TryFromMatrix` returns `undefined` in that case instead. Scale factors are kept at
   * least epsilon in magnitude (`Precision.ClampAbsAboveEpsilon`), so a zero scale becomes a tiny one.
   *
   * @param m the affine transformation matrix
   * @param position the position to keep (optional)
   * @param useOldRotation if true, keep the current rotation and read the scale relative to it (a matrix whose
   * rotation differs from it is then reported as inexact)
   */
  setWithMatrix(m: Mat3, position?: Vec2, useOldRotation?: boolean) {
    const exact = this._setWithMatrix(m, position, undefined, !!useOldRotation);
    if(!exact && !NodeTransform2D._warnedInexactSetWithMatrix && process.env.NODE_ENV !== "production"){
      NodeTransform2D._warnedInexactSetWithMatrix = true;
      console.warn(
          `NodeTransform2D.setWithMatrix: the matrix has shear (or is not affine), so no position/rotation/scale/anchor ` +
          `reproduces it; using the closest one. (Logged once.) Matrix:\n${m.asPrettyString()}`
      );
    }
  }

  /**
   * The decomposition behind `setWithMatrix` and `TryFromMatrix`. Sets every field and reports whether the result
   * reproduces `m`.
   * @param m The matrix to decompose.
   * @param position Position to keep (solve for the anchor). Can't be combined with `anchor`.
   * @param anchor Anchor to keep (solve for the position). Can't be combined with `position`.
   * @param useOldRotation Keep the current rotation instead of reading it from `m`.
   * @returns true if `getMatrix()` now equals `m` within `DecompositionTolerance(m)`.
   */
  _setWithMatrix(m:Mat3, position:Vec2|undefined, anchor:Vec2|undefined, useOldRotation:boolean):boolean{
    if(position !== undefined && anchor !== undefined){
      throw new Error("NodeTransform2D: give a position or an anchor to keep, not both (together they over-constrain the translation).");
    }
    // Linear part L = [[a, c], [b, d]] (columns (a, b) and (c, d)).
    const a = m.m00, b = m.m10, c = m.m01, d = m.m11;
    if(!useOldRotation || this.rotation === undefined){
      if(Math.hypot(a, b) > Precision.epsilon){
        this.rotation = Math.atan2(b, a);
      }else if(Math.hypot(c, d) > Precision.epsilon){
        // The first column is (nearly) zero: read the rotation from the second column, R(theta)*(0, 1).
        this.rotation = Math.atan2(-c, d);
      }else{
        this.rotation = 0;
      }
    }
    // Un-rotate: R(-theta)*L should be diag(sx, sy).
    const cs = Math.cos(this.rotation), sn = Math.sin(this.rotation);
    this.scale = new Vec2(
        Precision.ClampAbsAboveEpsilon(cs*a + sn*b),
        Precision.ClampAbsAboveEpsilon(-sn*c + cs*d)
    );

    const translation = new Vec2(m.m02, m.m12);
    if(anchor !== undefined){
      // m*(anchor) = P*R*S*(anchor - anchor) = position.
      this.anchor = anchor.clone();
      this.position = (m.times(Vec3.From2DHPoint(anchor)) as Vec3).Point2D;
    }else if(position !== undefined){
      // At the origin: translation = position - R*S*anchor, so anchor = (R*S)^-1 * (position - translation).
      this.position = position.clone();
      const rel = position.minus(translation);
      const unrotated = new Vec2(cs*rel.x + sn*rel.y, -sn*rel.x + cs*rel.y);
      this.anchor = new Vec2(unrotated.x/this.scale.x, unrotated.y/this.scale.y);
    }else{
      this.position = translation;
      this.anchor = new Vec2(0, 0);
    }
    return this.getMatrix().isEqualTo(m, NodeTransform2D.DecompositionTolerance(m));
  }

  /**
   * Returns the matching {@link NodeTransform3D}: the same transform in the z = 0 plane, with the rotation about the
   * z axis and a z scale of 1.
   */
  NodeTransform3D() {
    let rval = new NodeTransform3D(
      new Vec3(this.position.x, this.position.y, 0),
      Quaternion.FromAxisAngle(new Vec3(0, 0, 1), this.rotation),
      new Vec3(this.scale.x, this.scale.y, 1),
      new Vec3(this.anchor.x, this.anchor.y, 0)
    );
    return rval;
  }

  /** Returns this transform itself (not a copy). */
  NodeTransform2D() {
    return this;
  }

  /** Copies this transform's 4x4 matrix (see `getMat4`) into a three.js matrix. */
  assignTo(threejsMat: THREE.Matrix4) {
    this.getMat4().assignTo(threejsMat);
  }
}
