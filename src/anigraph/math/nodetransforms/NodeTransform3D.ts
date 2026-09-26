import * as THREE from "three";
import { ASerializable } from "../../base";
import { NodeTransform } from "./NodeTransform";
import {V3, Vec3, Mat4, V4, Quaternion, Vec4, Mat3} from "../linalg";
import { Precision } from "../Precision";
import { NodeTransform2D } from "./NodeTransform2D";

/**
 * A 3D transform stored as position, rotation, scale, and anchor (PRSA). Its matrix is `M = P*R*S*A`: translate by
 * `-anchor`, scale by `scale`, rotate by the quaternion `rotation`, then translate by `position`. The anchor is the
 * point, in the object's own coordinates, that the object rotates and scales about; `position` is where that point
 * ends up in the parent's coordinates. See {@link NodeTransform2D} for more on the convention.
 *
 * A PRSA transform cannot represent every 4x4 matrix (no shear, and the scale is along the object's own axes).
 * {@link NodeTransform3D.setWithMatrix}/{@link NodeTransform3D.FromMatrix} are best effort;
 * {@link NodeTransform3D.TryFromMatrix} returns `undefined` if the matrix can't be reproduced.
 */
@ASerializable("NodeTransform3D")
export class NodeTransform3D implements NodeTransform<Vec3, Mat4> {
  /** Where the anchor point ends up in the parent's coordinates. */
  public position!: Vec3;
  /** The point, in the object's own coordinates, that rotation and scale happen about. */
  public anchor!: Vec3;
  /** Storage for `scale`. */
  public _scale!: Vec3;
  /** The rotation, as a {@link Quaternion}. */
  public rotation!: Quaternion;

  /**
   * The x, y, and z scale factors. Set to a number for uniform scaling or to a `Vec3` (stored as is, not copied).
   */
  get scale(): Vec3 {
    return this._scale;
  }
  set scale(value: Vec3 | number) {
    if (value instanceof Vec3) {
      this._scale = value;
    } else {
      this._scale = new Vec3(value, value, value);
    }
  }

  /**
   * Creates a transform from its parameters. Defaults: position `(0, 0, 0)`, identity rotation, scale `(1, 1, 1)`,
   * anchor `(0, 0, 0)`. The arguments are stored as is, not copied.
   *
   * Can also be called as `new NodeTransform3D(matrix, position?, rotation?)`, which decomposes the matrix, best
   * effort (see {@link NodeTransform3D.setWithMatrix}).
   */
  constructor(
    position?: Vec3,
    rotation?: Quaternion,
    scale?: Vec3|number,
    anchor?: Vec3
  );
  constructor(matrix: Mat4, position?: Vec3, rotation?: Quaternion);
  constructor(...args: any[]) {
    if (args[0] instanceof Mat4) {
      let pos = args.length > 1 ? args[1] : undefined;
      let rotation = args.length > 2 ? args[2] : undefined;
      this.setWithMatrix(args[0], pos, rotation);
      if (!this.position) {
        this.position = new Vec3(0, 0, 0);
      }
    } else {
      this.position = args.length > 0 ? args[0]??new Vec3(0, 0, 0) : new Vec3(0, 0, 0);
      this.rotation = args.length > 1 ? args[1]??new Quaternion() : new Quaternion();
      this.scale = args.length > 2 ? args[2]??new Vec3(1, 1, 1) : new Vec3(1, 1, 1);
      this.anchor = args.length > 3 ? args[3]??new Vec3(0, 0, 0) : new Vec3(0, 0, 0);
    }
  }


  /** Returns the position (the live vector, not a copy). */
  getPosition(): Vec3 {
    return this.position;
  }
  /** Returns the rotation (the live quaternion, not a copy). */
  _getQuaternionRotation(): Quaternion {
    return this.rotation;
    }
  /** Sets the rotation to `q` (not copied). */
  _setQuaternionRotation(q: Quaternion): void {
    this.rotation = q;
  }
  /** Sets the position to `position` (not copied). */
  setPosition(position: Vec3): void {
    this.position = position;
  }

  /** Returns a copy of this transform (its vectors and quaternion are copied too). */
  clone() {
    return new NodeTransform3D(
      this.position.clone(),
      this.rotation.clone(),
      this.scale.clone(),
      this.anchor.clone()
    );
  }

  /** Returns a copy of this transform. (Unlike `NodeTransform2D.NodeTransform2D()`, which returns `this`.) */
  NodeTransform3D() {
    return this.clone();
  }

