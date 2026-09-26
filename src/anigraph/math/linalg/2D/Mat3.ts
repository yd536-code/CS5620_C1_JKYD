import { Matrix } from "../Matrix";
import {Vector, VectorBase} from "../VectorBase";
import { Vec3 } from "./Vec3";
import { Vec2 } from "./Vec2";
import {Mat4, Quaternion} from "../3D";
import {assert} from "../../../basictypes";
import { Random } from "../../Random";
import { ASerializable } from "../../../base/aserial";
import {TransformationInterface} from "../../TrasnformationInterface";
import * as THREE from "three";

/**
 * A 3x3 matrix, stored row-major. Used both as a homogeneous 2D transform (acting on `Vec3(x, y, 1)` points, with the
 * translation in the third column) and as a 3D linear map (e.g., a rotation). Methods named `...2D` build 2D
 * homogeneous transforms.
 */
@ASerializable("Mat3")
export class Mat3 extends Matrix implements TransformationInterface{
  /** Creates the identity (no arguments), or a matrix from 9 numbers or an array, given row by row. */
  public constructor();
  public constructor(
    m00: number,
    m01: number,
    m02: number,
    m10: number,
    m11: number,
    m12: number,
    m20: number,
    m21: number,
    m22: number
  );
  public constructor(elements?: Array<number>);
  public constructor(...args: Array<any>) {
    // common logic constructor
    super(...args);
  }

  /***
   * Returns the element of the matrix in the position [row, col]
   */
  getElement(row: number, col: number): number {
    return this.elements[3 * row + col];
  }

  /***
   * Sets this matrix to be the identity matrix.
   */
  setToIdentity() {
    this.elements = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  }

  /**
   * `mRC` gets or sets the element at row `R`, column `C` (e.g., `m02` is row 0, column 2).
   */
  set m00(value) {
    this.elements[0] = value;
  }
  get m00() {
    return this.elements[0];
  }
  set m01(value) {
    this.elements[1] = value;
  }
  get m01() {
    return this.elements[1];
  }
  set m02(value) {
    this.elements[2] = value;
  }
  get m02() {
    return this.elements[2];
  }
  set m10(value) {
    this.elements[3] = value;
  }
  get m10() {
    return this.elements[3];
  }
  set m11(value) {
    this.elements[4] = value;
  }
  get m11() {
    return this.elements[4];
  }
  set m12(value) {
    this.elements[5] = value;
  }
  get m12() {
    return this.elements[5];
  }
  set m20(value) {
    this.elements[6] = value;
  }
  get m20() {
    return this.elements[6];
  }
  set m21(value) {
    this.elements[7] = value;
  }
  get m21() {
    return this.elements[7];
  }
  set m22(value) {
    this.elements[8] = value;
  }
  get m22() {
    return this.elements[8];
  }

  /**
   * `c0`, `c1`, `c2` get (as a new `Vec3`) or set the columns of the matrix.
   */
  set c0(value: Vec3) {
    this.m00 = value.x;
    this.m10 = value.y;
    this.m20 = value.z;
  }
  get c0() {
    return new Vec3(this.m00, this.m10, this.m20);
  }
  set c1(value: Vec3) {
    this.m01 = value.x;
    this.m11 = value.y;
    this.m21 = value.z;
  }
  get c1() {
    return new Vec3(this.m01, this.m11, this.m21);
  }
  set c2(value: Vec3) {
    this.m02 = value.x;
    this.m12 = value.y;
    this.m22 = value.z;
  }
  get c2() {
    return new Vec3(this.m02, this.m12, this.m22);
  }

  /**
   * `r0`, `r1`, `r2` get (as a new `Vec3`) or set the rows of the matrix.
   */
  set r0(value: Vec3) {
    this.m00 = value.x;
    this.m01 = value.y;
    this.m02 = value.z;
  }
  get r0() {
    return new Vec3(this.m00, this.m01, this.m02);
  }
  set r1(value) {
    this.m10 = value.x;
    this.m11 = value.y;
    this.m12 = value.z;
  }
  get r1() {
    return new Vec3(this.m10, this.m11, this.m12);
  }

