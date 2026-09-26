import { Precision, VectorBase } from "../math";
import type { TransformationInterface } from "../math";
import type { VertexAttributeArray } from "./VertexAttributeArray";

/**
 * Base class for axis-aligned bounding boxes. `minPoint`/`maxPoint` are the box's corners in its own (object)
 * space, and `transform` places the box, so a transformed box can be an oriented box. Both points are undefined
 * until the first point is bounded.
 * @typeParam VertexType The point type (`Vec2` or `Vec3`).
 * @typeParam TransformType The transform type (`Mat3` or `Mat4`).
 */
export abstract class BoundingBox<
  VertexType extends VectorBase,
  TransformType extends TransformationInterface
> {
  public minPoint!: VertexType | undefined;
  public maxPoint!: VertexType | undefined;
  public transform!: TransformType;
  /** Center of the box after applying `transform`; undefined for an empty box. */
  abstract get center(): VertexType | undefined;
  /** Corners of the box after applying `transform`; empty for an empty box. */
  abstract get corners(): VertexType[];

  /** Returns a random point inside the box, after applying `transform`. */
  abstract randomTransformedPoint(): VertexType;

  /** @param points Optional points to bound. */
  constructor(...points: Array<VertexType>) {
    if (points !== undefined) {
      for (let p of points) {
        this.boundPoint(p);
      }
    }
  }

  /** Returns a copy of the box (points and transform are copied). */
  clone(): this {
    let cfunc: any = this.constructor as any;
    let clone = new cfunc();
    clone.minPoint = this.minPoint?.clone();
    clone.maxPoint = this.maxPoint?.clone();
    clone.transform = this.transform.clone();
    return clone;
  }

  /**
   * Grows the box to contain every vertex in `va` (in the box's local space; `transform` is not applied).
   * @param va A vertex attribute array, usually a vertex array's positions.
   */
  boundVertexPositionArrray(va: VertexAttributeArray<any>) {
    let nverts = va.nVerts;
    for (let vi = 0; vi < nverts; vi++) {
      this.boundPoint(va.getAt(vi));
    }
  }

  /**
   * Grows the box to contain the corners of another box. Uses `b`'s transformed corners, and adds them to this box
   * without applying this box's `transform`.
   * @param b The box to contain.
   */
  boundBounds(b: BoundingBox<any, any>) {
    let corners = b.corners;
    for (let c of corners) {
      this.boundPoint(c);
    }
  }

  /** Empties the box (clears `minPoint` and `maxPoint`). */
  reset() {
    this.minPoint = undefined;
    this.maxPoint = undefined;
  }

  /**
   * Converts a point from the space the box is placed in (after `transform`) back into the box's local space, by
   * applying the inverse of `transform`. Returns undefined if `transform` can't be inverted.
   * @param p The point to convert.
   */
  protected abstract _pointToLocalSpace(p: VertexType): VertexType | undefined;

  /**
   * Returns true if `p` lies inside the box after `transform` is applied (so `p` is in the same space as `center`
   * and `corners`). Points up to `epsilon` outside the box also count as inside. Returns false for an empty box, or
   * if `transform` can't be inverted.
   * @param p The point to test.
   * @param epsilon How far outside the box (in the box's local space) a point can be and still count as inside
   * (default `Precision.epsilon`).
   */
  pointInBounds(p: VertexType, epsilon?: number): boolean {
    if (!this.minPoint || !this.maxPoint) {
      return false;
    }
    if (epsilon === undefined) {
      epsilon = Precision.epsilon;
    }

    // Undo the box's transform so we can compare against minPoint/maxPoint, which are in local space.
    let local = this._pointToLocalSpace(p);
    if (local === undefined) {
      return false;
    }

    let ndim: number = Math.min(p.nDimensions, this.minPoint.nDimensions);
    for (let c = 0; c < ndim; c++) {
      if (
        local.elements[c] < this.minPoint.elements[c] - epsilon ||
        local.elements[c] > this.maxPoint.elements[c] + epsilon
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * Grows the box, if needed, to contain `p`. The first point bounded sets both `minPoint` and `maxPoint`.
   * @param p The point to contain, in the box's local space.
   */
  public boundPoint(p: VertexType): void {
    if (!this.minPoint || !this.maxPoint) {
      this.minPoint = p.clone();
      this.maxPoint = p.clone();
      return;
    }
    let ndim: number = this.minPoint.nDimensions;
    for (let c = 0; c < ndim; c++) {
      if (p.elements[c] < this.minPoint.elements[c]) {
        this.minPoint.elements[c] = p.elements[c];
      }
      if (p.elements[c] > this.maxPoint.elements[c]) {
        this.maxPoint.elements[c] = p.elements[c];
      }
    }
  }
}
