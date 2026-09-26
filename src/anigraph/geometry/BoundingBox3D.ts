import * as THREE from "three";
import {V3, Vec3, Vec4, Vec2, V2, Mat4} from "../math";
import { BoundingBox } from "./BoundingBox";
import { BoundingBox2D } from "./BoundingBox2D";
import { VertexArray3D } from "./VertexArray3D";
import { VertexArray2D } from "./VertexArray2D";
import { VertexIndexArray } from "./VertexIndexArray";

// export class BoundingBox3D extends BoundingBox<Vec3, Mat4>
/**
 * A 3D axis-aligned bounding box, stored as:
 * - `minPoint` (Vec3): the minimum x, y, and z coordinates being bound, in the box's local space.
 * - `maxPoint` (Vec3): the maximum x, y, and z coordinates being bound, in the box's local space.
 * - `transform` (Mat4, identity by default): places the box, which allows oriented bounding boxes.
 */
export class BoundingBox3D extends BoundingBox<Vec3, Mat4> {
  constructor() {
    super();
    // this.transform = new Mat4();
    this.transform = new Mat4();
  }


  /** Returns the box that bounds the given points. */
  static FromVec3s(verts: Vec3[]) {
    let va = VertexArray3D.FromVec3List(verts);
    return BoundingBox3D.FromVertexArray3D(va);
  }

  /**
   * Returns a cube with side length `size`, centered at the origin in local space and translated to `location` by
   * its `transform`.
   * @param location Center of the cube.
   * @param size Side length (default 100).
   * @returns {BoundingBox3D}
   */
  static BoxAtLocationWithSize(location: Vec3, size: number = 100) {
    let box = new BoundingBox3D();
    let hsize = size * 0.5;
    box.boundPoint(V3(hsize, hsize, hsize));
    box.boundPoint(V3(-hsize, -hsize, -hsize));
    box.transform = Mat4.Translation3D(location);
    // box.transform = new Mat4();
    // box.transform.c3 = new Vec4(location.x, location.y, location.z, 1.0);

    return box;
  }

  /**
   * Returns the box that bounds the positions of the given {@link VertexArray3D}.
   * @param verts
   * @returns {BoundingBox3D}
   */
  static FromVertexArray3D(verts: VertexArray3D) {
    let rval = new BoundingBox3D();
    rval.boundVertexPositionArrray(verts.position);
    return rval;
  }


  /**
   * Returns the world-space bounds of a three.js object (computed by `THREE.Box3.setFromObject`) as a
   * BoundingBox3D.
   * @param obj
   * @returns {BoundingBox3D}
   */
  static FromTHREEJSObject(obj: THREE.Object3D) {
    let threebox = new THREE.Box3().setFromObject(obj);
    let bounds = new BoundingBox3D();
    bounds.minPoint = V3(threebox.min.x, threebox.min.y, threebox.min.z);
    bounds.maxPoint = V3(threebox.max.x, threebox.max.y, threebox.max.z);
    return bounds;
  }

  /**
   * Returns a random point in the object space (not transformed by this.transform) of the bounding box, or the
   * origin if the box is empty.
   * @returns {Vec3}
   */
  randomPointObjectSpace() {
    let rand1 = Math.random();
    let rand2 = Math.random();
    let rand3 = Math.random();
    if (!this.minPoint || !this.maxPoint) {
      return V3();
    }
    return V3(
      this.minPoint.x * rand1 + this.maxPoint.x * (1 - rand1),
      this.minPoint.y * rand2 + this.maxPoint.y * (1 - rand2),
      this.minPoint.z * rand3 + this.maxPoint.z * (1 - rand3)
    );
  }

  /**
   * Returns a random point from the region bounded by the oriented bounding box
   * (i.e., the box after transforming by this.transform)
   * @returns {Vec3}
   */
  randomTransformedPoint() {
    return this.transform
      .getMatrix()
      .times(this.randomPointObjectSpace().Point3DH).Point3D;
  }