  set r2(value) {
    this.m20 = value.x;
    this.m21 = value.y;
    this.m22 = value.z;
  }
  get r2() {
    return new Vec3(this.m20, this.m21, this.m22);
  }

  /**
   * Returns a new matrix with the columns `c0`, `c1`, `c2`.
   */
  static FromColumns(c0: Vec3, c1: Vec3, c2: Vec3) {
    var r = new this();
    r.c0 = c0;
    r.c1 = c1;
    r.c2 = c2;
    return r;
  }
  /**
   * Returns a new matrix with the rows `r0`, `r1`, `r2`.
   */
  static FromRows(r0: Vec3, r1: Vec3, r2: Vec3) {
    var r = new this();
    r.r0 = r0;
    r.r1 = r1;
    r.r2 = r2;
    return r;
  }

  //##################//--TransformationMatrices--\\##################
  //<editor-fold desc="TransformationMatrices">

  /** Returns a new identity matrix. */
  static Identity() {
    return new Mat3(1, 0, 0, 0, 1, 0, 0, 0, 1);
  }

  //##################//--fill matrices--\\##################
  //<editor-fold desc="fill matrices">

  /** Returns a matrix whose elements are random floats in `[0, 1]`. */
  static Random() {
    var r = new this(Random.floatArray(9));
    return r;
  }

  /** Returns a matrix of all zeros. */
  static Zeros() {
    let z = new Array(9);
    for (let i = 0; i < 9; ++i) z[i] = 0;
    var r = new this(z);
    return r;
  }

  /** Returns a matrix of all ones. */
  static Ones() {
    let z = new Array(9);
    for (let i = 0; i < 9; ++i) z[i] = 1;
    var r = new this(z);
    return r;
  }
  //</editor-fold>
  //##################\\--fill matrices--//##################

  /** Returns the transpose as a new matrix. */
  getTranspose() {
    let transpose = new Mat3();
    transpose.c0 = this.r0;
    transpose.c1 = this.r1;
    transpose.c2 = this.r2;
    return transpose;
  }

  //##################//--Determinant and Inverse--\\##################
  //<editor-fold desc="Determinant and Inverse">

  /**
   * Returns the inverse as a new matrix (same method as Two.js). Throws if the determinant is exactly 0.
   */
  getInverse():Mat3{
    var a = this.elements;
    var out = new Mat3();

    var a00 = a[0],
      a01 = a[1],
      a02 = a[2];
    var a10 = a[3],
      a11 = a[4],
      a12 = a[5];
    var a20 = a[6],
      a21 = a[7],
      a22 = a[8];

    var b01 = a22 * a11 - a12 * a21;
    var b11 = -a22 * a10 + a12 * a20;
    var b21 = a21 * a10 - a11 * a20;

    // Calculate the determinant
    var det = a00 * b01 + a01 * b11 + a02 * b21;

    if (!det) {
      // console.warn("Matrix had determinant 0!");
      throw new Error("Matrix had determinant 0! Inverse undefined!");
      // return null;
    }

    det = 1.0 / det;

    out.elements[0] = b01 * det;
    out.elements[1] = (-a22 * a01 + a02 * a21) * det;
    out.elements[2] = (a12 * a01 - a02 * a11) * det;
    out.elements[3] = b11 * det;
    out.elements[4] = (a22 * a00 - a02 * a20) * det;
    out.elements[5] = (-a12 * a00 + a02 * a10) * det;
    out.elements[6] = b21 * det;
    out.elements[7] = (-a21 * a00 + a01 * a20) * det;
    out.elements[8] = (a11 * a00 - a01 * a10) * det;
    return out;
  }