  /**
   * Creates a transform with the position and rotation of a pose matrix (a rotation plus a translation). Scale and
   * anchor are left at their defaults, so any scale in `mat` is dropped.
   */
  static FromPoseMatrix(mat: Mat4) {
    let translation = mat.c3;
    let rotationM = mat.clone();
    rotationM.c3 = V4(0, 0, 0, 1);
    let rotationQ = Quaternion.FromMatrix(rotationM);
    return new NodeTransform3D(translation.Point3D, rotationQ);
  }


  /** Returns the point `p` transformed by this transform's matrix. */
  appliedToPoint(p:Vec3){
    return this.getMat4().times(p.Point3DH).Point3D;
  }

  /** Returns this transform's matrix times a `Vec4` or a `Mat4`. */
  times(other:Vec4):Vec4;
  times(other:Mat4):Mat4;
  times(other:Vec4|Mat4|number):Vec4|Mat4{
    // @ts-ignore
    return this.getMat4().times(other);
  }


  /**
   * Returns the 4x4 matrix `P*R*S*A` for this transform.
   */
  getMatrix() {
    // return Mat4.Translation3D(this.position)
    //     .times(this.rotation.Mat4())
    //     .times(Mat4.Scale3D(this.scale))
    //     .times(Mat4.Translation3D(this.anchor.times(-1)));

    let P = Mat4.Translation3D(this.position);
    let R = this.rotation.Mat4();
    let S = Mat4.Scale3D(this.scale);
    let A = Mat4.Translation3D(this.anchor.times(-1));
    return P.times(R).times(S).times(A);
    // let m = new Matrix4();
    // m.compose(this.position.asThreeJS(),this.rotation, this.scale.asThreeJS());
    // let mobj = Mat4.FromThreeJS(m).getTranspose();
    // const anchor = Mat4.Translation3D(this.anchor.times(-1));
    // return mobj.times(anchor);
  }

  /** Copies this transform's matrix into a three.js matrix. */
  assignTo(threejsMat: THREE.Matrix4) {
    this.getMat4().assignTo(threejsMat);
  }

  /** Same as `getMatrix()`. */
  getMat4(): Mat4 {
    return this.getMatrix();
  }

  /**
   * Combines two poses (position and rotation only; scale and anchor are ignored and left at their defaults). The
   * new position is `lhs.position + lhs.rotation.appliedTo(rhs.position)` and the new rotation is
   * `lhs.rotation.times(rhs.rotation)`. With no scale or anchor, this is the pose of the matrix product
   * `lhs.getMatrix() * rhs.getMatrix()`.
   */
  static PoseProduct(lhs: NodeTransform3D, rhs: NodeTransform3D) {
    let nt = lhs.rotation.appliedTo(rhs.position).plus(lhs.position);
    let nr = lhs.rotation.times(rhs.rotation);
    return new NodeTransform3D(nt, nr);
  }

  /**
   * Returns the inverse transform, so that `t.getInverse().getMatrix().times(t.getMatrix())` is the identity. The
   * anchor and a non-uniform scale are both taken into account.
   *
   * The inverse is computed as `getMatrix().getInverse()`. If that matrix can be written exactly as a
   * `NodeTransform3D` (see {@link NodeTransform3D.TryFromMatrix}), the result is a `NodeTransform3D`; this is always
   * the case when the scale is uniform. Otherwise the result is the inverse `Mat4` itself. That happens with a
   * non-uniform scale and a rotation that isn't a multiple of 90° about the axes: the inverse's linear part is
   * `S⁻¹·Rᵀ`, which scales along rotated axes, and position/rotation/scale/anchor can't describe that.
   * Both kinds of result have `getMatrix()`, `getMat4()`, and the other {@link TransformationInterface} methods.
   */
  getInverse(): NodeTransform3D | Mat4 {
    const invMatrix = this.getMatrix().getInverse();
    return NodeTransform3D.TryFromMatrix(invMatrix) ?? invMatrix;
  }

  /**
   * Returns a new transform with the same position and rotation `this.rotation.times(r)`: `r` is applied first, in
   * the transform's local frame (the rotation part of `T * r`). Scale and anchor are dropped (reset to defaults).
   */
  getRightMultipliedByRotation(r: Quaternion) {
    return new NodeTransform3D(this.position.clone(), this.rotation.times(r));
  }

  /**
   * Returns a new transform with position `r.appliedTo(this.position)` and rotation `r.times(this.rotation)`: the
   * whole pose is rotated by `r` about the world origin (`r * T`). Scale and anchor are dropped (reset to defaults).
   */
  getLeftMultipliedByRotation(r: Quaternion) {
    return new NodeTransform3D(
      r.appliedTo(this.position),
      r.times(this.rotation)
    );
  }