  /**
   * Center of the box, transformed by `transform`; undefined if the box is empty.
   * @returns {Vec3}
   */
  get center() {
    if (!this.minPoint || !this.maxPoint) {
      return undefined;
    }
    return this.transform
      .getMatrix()
      .times(this.minPoint.plus(this.maxPoint).times(0.5).Point3DH).Point3D;
  }

  /**
   * The width in object space
   * @returns {number}
   */
  get localWidth() {
    // @ts-ignore
    return this.maxPoint.x - this.minPoint.x;
  }

  /**
   * The height in object space
   * @returns {number}
   */
  get localHeight() {
    // @ts-ignore
    return this.maxPoint.y - this.minPoint.y;
  }

  /**
   * The depth in object space
   * @returns {number}
   */
  get localDepth() {
    // @ts-ignore
    return this.maxPoint.z - this.minPoint.z;
  }

  /**
   * Applies the inverse of `transform` to the point `p`. Returns undefined if `transform` is singular. A `Vec2` is
   * treated as the point (x, y, 0), and the result has only x and y.
   */
  protected _pointToLocalSpace(p: Vec3 | Vec2): Vec3 | undefined {
    let m = this.transform.getMatrix() as Mat4;
    if (m.determinant() === 0) {
      return undefined;
    }
    let p3 = p instanceof Vec3 ? p : V3(p.x, p.y, 0);
    return m.getInverse().times(p3.Point3DH).Point3D;
  }

  /**
   * Grows the box, if needed, to contain the given point.
   * @param p A `Vec3`, a `Vec4` (converted with `Point3D`), or a `Vec2`. When the box is empty, a `Vec2` becomes
   * `(x, y, 1)`; otherwise only the coordinates `p` has are compared.
   */
  public boundPoint(p: Vec2 | Vec3 | Vec4): void {
    if (!this.minPoint || !this.maxPoint) {
      let pcl =
        p instanceof Vec3
          ? p
          : p instanceof Vec4
          ? p.Point3D
          : Vec3.From2DHPoint(p);
      this.minPoint = pcl.clone();
      this.maxPoint = pcl.clone();
      return;
    }
    let ndim: number = Math.min(this.minPoint.nDimensions, p.elements.length);
    for (let c = 0; c < ndim; c++) {
      if (p.elements[c] < this.minPoint.elements[c]) {
        this.minPoint.elements[c] = p.elements[c];
      }
      if (p.elements[c] > this.maxPoint.elements[c]) {
        this.maxPoint.elements[c] = p.elements[c];
      }
    }
  }

  /**
   * The eight corners, transformed by `transform`, or an empty array if the box is empty. With -1 meaning the
   * min coordinate and 1 the max, the order is:
   * [-1, -1, -1]
   * [1,  -1, -1]
   * [1,   1, -1]
   * [-1,  1, -1]
   * [-1, -1,  1]
   * [1,  -1,  1]
   * [1,   1,  1]
   * [-1,  1,  1]
   *
   * (the min-z face, then the max-z face)
   * @returns {Vec3[]}
   */
  get corners() {
    let tmat = this.transform.getMatrix();
    if (!this.minPoint || !this.maxPoint) {
      return [];
    }
    return [
      tmat.times(this.minPoint.Point3DH).Point3D,
      tmat.times(V3(this.maxPoint.x, this.minPoint.y, this.minPoint.z).Point3DH)
        .Point3D,
      tmat.times(V3(this.maxPoint.x, this.maxPoint.y, this.minPoint.z).Point3DH)
        .Point3D,
      tmat.times(V3(this.minPoint.x, this.maxPoint.y, this.minPoint.z).Point3DH)
        .Point3D,
      tmat.times(V3(this.minPoint.x, this.minPoint.y, this.maxPoint.z).Point3DH)
        .Point3D,
      tmat.times(V3(this.maxPoint.x, this.minPoint.y, this.maxPoint.z).Point3DH)
        .Point3D,
      tmat.times(this.maxPoint.Point3DH).Point3D,
      tmat.times(V3(this.minPoint.x, this.maxPoint.y, this.maxPoint.z).Point3DH)
        .Point3D,
    ];
  }