  /**
   * Returns the determinant for this matrix.
   *
   * @returns the determinant
   */
  determinant() {
    var b01 = this.m22 * this.m11 - this.m12 * this.m21;
    var b11 = -this.m22 * this.m10 + this.m12 * this.m20;
    var b21 = this.m21 * this.m10 - this.m11 * this.m20;
    return this.m00 * b01 + this.m01 * b11 + this.m02 * b21;
  }

  //</editor-fold>
  //##################\\--Determinant and Inverse--//##################

  /**
   * Multiplies this matrix by a `Mat3` (matrix product), a number (scales every element), a `Vec3` (ordinary
   * matrix-vector product), or a `Vec2` (treated as the point `(x, y, 1)`; the result is homogenized and returned as
   * a `Vec2`). Returns a new object.
   */
  times(other: Mat3): Mat3;
  times(other: number): Mat3;
  times(other: Vec3): Vec3;
  times(other: Vec2): Vec2;
  times(other: VectorBase | Mat3 | number): VectorBase | Mat3 {
    if (other instanceof Mat3) {
      return this._timesMatrix(other);
    } else if (other instanceof Vec2 || other instanceof Vec3) {
      return this._timesVector(other);
    } else if (typeof other === "number") {
      let cfunc: any = this.constructor as any;
      var m: this = new cfunc();
      for (let i = 0; i < m.elements.length; i++) {
        m.elements[i] = this.elements[i] * other;
      }
      return m;
    }
    throw new Error(
      "Tried to do Matrix.times(other) with other not a matrix, vector, or scalar..."
    );
  }

  /**
   * A `Vec3` gets a regular matrix-vector product. A `Vec2` is treated as a point: it gets a homogeneous coordinate
   * of 1, is multiplied, then homogenized, and the result is returned as a `Vec2`.
   */
  protected _timesVector(v: Vec3 | Vec2): Vec3 | Vec2 {
    if (v instanceof Vec3) {
      return new Vec3(
        v.elements[0] * this.elements[0] +
          v.elements[1] * this.elements[1] +
          v.elements[2] * this.elements[2],
        v.elements[0] * this.elements[3] +
          v.elements[1] * this.elements[4] +
          v.elements[2] * this.elements[5],
        v.elements[0] * this.elements[6] +
          v.elements[1] * this.elements[7] +
          v.elements[2] * this.elements[8]
      );
    } else {
      let v3out = new Vec3(
        v.elements[0] * this.elements[0] +
          v.elements[1] * this.elements[1] +
          this.elements[2],
        v.elements[0] * this.elements[3] +
          v.elements[1] * this.elements[4] +
          this.elements[5],
        v.elements[0] * this.elements[6] +
          v.elements[1] * this.elements[7] +
          this.elements[8]
      );
      return v3out.Point2D;
    }
  }
  protected _timesMatrix(m: Mat3): Mat3 {
    let cfunc: any = this.constructor as any;
    return new cfunc([
      this.elements[0] * m.elements[0] +
        this.elements[1] * m.elements[3] +
        this.elements[2] * m.elements[6],
      this.elements[0] * m.elements[1] +
        this.elements[1] * m.elements[4] +
        this.elements[2] * m.elements[7],
      this.elements[0] * m.elements[2] +
        this.elements[1] * m.elements[5] +
        this.elements[2] * m.elements[8],
      this.elements[3] * m.elements[0] +
        this.elements[4] * m.elements[3] +
        this.elements[5] * m.elements[6],
      this.elements[3] * m.elements[1] +
        this.elements[4] * m.elements[4] +
        this.elements[5] * m.elements[7],
      this.elements[3] * m.elements[2] +
        this.elements[4] * m.elements[5] +
        this.elements[5] * m.elements[8],
      this.elements[6] * m.elements[0] +
        this.elements[7] * m.elements[3] +
        this.elements[8] * m.elements[6],
      this.elements[6] * m.elements[1] +
        this.elements[7] * m.elements[4] +
        this.elements[8] * m.elements[7],
      this.elements[6] * m.elements[2] +
        this.elements[7] * m.elements[5] +
        this.elements[8] * m.elements[8],
    ]);
  }
  /** Returns a plain object with this matrix's fields, for `JSON.stringify`. */
  toJSON() {
    var rval: { [name: string]: any } = {};
    for (let k in this) {
      // @ts-ignore
      rval[k] = this[k];
    }
    return rval;
  }

