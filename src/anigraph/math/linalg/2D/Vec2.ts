import { VectorBase } from "../VectorBase";
import { Random } from "../../Random";
import { ASerializable } from "../../../base/aserial";
import * as THREE from "three";

// function V2(elements?: Array<number>):Vec2;
/** Shorthand for `new Vec2(...)`: `V2(x, y)` or `V2([x, y])`. */
function V2(...args: Array<any>): Vec2 {
  return new Vec2(...args);
}

export { V2 };

/** A 2D vector or point with `x` and `y` components. */
@ASerializable("Vec2")
export class Vec2 extends VectorBase {
  static N_DIMENSIONS: number = 2;

  /**
   * Creates a Vec2 from x and y. With no arguments, creates `(0, 0)`.
   * @param x
   * @param y
   */
  public constructor(x: number, y: number);
  /**
   * Creates a Vec2 from a list of elements (copied).
   * @param elements
   */
  public constructor(elements?: Array<number>);
  public constructor(...args: Array<any>) {
    // common logic constructor
    super(...args);
  }

  _setToDefault() {
    this.elements = [0, 0];
  }

  get nDimensions() {
    return 2;
  }

  toString() {
    return `Vec2(${this.x}, ${this.y})`;
  }

  /**
   * Returns a random vector. Each component is uniform in `[0, 1]`, or in `[range[0], range[1]]` if `range` is given.
   */
  static Random(range?:[number,number]) {
    var rand = new this(Random.floatArray(2));
    if(range !== undefined){
      rand = new this(range[0],range[0]).plus(rand.times(range[1]-range[0]));
    }
    return rand;
  }

  /** Returns the elements of this vector as a homogeneous point: `[x, y, 1]`. */
  getHPointElements(){
    return [...this.elements, 1.0];
  }

  /** Returns the elements of this vector as a homogeneous direction: `[x, y, 0]`. */
  getHVectorElements(){
    return [...this.elements, 0.0];
  }

}