  /**
   * Returns a {@link VertexArray2D} tracing the min-z face (corners 0-3 of `corners`) as a closed loop, keeping only
   * each corner's x and y.
   * @returns {VertexArray2D}
   */
  GetBoundaryLinesVertexArray2D() {
    let va = new VertexArray2D();
    let corners = this.corners;
    if (!corners.length) {
      return va;
    }

    va.addVertex(corners[0].XY);
    va.addVertex(corners[1].XY);
    va.addVertex(corners[2].XY);
    va.addVertex(corners[3].XY);
    va.addVertex(corners[0].XY);
    return va;
  }

  /**
   * Returns a {@link VertexArray2D} with the box's twelve edges as line segments, seen from above (only each
   * corner's x and y are kept). It has the eight transformed `corners`, in the same order, and `indices` with two
   * vertex indices per edge (`VertsPerElement` 2). The edges are listed in groups of three, one group per corner
   * `i` of the min-z face: the min-z edge from `i` to the next corner, the matching max-z edge, and the edge from
   * `i` up to corner `i + 4`.
   */
  GetBoundaryLinesVertexArray() {
    let va = new VertexArray2D();
    let corners = this.corners;
    if (!corners.length) {
      return va;
    }

    for (let c of corners) {
      va.addVertex(c.XY);
    }
    va.initIndices(2);
    for (let i = 0; i < 4; i++) {
      let next = (i + 1) % 4;
      va.indices.push([i, next]); // edge of the min-z face
      va.indices.push([i + 4, next + 4]); // edge of the max-z face
      va.indices.push([i, i + 4]); // edge joining the two faces
    }
    return va;
  }

  /** Returns a {@link VertexArray3D} triangle mesh of the box's transformed corners (8 vertices, 12 triangles). */
  GetBoxTriangleMeshVerts() {
    let va = new VertexArray3D();
    let corners = this.corners;
    if (!corners.length) {
      return va;
    }

    va.addVertex(corners[0]);
    va.addVertex(corners[1]);
    va.addVertex(corners[2]);
    va.addVertex(corners[3]);
    va.addVertex(corners[4]);
    va.addVertex(corners[5]);
    va.addVertex(corners[6]);
    va.addVertex(corners[7]);

    va.indices = new VertexIndexArray(3);

    va.indices.push([2, 1, 0]);
    va.indices.push([3, 2, 0]);

    //back
    va.indices.push([5, 6, 4]);
    va.indices.push([6, 7, 4]);

    // left
    va.indices.push([3, 0, 4]);
    va.indices.push([7, 3, 4]);

    //right
    va.indices.push([1, 2, 5]);
    va.indices.push([2, 6, 5]);

    // top
    va.indices.push([6, 2, 3]);
    va.indices.push([7, 6, 3]);

    //bottom
    va.indices.push([1, 5, 0]);
    va.indices.push([5, 4, 0]);

    return va;
  }


  /** Returns a 3D box that bounds a 2D box's transformed corners, placed at z = 0. */
  static FromBoundingBox2D(bounds2D: BoundingBox2D) {
    let b = new BoundingBox3D();
    let corners = bounds2D.corners;
    for (let c of corners) {
      b.boundPoint(Vec3.FromVec2(c));
    }
    return b;
  }

  /** Returns the 2D box that bounds the x and y coordinates of this box's transformed corners. */
  getBoundsXY():BoundingBox2D{
    let b = new BoundingBox2D();
    let corners = this.corners;
    for (let c of corners) {
      b.boundPoint(V2(c.x, c.y));
    }
    return b;
  }
}