  /** Returns a readable multi-line string of the rows, with `precision` significant digits. */
  asPrettyString(precision: number = 4): string {
    return `Mat3 in Row Major Form:\n
        ${this.elements[0].toPrecision(
          precision
        )}, ${this.elements[1].toPrecision(
      precision
    )}, ${this.elements[2].toPrecision(precision)}\n
        ${this.elements[3].toPrecision(
          precision
        )}, ${this.elements[4].toPrecision(
      precision
    )}, ${this.elements[5].toPrecision(precision)}\n
        ${this.elements[6].toPrecision(
          precision
        )}, ${this.elements[7].toPrecision(
      precision
    )}, ${this.elements[8].toPrecision(precision)}\n
        `;
  }

  /**
   * Treats this as a homogeneous 2D transform and returns the matching 4x4 transform of the z = 0 plane
   * (see {@link Mat4.From2DMat3}).
   */
  Mat4From2DH() {
    return Mat4.From2DMat3(this);
  }

  /**
   * Copies this matrix into a `THREE.Matrix3`. Given a `THREE.Matrix4`, it logs an error (it's ambiguous whether this
   * is a 2D homogeneous or a 3D linear matrix) and copies `Mat4Linear()`.
   */
  assignTo(threejsMat: THREE.Matrix3|THREE.Matrix4){
    if(threejsMat instanceof THREE.Matrix3){
      threejsMat.set(
          this.m00, this.m01, this.m02,
          this.m10, this.m11, this.m12,
          this.m20, this.m21, this.m22
      );
    }else {
      console.error("Should not be using Mat3.assignTo! Ambiguous whether linear or homogeneous!")
      this.Mat4Linear().assignTo(threejsMat);
    }
  }

  /** Treats this as a 3D linear map and returns it as a 4x4 matrix with no translation (see {@link Mat4.FromMat3Linear}). */
  Mat4Linear() {
    return Mat4.FromMat3Linear(this);
  }

  /** Prints the rows as a table in the console. */
  logTable(){
    console.table({
      'row0': this.r0,
      'row1': this.r1,
      'row2': this.r2
    })
  }


  /**
   * Returns a 3x3 diagonal scale matrix for 3D (linear, no translation).
   *
   * If `factor` is a number, it is used for x, y, and z. If it is an array or a `Vec3`, its elements are the x, y,
   * and z factors (missing ones default to 1).
   *
   * @param factor the scaling factor(s)
   */
  public static Scale3D(factor:number):Mat3;
  public static Scale3D(factors:Array<number>):Mat3;
  public static Scale3D(factors:Vec3):Mat3;
  public static Scale3D(...args:any[]):Mat3 {
    function scalematfromarray(a:Array<number>) {
      let rmat = new Mat3();
      if (a.length > 0) {
        rmat.elements[0] = a[0];
        if (a.length > 1) {
          rmat.elements[4] = a[1];
          if (a.length > 2) {
            assert(a.length === 3, "Scale arguments too long");
            rmat.elements[8] = a[2];
          }
        }
      }
      return rmat;
    }

    assert(args.length>0, "Cannot call Mat3.Scale() with no arguments");
    if(typeof args[0] === "number") {
      let rmat = new Mat3();
      rmat.m00=args[0];
      rmat.m11=args[0];
      rmat.m22=args[0];
      return rmat;
    } else if(Array.isArray(args[0])) {
      return scalematfromarray(args[0]);
    }else if(args[0] instanceof Vec3){
      return scalematfromarray(args[0].elements);
    }else {
      return scalematfromarray(args);
    }
  }

