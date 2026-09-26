import { VectorBase } from "./VectorBase";
import { Precision } from "../Precision";
import {assert} from "../../basictypes";
import { TransformationInterface} from "../TransformationInterface";

/**
 * Base class for the square matrices {@link Mat3} and {@link Mat4}. Elements are stored in **row-major** order
 * (`elements[nColumns*row + col]`), unlike three.js, which stores matrices column-major.
 */
export abstract class Matrix{
  /** The matrix entries in row-major order. */
  public elements: number[] = [];

  /** Returns the element at `[row, col]`. */
  abstract getElement(row: number, col: number): number;
  /** Sets this matrix to the identity, in place. */
  abstract setToIdentity(): void;

  /** Returns a readable multi-line string of the matrix, for debugging. */
  abstract asPrettyString(): string;

  /** Returns this matrix itself (so matrices can be used where a transform is expected). */
  getMatrix() {
    return this;
  }

  protected abstract _timesVector(v: VectorBase): VectorBase;
  protected abstract _timesMatrix(m: Matrix): Matrix;

  /**
   * Creates the identity matrix when called with no arguments; otherwise copies the given row-major elements
   * (as one array or as separate numbers).
   */
  public constructor(elements?: Array<number>);
  public constructor(...args: Array<any>) {
    // common logic constructor
    if (args.length === 0) {
      this.setToIdentity();
      return;
    } else {
      if (Array.isArray(args[0])) {
        this.elements = args[0].slice();
      } else {
        this.elements = args.slice();
      }
    }
  }

  /**
   * Returns a copy of this matrix.
   */
  clone(): this {
    let cfunc: any = this.constructor as any;
    var copy: this = new cfunc(this.elements);
    return copy;
  }

  /**
   * Returns true if every element is within `tolerance` of the matching element of `other`.
   * @param other The matrix to compare to.
   * @param tolerance Allowed difference per element (default `Precision.epsilon`).
   */
  isEqualTo(other: this, tolerance?: number) {
    let epsilon: number =
      tolerance === undefined ? Precision.epsilon : tolerance;
    var n: number = this.elements.length;
    while (n--) {
      if (Math.abs(this.elements[n] - other.elements[n]) > epsilon) {
        return false;
      }
    }
    return true;
  }

  //##################//--Static methods--\\##################
  //<editor-fold desc="Static methods">

  /**
   * Returns the product of a series of matrices, multiplied left to right. Pass the matrices as separate arguments or
   * as a single list: `Matrix.Product(a, b, c)` or `Matrix.Product([a, b, c])` both return `a*b*c`.
   */
  static Product<T extends Matrix>(...args: Array<any>) {
    assert(args.length > 0, "did not provide arguments to Matrix Multiply");
    let mats: Array<T> = args;
    if (Array.isArray(args[0])) {
      mats = args[0];
      assert(
        args.length === 1,
        "first argument to Multiply is an array, so there should be no second argument"
      );
    }
    let M: Matrix = mats[0];
    for (let i = 1; i < mats.length; i++) {
      M = M.times(mats[i]) as Matrix;
    }
    return M;
  }

  //##################//--Arithmetic--\\##################
  //<editor-fold desc="Arithmetic">

  /** Returns this matrix times another matrix, a vector, or a scalar. See the subclasses for supported types. */
  abstract times(other: VectorBase | number | Matrix): VectorBase | Matrix;

  // times(other:Vector):Vector;
  // times(other:Vector|this|number):Vector|Matrix{
  //     if(other instanceof Matrix){
  //         return this._timesMatrix(other);
  //     }else if(other instanceof Vector){
  //         return this._timesVector(other);
  //     }else if(typeof(other) === 'number'){
  //         let cfunc:any=(this.constructor as any);
  //         var m:this = new cfunc();
  //         for(let i=0;i<m.elements.length;i++){
  //             m.elements[i]=this.elements[i]*other;
  //         }
  //         return m;
  //     }
  //     throw new Error("Tried to do Matrix.times(other) with other not a matrix, vector, or scalar...")
  // }

  /** Returns the element-wise sum of this matrix and `other`. */
  plus(other: Matrix): this {
    let cfunc: any = this.constructor as any;
    var m: this = new cfunc();
    for (let i = 0; i < m.elements.length; i++) {
      m.elements[i] = this.elements[i] + other.elements[i];
    }
    return m;
  }

  /** Returns the element-wise difference of this matrix and `other`. */
  minus(other: Matrix): this {
    let cfunc: any = this.constructor as any;
    var m: this = new cfunc();
    for (let i = 0; i < m.elements.length; i++) {
      m.elements[i] = this.elements[i] - other.elements[i];
    }
    return m;
  }
  //</editor-fold>
  //##################\\--Arithmetic--//##################

  /**
   * Returns a new list with this matrix applied (via `times`) to each vector in `pointList`.
   */
  applyToPoints(pointList: Array<VectorBase>) {
    const self: this = this;
    return pointList.map((v) => {
      return self.times(v);
    });
  }

  /** Copies this matrix into a three.js `Matrix4`. */
  abstract assignTo(threejsMat: THREE.Matrix4): void;


}
