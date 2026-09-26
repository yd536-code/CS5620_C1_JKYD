import { Precision } from "../Precision";
import {assert} from "../../basictypes";
import { Random } from "../Random";
import { ASerializable, GetClassLabel } from "../../base/aserial";

/** Anything with a list of numeric `elements` (vectors, colors). */
export interface VectorType {
  elements: number[];
}

/**
 * Any subclass of {@link VectorBase}.
 * @internal
 */
export interface ExtendsVector extends VectorBase {}

/**
 * Base class for AniGraph's vectors ({@link Vec2}, {@link Vec3}, {@link Vec4}) and {@link Color}. Stores its
 * components in `elements`. Methods named `get...`, `plus`, `minus`, and `times` return new vectors; `normalize`,
 * `addVector`, and `subtractVector` change this vector in place.
 */
@ASerializable("VectorBase")
export class VectorBase implements VectorType {
  /** Number of components for this class (-1 means any). */
  static N_DIMENSIONS: number = -1;
  /** The components of the vector. */
  public elements: number[] = [];
  /**
   * Can be called as `new Vec3()` (the class's default, usually zeros), `new Vec3(x, y, z)`, or `new Vec3([x, y, z])`.
   * The elements are copied.
   */
  public constructor(elements?: Array<number>);
  public constructor(...args: Array<any>) {
    // common logic constructor
    if (args.length === 0) {
      this._setToDefault();
      return;
    } else {
      if (Array.isArray(args[0])) {
        this.setElements(args[0]);
      } else {
        this.setElements(args);
      }
    }
  }

  get x() {
    return this.elements[0];
  }
  set x(val: number) {
    this.elements[0] = val;
  }
  get y() {
    return this.elements[1];
  }
  set y(val: number) {
    this.elements[1] = val;
  }


  /** Number of components. */
  get nDimensions() {
    return this.elements.length;
  }

  /** Sets the elements used when the constructor gets no arguments. Subclasses override this. */
  _setToDefault() {
    this.elements = [];
  }

  /**
   * Returns the length (L2 norm) of the vector.
   */
  L2() {
    return Math.sqrt(this.dot(this));
  }