  /**
   * Returns a rough 2D version of this transform: the position projected by `cameraMatrix` (default identity) and
   * dropped to x, y; the rotation as the angle of the projected local x axis; and the x, y of scale and anchor.
   * @param cameraMatrix Optional matrix applied to the position and x axis first.
   */
  NodeTransform2D(cameraMatrix?: Mat4) {
    let P = cameraMatrix ? cameraMatrix : Mat4.Identity();
    let thisxvec = P.times(this.rotation.Mat4().c0);
    let p3d = P.times(this.position.Point3DH).Point3D;
    // let thisM = this.getMat4();
    return new NodeTransform2D(
      p3d.XY,
      Math.atan2(thisxvec.y, thisxvec.x),
      this.scale.XY,
      this.anchor.XY
    );
  }

  /**
   * The tolerance used to decide whether a decomposition reproduces a matrix: `1e-5` times the largest entry of
   * `m` (or `1e-5` if every entry is smaller than 1).
   * @param m The matrix being decomposed.
   */
  static DecompositionTolerance(m:Mat4):number{
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
   * The rotation and scale come from `m`'s linear part (a negative determinant becomes a negative z scale). The two
   * translations (P and A) are redundant, so the position is a constraint: if you give one, it is kept and the
   * anchor is solved for. If you don't, the anchor is zero and the position is `m`'s translation.
   * `TryFromMatrix` can keep an anchor instead.
   *
   * A `NodeTransform3D` can only represent a linear part that is a rotation times an axis-aligned scale. If `m`'s
   * linear part has shear (its columns aren't orthogonal), or its last row is not `[0, 0, 0, 1]`, this sets the
   * closest transform it can and logs a warning once per session. `TryFromMatrix` returns `undefined` in that case
   * instead. Scale factors are kept at least epsilon in magnitude (`Precision.ClampAbsAboveEpsilon`).
   *
   * @param m the affine transformation matrix
   * @param position the position to keep (optional)
   * @param rotation the rotation to keep (optional); the scale is then read relative to it, and a matrix whose
   * rotation differs from it is reported as inexact
   */
  setWithMatrix(m: Mat4, position?: Vec3, rotation?: Quaternion) {
    const exact = this._setWithMatrix(m, position, undefined, rotation);
    if(!exact && !NodeTransform3D._warnedInexactSetWithMatrix && process.env.NODE_ENV !== "production"){
      NodeTransform3D._warnedInexactSetWithMatrix = true;
      console.warn(
          `NodeTransform3D.setWithMatrix: the matrix's linear part is not a rotation times a scale (or the matrix is ` +
          `not affine), so no position/rotation/scale/anchor reproduces it; using the closest one. (Logged once.)`
      );
    }
  }

  /**
   * The decomposition behind `setWithMatrix` and `TryFromMatrix`. Sets every field and reports whether the result
   * reproduces `m`.
   * @param m The matrix to decompose.
   * @param position Position to keep (solve for the anchor). Can't be combined with `anchor`.
   * @param anchor Anchor to keep (solve for the position). Can't be combined with `position`.
   * @param rotation Rotation to keep instead of reading it from `m`.
   * @returns true if `getMatrix()` now equals `m` within `DecompositionTolerance(m)`.
   */
  _setWithMatrix(m:Mat4, position:Vec3|undefined, anchor:Vec3|undefined, rotation:Quaternion|undefined):boolean{
    if(position !== undefined && anchor !== undefined){
      throw new Error("NodeTransform3D: give a position or an anchor to keep, not both (together they over-constrain the translation).");
    }
    const L = m.getLinearPart();
    if(rotation){
      this.rotation = rotation;
    }else{
      this.rotation = Quaternion.FromMatrix(NodeTransform3D._RotationFrameOf(L));
    }
    // Un-rotate: R^T*L should be diag(sx, sy, sz).
    const Rt = this.rotation.Mat4().getLinearPart().getTranspose();
    const SL = Rt.times(L) as Mat3;
    this.scale = new Vec3(
        Precision.ClampAbsAboveEpsilon(SL.m00),
        Precision.ClampAbsAboveEpsilon(SL.m11),
        Precision.ClampAbsAboveEpsilon(SL.m22)
    );

    const translation = m.c3.Point3D;
    if(anchor !== undefined){
      // m*(anchor) = P*R*S*(anchor - anchor) = position.
      this.anchor = anchor.clone();
      this.position = m.times(anchor.Point3DH).Point3D;
    }else if(position !== undefined){
      // At the origin: translation = position - R*S*anchor, so anchor = S^-1 * R^T * (position - translation).
      this.position = position.clone();
      const unrotated = Rt.times(position.minus(translation)) as Vec3;
      this.anchor = new Vec3(unrotated.x/this.scale.x, unrotated.y/this.scale.y, unrotated.z/this.scale.z);
    }else{
      this.position = translation;
      this.anchor = new Vec3(0, 0, 0);
    }
    return this.getMatrix().isEqualTo(m, NodeTransform3D.DecompositionTolerance(m));
  }

  /**
   * A right-handed orthonormal frame whose columns point along the columns of the linear part `L` (the third one
   * flipped if `L` has a negative determinant). Columns of (nearly) zero length are filled in so the frame stays a
   * rotation. If `L`'s columns aren't orthogonal, the result isn't orthonormal either; `Quaternion.FromMatrix`
   * then gives an approximate rotation, and the decomposition reports itself inexact.
   * @param L A 3x3 linear part.
   */
  static _RotationFrameOf(L:Mat3):Mat3{
    const cols = [L.c0, L.c1, L.c2];
    const dirs:(Vec3|undefined)[] = cols.map(c=>{
      const n = c.L2();
      return n > Precision.epsilon ? c.times(1/n) : undefined;
    });
    const missing = dirs.filter(d=>d===undefined).length;
    if(missing === 3){
      return Mat3.Identity();
    }
    if(missing === 2){
      const i = dirs.findIndex(d=>d!==undefined);
      const u = dirs[i] as Vec3;
      // Any unit vector perpendicular to u: cross it with the axis it is least aligned with.
      const axis = Math.abs(u.x) < 0.9 ? V3(1, 0, 0) : V3(0, 1, 0);
      const v = u.cross(axis).getNormalized();
      dirs[(i+1)%3] = v;
      dirs[(i+2)%3] = u.cross(v);
    }else if(missing === 1){
      const i = dirs.findIndex(d=>d===undefined);
      dirs[i] = (dirs[(i+1)%3] as Vec3).cross(dirs[(i+2)%3] as Vec3).getNormalized();
    }else if(L.determinant() < 0){
      dirs[2] = (dirs[2] as Vec3).times(-1);
    }
    return Mat3.FromColumns(dirs[0] as Vec3, dirs[1] as Vec3, dirs[2] as Vec3);
  }

  /**
   * Creates a transform at `position` whose local x axis points along `x` and whose local y axis is `y` made
   * perpendicular to `x` (z is `x cross y`). The axes are normalized when converted to a rotation. (Despite the
   * name, it takes x and y, not z and y.)
   */
  static FromPositionZY(position:Vec3, x:Vec3, y:Vec3){
    let z = x.cross(y);
    let yUse = z.cross(x);
    let q = Quaternion.FromMatrix(
        Mat3.FromColumns(x, yUse, z)
    );
    return new NodeTransform3D(position, q);
  }

    /**
     * Creates a camera-style pose at `location` looking at `target`: the local -z axis points toward `target` and the
     * local y axis is as close to `up` as possible.
     * @param location Where the transform is placed.
     * @param target The point to look at.
     * @param up The approximate up direction.
     */
  static LookAt(location: Vec3, target: Vec3, up: Vec3) {
    let position = location;
    let look = target.minus(location).getNormalized();
    return new NodeTransform3D(position, Quaternion.FromCameraOrientationVectors(look, up));

    // Leaving the code below for reference -- students can ignore

    // let look = target.minus(location);
    // let zneg = look.getNormalized().times(-1);
    // let r = zneg.cross(up).getNormalized();
    // let upn = zneg.cross(r)
    // let M = Mat4.FromColumns(
    //     r.Vec3DH,
    //     upn.Vec3DH,
    //     zneg.Vec3DH,
    //     location.Point3DH
    // )
    // could extract scale here
    // let position = location;
    // let R = Mat4.FromColumns(M.r0, M.r1,M.r2,V4(0,0,0,1));
    // let rotation = Quaternion.FromMatrix(R);
    // return new NodeTransform3D(position, rotation);
  }

  /**
   * Creates a transform at `position` whose local +z axis points along `z` and whose local y axis is as close to `up`
   * as possible, with the given scale.
   */
  static FromPositionZUpAndScale(position: Vec3, z: Vec3, up: Vec3, scale:Vec3|number) {
    return new NodeTransform3D(position, Quaternion.FromZAndUp(z, up), scale);
  }


  /**
   * Like {@link NodeTransform3D.LookAt}, but the local +z axis points toward `target` (so -z points away from it).
   */
  static PointToward(location: Vec3, target: Vec3, up: Vec3) {
    let position = location;
    let look = location.minus(target).getNormalized();
    return new NodeTransform3D(position, Quaternion.FromCameraOrientationVectors(look, up));
  }

  /** Returns a transform that rotates by `radians` about the z axis. */
  static RotationZ(radians: number) {
    return new NodeTransform3D(
      new Vec3(0, 0, 0),
      Quaternion.RotationZ(radians)
    );
  }
  /** Returns a transform that rotates by `radians` about the x axis. */
  static RotationX(radians: number) {
    return new NodeTransform3D(
        new Vec3(0, 0, 0),
        Quaternion.RotationX(radians)
    );
  }

  /** Returns a transform that rotates by `radians` about the y axis. */
  static RotationY(radians: number) {
    return new NodeTransform3D(
        new Vec3(0, 0, 0),
        Quaternion.RotationY(radians)
    );
  }

  /**
   * Builds a `NodeTransform3D` from a matrix, best effort: see `setWithMatrix`. If the matrix's linear part isn't a
   * rotation times a scale (or the matrix isn't affine), the result does not reproduce it, and a warning is logged
   * once per session. Use `TryFromMatrix` to find out instead.
   * @param mat The matrix to decompose.
   * @param position Optional position to keep (the anchor is solved for). By default the anchor is zero and the
   * position is `mat`'s translation.
   * @param rotation Optional rotation to keep.
   */
  static FromMatrix(mat: Mat4, position?: Vec3, rotation?: Quaternion) {
    let T = new NodeTransform3D();
    T.setWithMatrix(mat, position, rotation);
    return T;
  }

  /**
   * Builds a `NodeTransform3D` whose matrix equals `m` (within `DecompositionTolerance(m)`), or returns `undefined`
   * if there is none: `m`'s linear part isn't a rotation times an axis-aligned scale, or its last row is not
   * `[0, 0, 0, 1]`.
   *
   * The linear part of `m` is always read from `m`. The translation is split between position and anchor by at
   * most one of the options:
   * - `anchor`: keep this anchor, and solve for the position (`m` applied to the anchor point). This is what
   *   `ANodeModel3D.setTransform` uses, so that the node keeps rotating and scaling about the same pivot.
   * - `position`: keep this position, and solve for the anchor.
   * - neither: the anchor is zero, and the position is `m`'s translation.
   * @param m The matrix to decompose.
   * @param options At most one of `position` and `anchor`.
   * @returns The exact decomposition, or `undefined`.
   */
  static TryFromMatrix(m: Mat4, options?:{position?:Vec3, anchor?:Vec3}):NodeTransform3D|undefined{
    let T = new NodeTransform3D();
    return T._setWithMatrix(m, options?.position, options?.anchor, undefined) ? T : undefined;
  }

  /**
   * Creates a transform from a three.js object's `position`, `quaternion`, and `scale`. The quaternion's x, y, z, w
   * are copied as is into a {@link Quaternion} (both use the same convention), so the result means the same
   * pose as the three.js object.
   */
  static FromThreeJSObject(obj: THREE.Object3D) {
    return new NodeTransform3D(
      Vec3.FromThreeJS(obj.position),
      Quaternion.FromQuaternion(obj.quaternion),
      Vec3.FromThreeJS(obj.scale)
    );
  }

  /**
   * Copies this transform onto a three.js object: sets its `position`, `quaternion` (x, y, z, w copied as is), and
   * `scale`, and sets `obj.matrix` to `getMatrix()`. Only `obj.matrix` includes the anchor.
   */
  assignToObject3DPose(obj: THREE.Object3D) {
    obj.position.set(this.position.x, this.position.y, this.position.z);
    obj.quaternion.set(
      this.rotation.x,
      this.rotation.y,
      this.rotation.z,
      this.rotation.w
    );
    obj.scale.set(this.scale.x, this.scale.y, this.scale.z);
    this.getMatrix().assignTo(obj.matrix);
  }

  /** Returns where this transform sends the object-space origin (i.e., `getMatrix()` applied to `(0, 0, 0)`). */
  getObjectSpaceOrigin() {
    return this.getMatrix().times(V4(0, 0, 0, 1)).getHomogenized().Point3D;
  }
}
