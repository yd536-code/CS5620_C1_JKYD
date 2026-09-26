import {
  VertexAttributeArray,
  VertexAttributeArray2D,
  VertexAttributeArray3D,
  VertexAttributeArray4D,
  VertexPositionArray2DH,
} from "./VertexAttributeArray";
import {VectorBase, Vec3, Vec4, Mat3, Mat4, Color} from "../math";
import { HasBounds} from "./HasBounds";
import { BoundingBox3D } from "./BoundingBox3D";
import { VertexIndexArray } from "./VertexIndexArray";
import { v4 as uuidv4 } from "uuid";

export enum ATTRIBUTE_NAMES{
  // COLOR="color",
  COLOR="color",
  NORMAL="normal",
  POSITION="position",
  UV="uv",
  INDEX="index"
}

/**
 * Base class for vertex data: named per-vertex attribute arrays (`position`, `normal`, `color`, `uv`, or any other
 * name) plus an optional {@link VertexIndexArray} of element indices. See {@link VertexArray2D} and
 * {@link VertexArray3D}.
 *
 * After changing a node's vertices in place, call the node model's `signalGeometryUpdate()` so its views redraw
 * (`setVerts` does this for you).
 * @typeParam VType The position vector type (`Vec2` or `Vec3`).
 */
export abstract class VertexArray<VType extends VectorBase> implements HasBounds {
  /** Standard attribute names (`"position"`, `"normal"`, `"color"`, `"uv"`, `"index"`). */
  static AttributeNames = ATTRIBUTE_NAMES;
  /** Attribute arrays by name. */
  public attributes: { [name: string]: VertexAttributeArray<any> } = {};
  /** Element indices (e.g., triangles). May be undefined if the array was not set up with indices. */
  public indices!: VertexIndexArray;

  /** The position attribute. */
  set position(
    value:
      | VertexPositionArray2DH
      | VertexAttributeArray3D
      | VertexAttributeArray4D
  ) {
    this.attributes[VertexArray.AttributeNames.POSITION] = value;
  }
  get position() {
    return this.attributes[VertexArray.AttributeNames.POSITION] as
      | VertexPositionArray2DH
      | VertexAttributeArray3D
      | VertexAttributeArray4D;
  }

  /** True if there is a position attribute. */
  get hasPosition(){
    return this.hasAttribute(VertexArray.AttributeNames.POSITION);
  }

  /** True if an attribute named `name` exists. */
  hasAttribute(name:string){
    return (this.attributes[name] !== undefined);
  }


  /** The normal attribute (undefined if there is none). */
  set normal(value: VertexAttributeArray3D) {
    this.attributes[VertexArray.AttributeNames.NORMAL] = value;
  }

  get normal() {
    return this.attributes[VertexArray.AttributeNames.NORMAL] as VertexAttributeArray3D;
  }

  /** True if there is a normal attribute. */
  get hasNormal(){
    return this.hasAttribute(VertexArray.AttributeNames.NORMAL);
  }



  /** The color attribute (undefined if there is none). */
  set color(value: VertexAttributeArray<any>) {
    this.attributes[VertexArray.AttributeNames.COLOR] = value;
  }
  get color() {
    return this.attributes[VertexArray.AttributeNames.COLOR];
  }

  /** True if there is a color attribute. */
  get hasColor(){
    return this.hasAttribute(VertexArray.AttributeNames.COLOR);
  }

  /** The texture-coordinate attribute (undefined if there is none). */
  set uv(value: VertexAttributeArray2D) {
    this.attributes[VertexArray.AttributeNames.UV] = value;
  }
  get uv() {
    return this.attributes[VertexArray.AttributeNames.UV];
  }

  /** True if there is a uv attribute. */
  get hasUV(){
    return this.hasAttribute(VertexArray.AttributeNames.UV);
  }

  /** Appends one vertex. Subclasses accept extra per-vertex values (e.g., color). */
  abstract addVertex(v: VType | any): void;

  /**
   * Appends positions and, if given and this array has a color attribute, colors (one per position, or a single
   * `Color` for all of them).
   */
  addVertices(positions: VType[] | Vec3[], colors?: Color|Color[] | Vec3[] | Vec4[]) {
    (this.position as VertexAttributeArray<any>).pushArray(positions);
    if (colors) {
      if(colors instanceof Color){
        this.color?.pushArray(new Array(positions.length).fill(colors));
      }else {
        this.color?.pushArray(colors);
      }
    }
  }
  /** Returns a box that bounds the positions. */
  abstract getBounds(): BoundingBox3D;
  /** A random unique id, made when the array is created (a clone gets a new one). */
  protected _uid: string = uuidv4();

  /** Returns the attribute array named `name`, or undefined. */
  getAttributeArray(name: string) {
    return this.attributes[name];
  }

  /**
   * Transforms the positions by `m` in place. Normals, if present, are transformed by the inverse transpose of `m`
   * (as a `Mat4`); throws if `m` is singular.
   */
  ApplyMatrix(m: Mat3 | Mat4) {
    this.position.ApplyMatrix(m);
    if (this.normal) {
      let m4 = m instanceof Mat4 ? m : Mat4.From2DMat3(m);
      let mnorm = m4.getInverse()?.getTranspose();
      if (!mnorm) {
        throw new Error(`tried to apply singular matrix to normals...`);
      }
      this.normal.ApplyMatrix(mnorm);
    }
  }

  /** Returns a copy transformed by `m` (see `ApplyMatrix`). */
  GetTransformedBy(m:Mat3|Mat4){
    let rval = this.clone();
    rval.ApplyMatrix(m);
    return rval;
  }

  /**
   * This array's unique id, used as its key when added to an {@link AGeometrySet} with `addMember`. Every vertex
   * array gets its own, so a geometry set can hold several.
   */
  get uid() {
    return this._uid;
  }

  /**
   * Returns the number of vertices
   * @returns {number}
   */
  get nVerts():number{
    return this.position.nVerts;
  }

  /** Returns a copy with copies of every attribute array and of `indices`. */
  clone(): this {
    let cfunc: any = this.constructor as any;
    let clone = new cfunc();
    for (let atr in this.attributes) {
      clone.attributes[atr] = this.attributes[atr].clone();
    }
    if(this.indices) {
    clone.indices = this.indices.clone();
    }
    return clone;
  }

  /** Returns a plain object with this array's own properties. */
  toJSON() {
    var rval: { [name: string]: any } = {};
    for (let k in this) {
      // @ts-ignore
      rval[k] = this[k];
    }
    return rval;
  }
}