  /**
   * Returns true if `other` has the same number of elements and each is within `tolerance` of this vector's.
   * @param other The vector to compare to.
   * @param tolerance Allowed difference per element (default `Precision.epsilon`).
   */
  isEqualTo(other: VectorType, tolerance?: number) {
    if (this.nDimensions !== other.elements.length) {
      return false;
    }
    let epsilon: number =
      tolerance !== undefined ? tolerance : Precision.epsilon;
    var n: number = this.elements.length;
    while (n--) {
      if (Math.abs(this.elements[n] - other.elements[n]) > epsilon) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns the dot product of two vectors. Vectors must have equal length.
   * @param other
   */
  dot(other: VectorType) {
    assert(this.elements.length === other.elements.length);
    let n: number = this.elements.length;
    var rval: number = 0;
    while (n--) {
      rval += this.elements[n] * other.elements[n];
    }
    return rval;
  }

  /**
   * Returns a copy of this vector (same class, copied elements).
   */
  clone(): this {
    // var cfunc:any =this.constructor;
    let cfunc: any = this.constructor as any;
    var copy: this = new cfunc(this.elements);
    return copy;
  }


  /**
   * Returns a copy of this vector. Same as `clone()`.
   */
  deepCopy(): this {
    // var cfunc:any =this.constructor;
    let cfunc: any = this.constructor as any;
    var copy: this = new cfunc(this.elements.slice());
    return copy;
  }


  /**
   * Returns a new vector of the same class whose elements are `fn(e, i)` for each element `e` (at index `i`) of this
   * vector.
   * @param fn Function run on each element. Returns the new element.
   * @param context Value to use as `this` inside `fn`.
   */
  getMapped(fn: (e: number, i: number) => number, context?: any): this {
    var elements: number[] = [];
    this.forEach(function (x: number, i: number = 0) {
      elements.push(fn.call(context, x, i));
    }, context);

    let cfunc: any = this.constructor as any;
    return new cfunc(elements);
  }

  /**
   * Calls `fn(e, i)` for each element `e` at index `i`.
   * @param fn Function to run on each element.
   * @param context Value to use as `this` inside `fn`.
   */
  forEach(fn: (e: number, i: number) => any, context: any) {
    var n = this.elements.length;
    for (let i = 0; i < n; i++) {
      fn.call(context, this.elements[i], i);
    }
  }

  /**
   * Returns a vector of `n` random values, each uniform in `[0, 1]`, or in `[range[0], range[1]]` if `range` is
   * given.
   * @param n The number of elements.
   * @param range Optional `[min, max]` for every element.
   */
  static RandomVector(n: number = 1, range?:[number,number]) {
    var r = new this(Random.floatArray(n));
    if(range !== undefined){
      // Each value e is in [0, 1]; stretch it to the range's width and shift it to start at range[0].
      const [lo, hi] = range;
      r = r.getMapped((e: number) => lo + e * (hi - lo));
    }
    return r;
  }

  /** Returns a vector of `n` zeros. */
  static Zeros(n: number = 1) {
    let z = new Array(n);
    for (let i = 0; i < n; ++i) z[i] = 0;
    var r = new this(z);
    return r;
  }

  /** Returns a vector of `n` ones. */
  static Ones(n: number = 1) {
    let z = new Array(n);
    for (let i = 0; i < n; ++i) z[i] = 1;
    var r = new this(z);
    return r;
  }

  //##################//--Normalize--\\##################
  //<editor-fold desc="Normalize">
  /**
   * Scales this vector to length 1, in place. Does nothing if its length is 0.
   */
  normalize() {
    var r: number = this.L2();
    if (r === 0 || r === 1.0) {
      return;
    }
    var n: number = this.elements.length;
    var rinv: number = 1.0 / r;
    for (let i = 0; i < n; i++) {
      this.elements[i] = this.elements[i] * rinv;
    }
  }

  /** Returns a copy of this vector scaled to length 1 (or an unchanged copy if its length is 0). */
  getNormalized() {
    var r = this.L2();
    if (r === 0 || r === 1) {
      return this.clone();
    }
    return this.getMapped(function (x, i) {
      return x / r;
    });
  }

  /** Returns the sum of the elements. */
  getSumOverElements() {
    let rval = 0;
    for (let i = 0; i < this.elements.length; i++) {
      rval = rval + this.elements[i];
    }
    return rval;
  }

  //</editor-fold>
  //##################\\--Normalize--//##################

  //##################//--Arithmetic--\\##################
  //<editor-fold desc="Arithmetic">

  /**
   * Returns a new vector that is the sum of this vector and `other` (which must have the same length).
   */
  plus(other: VectorType): this {
    assert(this.elements.length === other.elements.length);
    return this.getMapped(function (x, i) {
      return x + other.elements[i];
    });
  }

  /**
   * Returns a new vector that is this vector minus `other` (which must have the same length).
   */
  minus(other: VectorType): this {
    assert(this.elements.length === other.elements.length);
    return this.getMapped(function (x, i) {
      return x - other.elements[i];
    });
  }

  /** Returns a new vector whose elements are the products of the matching elements of this vector and `v`. */
  timesElementWise(v: VectorBase) {
    assert(this.elements.length === v.elements.length, "VECTORS WRONG LENGTHS");
    return this.getMapped(function (x, i) {
      return x * v.elements[i];
    });
  }

  /**
   * Returns a new vector equal to this vector times the scalar `k`.
   */
  times(k: number): this {
    return this.getMapped(function (x, i) {
      return x * k;
    });
  }

  /**
   * Adds `other` to this vector, in place.
   */
  addVector(other: VectorType) {
    assert(this.elements.length === other.elements.length);
    for (let i = 0; i < this.elements.length; i++) {
      this.elements[i] = this.elements[i] + other.elements[i];
    }
    return;
  }

  /**
   * Subtracts `other` from this vector, in place.
   */
  subtractVector(other: VectorType) {
    assert(this.elements.length === other.elements.length);
    for (let i = 0; i < this.elements.length; i++) {
      this.elements[i] = this.elements[i] - other.elements[i];
    }
    return;
  }



  /** Returns a copy with each element rounded to the nearest integer. */
  getRounded(): this {
    return this.getMapped(function (x) {
      return Math.round(x);
    });
  }

  /** Returns the elements as a string like `[1, 2, 3]`. */
  inspect() {
    return "[" + this.elements.join(", ") + "]";
  }

  /** Sets the elements to a copy of `els`, in place. Returns this vector. */
  setElements(els: number[]) {
    this.elements = els.slice();
    return this;
  }

  /** The serialization label of this vector's class (see {@link GetClassLabel}). */
  get serializationLabel(): string {
    return GetClassLabel(this.constructor);
  }

  /** Returns a short string like `Vec3:[1, 2, 3]`. */
  sstring() {
    var rstring = `${this.serializationLabel}:[`;
    if (this.elements.length === 0) {
      return rstring + `]`;
    }
    rstring = rstring + `${this.elements[0]}`;
    for (let e = 1; e < this.elements.length; e++) {
      rstring = rstring + `, ${this.elements[e]}`;
    }
    rstring = rstring + "]";
    return rstring;
  }

  /** Returns a plain object with this vector's fields, for `JSON.stringify`. */
  toJSON() {
    var rval: { [name: string]: any } = {};
    for (let k in this) {
      // @ts-ignore
      rval[k] = this[k];
    }
    return rval;
  }




}


/** A vector of any length, with a few extra helpers. */
@ASerializable("Vector")
export class Vector extends VectorBase{
  /**
   * Returns `num` evenly spaced values from `start` to `stop` (like numpy's `linspace`), as a {@link VectorBase}.
   * @param start First value.
   * @param stop Last value (included only if `endpoint` is true).
   * @param num Number of values (default 10).
   * @param endpoint Whether to include `stop` (default true).
   */
  static LinSpace(start: number, stop: number, num = 10, endpoint = true) {
    if (num < 0) {
      throw new Error(`Number of samples, ${num}, must be non-negative.`);
    }
    let div = endpoint ? num - 1 : num;
    let delta = stop - start;
    let step = delta / div;
    let y: number[] = [];
    for (let i = 0; i < num; i++) {
      y.push(start+i * step);
    }
    return new VectorBase(y);
  }
  /** Returns a new vector with each element raised to `exponent`. */
  getRaisedToPower(exponent: number) {
    let cfunc: any = this.constructor as any;
    let elements: number[] = [];
    for (let i = 0; i < this.elements.length; i++) {
      elements.push(Math.pow(this.elements[i], exponent));
    }
    return new cfunc(elements);
  }

  /** Returns the element with the largest absolute value (with its sign), or 0 for an empty vector. */
  fabsmax() {
    var m: number = 0;
    var i: number = this.elements.length;
    while (i--) {
      if (Math.abs(this.elements[i]) > Math.abs(m)) {
        m = this.elements[i];
      }
    }
    return m;
  }

  // flatten(){
  //     return this.elements;
  // }
  // static flatten(vecs:Array<Vector|number>):Array<number>;
  /**
   * Flattens any mix of numbers, vectors, and (nested) arrays of them into one list of numbers, in order.
   * E.g., `Vector.flatten(V2(1, 2), [3, V2(4, 5)])` returns `[1, 2, 3, 4, 5]`.
   */
  static flatten(
      ...vecs: Array<ExtendsVector | number | any[]>
  ): Array<number> {
    let rval: number[] = [];
    function f(el: Array<ExtendsVector | number | any[]> | number) {
      if (el instanceof Number) {
        // @ts-ignore
        rval.push(el);
        return;
      } else {
        assert(Array.isArray(el), `input ${vecs} not flatten-able by Vector.flatten()`);
        for (let v of (el as any[])) {
          if (Array.isArray(v)) {
            f(v);
          } else {
            if (typeof v === "number") {
              rval.push(v);
            } else if (v instanceof VectorBase) {
              f(v.elements);
            }
          }
        }
      }
    }
    f(vecs);
    return rval;
  }
}
