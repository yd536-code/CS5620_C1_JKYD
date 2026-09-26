import { BoundingBox } from "./BoundingBox";
import {Mat3, V2, Vec2, Vec3} from "../math";
import { VertexArray2D } from "./VertexArray2D";

/** A 2D axis-aligned bounding box with a `Mat3` transform (identity by default). */
export class BoundingBox2D extends BoundingBox<Vec2, Mat3> {

  /** Returns the box that bounds the given points. */
  static FromVec2s(verts: Vec2[]) {
    let va = VertexArray2D.FromLists(verts);
    return BoundingBox2D.FromVertexArray2D(va);
  }

  /** Returns the box that bounds the positions of a {@link VertexArray2D}. */
  static FromVertexArray2D(verts: VertexArray2D) {
    let rval = new BoundingBox2D();
    rval.boundVertexPositionArrray(verts.position);
    return rval;
  }


  constructor() {
    super();
    this.transform = new Mat3();
  }

  /** Applies the inverse of `transform` to the point `p`. Returns undefined if `transform` is singular. */
  protected _pointToLocalSpace(p: Vec2): Vec2 | undefined {
    let inverse: Mat3;
    try {
      inverse = this.transform.getMatrix().getInverse();
    } catch (e) {
      // Mat3.getInverse throws when the determinant is 0.
      return undefined;
    }
    // Mat3.times(Vec2) treats the Vec2 as the point (x, y, 1).
    return inverse.times(p);
  }

  /** Returns a random point inside the box in its local space (`transform` not applied); the origin if empty. */
  randomPointObjectSpace() {
    let rand1 = Math.random();
    let rand2 = Math.random();
    if (!this.minPoint || !this.maxPoint) {
      return V2();
    }
    return V2(
      this.minPoint.x * rand1 + this.maxPoint.x * (1 - rand1),
      this.minPoint.y * rand2 + this.maxPoint.y * (1 - rand2)
    );
  }

  /** Returns a random point inside the box, transformed by `transform`. */
  randomTransformedPoint() {
    return this.transform.getMatrix().times(this.randomPointObjectSpace());
  }

  /** Center of the box, transformed by `transform`; undefined if the box is empty. */
  get center() {
    if (!this.minPoint || !this.maxPoint) {
      return undefined;
    }
    return this.transform
      .getMatrix()
      .times(this.minPoint.plus(this.maxPoint).times(0.5));
  }

  /** Width in local space (`maxPoint.x - minPoint.x`). */
  get localWidth() {
    // @ts-ignore
    return this.maxPoint.x - this.minPoint.x;
  }
  /** Height in local space (`maxPoint.y - minPoint.y`). */
  get localHeight() {
    // @ts-ignore
    return this.maxPoint.y - this.minPoint.y;
  }

  /**
   * Grows the box, if needed, to contain `p`. A `Vec3` is treated as a homogeneous 2D point and converted with
   * `Point2D`.
   */
  public boundPoint(p: Vec2 | Vec3): void {
    let p2d:Vec2;
    if (p instanceof Vec3) {
      p2d = p.Point2D;
    }else{
      p2d = p;
    }
    if (!this.minPoint || !this.maxPoint) {
      this.minPoint = p2d.clone();
      this.maxPoint = p2d.clone();
      return;
    }
    let ndim: number = this.minPoint.nDimensions;
    for (let c = 0; c < ndim; c++) {
      if (p2d.elements[c] < this.minPoint.elements[c]) {
        this.minPoint.elements[c] = p2d.elements[c];
      }
      if (p2d.elements[c] > this.maxPoint.elements[c]) {
        this.maxPoint.elements[c] = p2d.elements[c];
      }
    }
  }

  /** The four corners, transformed by `transform`, counterclockwise starting at `minPoint`. Empty if the box is empty. */
  get corners(): Vec2[] {
    let tmat = this.transform.getMatrix();
    if (!this.minPoint || !this.maxPoint) {
      return [];
    }
    return [
      tmat.times(this.minPoint),
      tmat.times(V2(this.maxPoint.x, this.minPoint.y)),
      tmat.times(this.maxPoint),
      tmat.times(V2(this.minPoint.x, this.maxPoint.y)),
    ];
  }

  /** The four corners in local space (`transform` not applied), in the same order as `corners`. */
  getLocalCorners(){
      if (!this.minPoint || !this.maxPoint) {
          return [];
      }
      return [
          this.minPoint,
          V2(this.maxPoint.x, this.minPoint.y),
          this.maxPoint,
          V2(this.minPoint.x, this.maxPoint.y),
      ];
  }





  /** Returns a {@link VertexArray2D} tracing the transformed corners as a closed loop (the first corner is repeated at the end). */
  GetBoundaryLinesVertexArray() {
    let va = new VertexArray2D();
    let corners = this.corners;
    if (!corners.length) {
      return va;
    }
    // va.addVertex(corners[0]);
    // va.addVertex(corners[1]);
    // va.addVertex(corners[1]);
    // va.addVertex(corners[2]);
    // va.addVertex(corners[2]);
    // va.addVertex(corners[3]);
    // va.addVertex(corners[3]);
    // va.addVertex(corners[0]);

    va.addVertex(corners[0]);
    va.addVertex(corners[1]);
    // va.addVertex(corners[1]);
    va.addVertex(corners[2]);
    // va.addVertex(corners[2]);
    va.addVertex(corners[3]);
    // va.addVertex(corners[3]);
    va.addVertex(corners[0]);
    return va;
  }

}