  /**
   * Returns a homogeneous 2D scale matrix.
   *
   * If `factor` is a number, it is used for both x and y. If it is an array of length two or a `Vec2`, its elements
   * are the x and y factors.
   *
   * @param factor the scaling factor(s)
   */
  public static Scale2D(factors:Array<number>):Mat3;
  public static Scale2D(factor:number|Vector):Mat3;
  public static Scale2D(factors:Vec2):Mat3;
  public static Scale2D(...args:Array<any>):Mat3 {
    function scalematfromarray(a:Array<number>) {
      let rmat = new Mat3();
      if (a.length > 0) {
        rmat.elements[0] = a[0];
        if (a.length > 1) {
          assert(a.length === 2, "Scale2D arguments too long");
          rmat.elements[4] = a[1];
        }
      }
      return rmat;
    }
    assert(args.length>0, "Cannot call Mat3.Scale2D() with no arguments");
    if(typeof args[0] === "number") {
      let rmat = new Mat3();
      rmat.m00=args[0];
      rmat.m11=args[0];
      return rmat;
    } else if(Array.isArray(args[0])) {
      return scalematfromarray(args[0]);
    }else if(args[0] instanceof Vec2){
      return scalematfromarray(args[0].elements);
    }else {
      return scalematfromarray(args);
    }
  }

  /**
   * Returns a homogeneous 2D translation matrix. Takes `x, y`, an array `[x, y]`, or a `Vec2`.
   *
   * @param t the translation
   */
  public static Translation2D(t:Array<number>):Mat3;
  public static Translation2D(t:Vec2):Mat3;
  public static Translation2D(x:number,y:number):Mat3
  public static Translation2D(...args:Array<any>):Mat3{
    function tmatfromarray(a:Array<number>) {
      let rmat = new Mat3();
      rmat.m02=a[0];
      rmat.m12=a[1];
      return rmat;
    }
    assert(args.length>0, "Cannot call Mat3.Translation2D() with no arguments");
    if(Array.isArray(args[0])) {
      return tmatfromarray(args[0]);
    }else if(args[0] instanceof Vec2){
      return tmatfromarray(args[0].elements);
    }else {
      assert(args.length===2, "wrong number of args for Mat3.Translation2D")
      return tmatfromarray(args);
    }
  }

  /**
   * Returns a homogeneous 2D rotation matrix (counterclockwise by `radians`). Also a 3D rotation about the z axis.
   *
   * @param radians the rotation amount in radians
   */
  public static Rotation(radians:number):Mat3{
    var c:number = Math.cos(radians);
    var s:number = Math.sin(radians);
    return new Mat3(c, -s, 0, s, c, 0, 0, 0, 1)
  }

  /** Returns the rotation of this matrix, treated as a 3D linear map (see {@link Quaternion.FromMatrix}). */
  _getQuaternionRotation(): Quaternion {
    return Quaternion.FromMatrix(this);
  }

  /** Replaces this whole matrix with the 3x3 rotation matrix of `q`, in place. */
  _setQuaternionRotation(q: Quaternion): void {
    this.elements = q.Mat3().elements;
  }

  /** Always throws: use `Mat4From2DH()` or `Mat4Linear()` to say which conversion you mean. */
  getMat4(): Mat4 {
    throw new Error("Unspecified whether to convert Mat3 to Mat4 as 2D homogeneous or 3D Linear!")
  }

  /** Returns the 2D translation (the homogenized third column) as a `Vec3` with z = 0. */
  getPosition(): Vec3 {
    return Vec3.FromVec2(this.c2.Point2D);
  }

  /**
   * Sets the 2D translation (`m02`, `m12`) to `position.x` and `position.y`. The z component is ignored, the same
   * way `getPosition()` returns a `Vec3` whose z is 0.
   */
  setPosition(position: Vec3): void {
    this.m02 = position.x;
    this.m12 = position.y;
  }
  //</editor-fold>
  //##################\\--TransformationMatrices--//##################

}
