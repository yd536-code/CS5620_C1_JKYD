import * as THREE from "three";
import {VectorBase, Vec2, Vec3, Vec4, Mat3, Mat4, V4} from "../math";
import {Color} from "../math";
import {ASerializable} from "../base/aserial";
// import {BufferAttribute} from "three/src/core/BufferAttribute";
// import {InterleavedBufferAttribute} from "three/src/core/InterleavedBufferAttribute";

/**
 * Each concrete subclass below has its own `@ASerializable` decoration: vertex arrays store their data in
 * instances of these classes, and a subclass does not inherit serializability from a decorated parent
 * ({@link VectorBase}). None of them defines a constructor, so the default revival
 * (`Object.assign(new ASClass(), data)`) works without a custom `toJSON`/`fromJSON`.
 */

/**
 * A flat array of per-vertex values (positions, normals, colors, uvs...), `ElementsPerVertex` numbers per vertex.
 * The stride and the vector class `getAt` returns are per-class statics (`ElementsPerVertex`, `VertexClass`), so
 * `getAt`/`setAt`/`push`/`nVerts`/`BufferAttribute`/`FromThreeJS` are written once here; subclasses set their
 * statics and override only where they differ (padding a shorter input, converting a `Color`, `ApplyMatrix`).
 *
 * The stride comes from the array class, not from `V`: `VertexAttributeColor3DArray` stores 3 numbers per vertex
 * but returns a `Color`, whose `nDimensions` is always 4.
 *
 * Per-class data is static on purpose: a new instance field would be copied into serialized JSON by
 * `VectorBase.toJSON`, and a field set from inside `VectorBase`'s constructor would be clobbered by Babel's
 * class-field initialization right after `super()` returns.
 */
export abstract class VertexAttributeArray<V extends VectorBase> extends VectorBase {
  static ElementsPerVertex: number = -1;

  /** The vector class `getAt` returns. A getter, not a field, so it is not read before the math module loads. */
  static get VertexClass(): new (elements: number[]) => VectorBase {
    return VectorBase;
  }

  /** Concatenates the elements of the given vectors into one flat list of numbers. */
  static FlattenVertValuesToElementVector(verts:VectorBase[]){
    let newcoords:number[] = [];
    for(let v of verts){
      newcoords.push(...v.elements);
    }
    return newcoords;
  }

  /**
   * Creates an array of the class this is called on from a three.js buffer attribute. Throws for interleaved
   * attributes.
   */
  static FromThreeJS<T extends VertexAttributeArray<any>>(
    this: new (elements?: number[]) => T,
    attr: THREE.BufferAttribute | THREE.InterleavedBufferAttribute
  ): T {
    if(attr instanceof THREE.InterleavedBufferAttribute){
      throw new Error("Have not implemented parsing of interleaved attributes")
    }
    return new this(Array.from(attr.array));
  }

  /** Numbers per vertex (this class's `ElementsPerVertex`). */
  get stride(): number {
    return (this.constructor as typeof VertexAttributeArray).ElementsPerVertex;
  }

  /** Number of vertices (`elements.length / stride`). */
  get nVerts(): number {
    return this.elements.length / this.stride;
  }

  /** Returns vertex `i`'s value as a new vector of this class's `VertexClass`. */
  getAt(i: number): V {
    let cls = this.constructor as typeof VertexAttributeArray;
    let s = cls.ElementsPerVertex;
    return new cls.VertexClass(this.elements.slice(i * s, i * s + s)) as V;
  }

  /**
   * The numbers `setAt`/`push` write for one vertex. Subclasses override this to pad a shorter input or convert
   * another vector type; only the first `stride` numbers are used.
   */
  protected _vertexElements(vertex: VectorBase | number[]): number[] {
    return Array.isArray(vertex) ? vertex : vertex.elements;
  }

  /** Overwrites vertex `i`'s value. */
  setAt(i: number, vertex: V | VectorBase | number[]): void {
    let elements = this._vertexElements(vertex);
    let s = this.stride;
    for (let k = 0; k < s; k++) {
      this.elements[i * s + k] = elements[k];
    }
  }

  /** Appends one vertex's value. */
  push(vertex: V | VectorBase) {
    let elements = this._vertexElements(vertex);
    let s = this.stride;
    for (let k = 0; k < s; k++) {
      this.elements.push(elements[k]);
    }
  }

  /** Returns a copy of the flat element list. */
  getElementsSlice(): number[] {
    return this.elements.slice();
  }

  /** Inserts one vertex's value at the front. */
  unshift(vertex: V) {
    this.elements.unshift(...vertex.elements);
  }
  /** Inserts several vertices' values at the front, keeping their order. */
  unshiftArray(vertices: V[]) {
    let newcoords:number[] = [];
    for(let v of vertices){
      newcoords.push(...v.elements);
    }
    this.elements.unshift(...newcoords);
  }

  /** Appends several vertices' values. Each vector's elements are copied as-is (no padding in this base class). */
  pushArray(vertices: V[] | VectorBase[]){
    // @ts-ignore
    let newcoords = (this.constructor).FlattenVertValuesToElementVector(vertices)
    this.elements = this.elements.concat(newcoords);
  }



  /** Replaces all values with those of `verts`. Throws if that would change the number of elements. */
  updateElements(verts:V[]){
    // @ts-ignore
    let newcoords = (this.constructor).FlattenVertValuesToElementVector(verts)
    if(newcoords.length != this.elements.length){
      throw new Error(`Cannot update VertexAttributeArray with ${this.elements.length} numbers using new array of ${newcoords.length} numbers`);
    }else{
      this.elements = newcoords;
    }
  }

  /** Returns the elements as a new `Float32Array`. */
  Float32Array() {
    return new Float32Array(this.elements);
  }

  /** Returns a new `THREE.BufferAttribute` with a copy of the elements (item size defaults to `stride`). */
  BufferAttribute(itemSize: number = this.stride) {
    return new THREE.BufferAttribute(new Float32Array(this.elements), itemSize);
  }
  /** Returns a new `THREE.InstancedBufferAttribute` with a copy of the elements (item size defaults to `stride`). */
  InstancedBufferAttribute(itemSize: number = this.stride) {
    return new THREE.InstancedBufferAttribute(
      new Float32Array(this.elements),
      itemSize
    );
  }
}

/** Two numbers per vertex (e.g., uvs); `getAt` returns a `Vec2`. */
@ASerializable("VertexAttributeArray2D")
export class VertexAttributeArray2D extends VertexAttributeArray<Vec2> {
  static ElementsPerVertex: number = 2;
  static get VertexClass() {
    return Vec2;
  }

  // Hand-indexed rather than the base's generic getAt/setAt because the generic form is measurably slower for this
  // class (see __tests__/VertexAttributeArray.bench.test.ts).
  getAt(i: number) {
    return new Vec2(this.elements[i * 2], this.elements[i * 2 + 1]);
  }

  setAt(i: number, vertex: Vec2 | number[]) {
    let elements = vertex instanceof Vec2 ? vertex.elements : vertex;
    this.elements[i * 2] = elements[0];
    this.elements[i * 2 + 1] = elements[1];
  }
}

/** Three numbers per vertex (e.g., 3D positions or normals); `getAt` returns a `Vec3`. */
@ASerializable("VertexAttributeArray3D")
export class VertexAttributeArray3D extends VertexAttributeArray<Vec3> {
  static ElementsPerVertex: number = 3;
  static get VertexClass() {
    return Vec3;
  }

  // Hand-indexed rather than the base's generic getAt/setAt because the generic form is measurably slower for this
  // class (see __tests__/VertexAttributeArray.bench.test.ts).
  getAt(i: number) {
    return new Vec3(
      this.elements[i * 3],
      this.elements[i * 3 + 1],
      this.elements[i * 3 + 2]
    );
  }

  setAt(i: number, vertex: Vec3 | number[]) {
    let elements = vertex instanceof Vec3 ? vertex.elements : vertex;
    this.elements[i * 3] = elements[0];
    this.elements[i * 3 + 1] = elements[1];
    this.elements[i * 3 + 2] = elements[2];
  }

  /**
   * Transforms every value in place as a 3D point (w = 1) and returns `this`. A `Mat3` is first converted with
   * `Mat4.From2DMat3`.
   */
  ApplyMatrix(m: Mat4 | Mat3) {
    m = m instanceof Mat4 ? m : Mat4.From2DMat3(m);
    for (let v = 0; v < this.nVerts; v++) {
      this.setAt(v, m.times(this.getAt(v).Point3DH).Point3D);
    }
    return this;
  }

  /** Returns a copy transformed by `m` (see `ApplyMatrix`). */
  GetTransformedByMatrix(m:Mat3|Mat4){
    let rval = this.deepCopy();
    return rval.ApplyMatrix(m);
  }

}

/** Four numbers per vertex; `getAt` returns a `Vec4`. */
@ASerializable("VertexAttributeArray4D")
export class VertexAttributeArray4D extends VertexAttributeArray<Vec4> {
  static ElementsPerVertex: number = 4;
  static get VertexClass() {
    return Vec4;
  }
  /** Fourth value used when `push` is given a `Vec3`. */
  _defaultH = 0;

  // Hand-indexed rather than the base's generic getAt/setAt because the generic form is measurably slower for this
  // class (see __tests__/VertexAttributeArray.bench.test.ts).
  getAt(i: number) {
    return new Vec4(
      this.elements[i * 4],
      this.elements[i * 4 + 1],
      this.elements[i * 4 + 2],
      this.elements[i * 4 + 3]
    );
  }

  /** `setAt(i, Vec3)` writes `Point3DH` (w = 1); note `push(Vec3)` pads with `_defaultH` instead. */
  setAt(i: number, vertex: Vec4 | Vec3 | number[]) {
    if (vertex instanceof Vec3) {
      vertex = vertex.Point3DH;
    }
    let elements = vertex instanceof Vec4 ? vertex.elements : vertex;
    this.elements[i * 4] = elements[0];
    this.elements[i * 4 + 1] = elements[1];
    this.elements[i * 4 + 2] = elements[2];
    this.elements[i * 4 + 3] = elements[3];
  }

  /** Multiplies every value by `m` in place and returns `this`. A `Mat3` is first converted with `Mat4.From2DMat3`. */
  ApplyMatrix(m: Mat4 | Mat3) {
    m = m instanceof Mat4 ? m : Mat4.From2DMat3(m);
    // let rval = this.clone();
    for (let v = 0; v < this.nVerts; v++) {
      this.setAt(v, m.times(this.getAt(v)));
    }
    return this;
  }

  /** Returns a copy transformed by `m` (see `ApplyMatrix`). */
  GetTransformedByMatrix(m:Mat3|Mat4){
    let rval = this.deepCopy();
    return rval.ApplyMatrix(m);
  }


  /** Appends a value; a `Vec3` gets `_defaultH` as its fourth number. */
  push(vertex: Vec4 | Vec3) {
    this.elements.push(vertex.elements[0]);
    this.elements.push(vertex.elements[1]);
    this.elements.push(vertex.elements[2]);
    if (vertex.elements.length === 3) {
      this.elements.push(this._defaultH);
    } else if (vertex.elements.length === 4) {
      this.elements.push(vertex.elements[3]);
    } else {
      throw new Error(`Can't push ${vertex} onto ${this}`);
    }
  }
}


/** Three numbers (rgb) per vertex; `getAt` returns a 3-element `Color`. */
@ASerializable("VertexAttributeColor3DArray")
export class VertexAttributeColor3DArray extends VertexAttributeArray<Color> {
  static ElementsPerVertex: number = 3;
  static get VertexClass() {
    return Color;
  }

  // Hand-indexed rather than the base's generic getAt because the generic form is measurably slower for this
  // class. setAt uses the generic version.
  getAt(i: number): Color {
    return new Color(
        this.elements[i * VertexAttributeColor3DArray.ElementsPerVertex],
        this.elements[i * VertexAttributeColor3DArray.ElementsPerVertex + 1],
        this.elements[i * VertexAttributeColor3DArray.ElementsPerVertex + 2]
    );
  }

  /** Returns vertex `i`'s color as a `Vec4` with alpha 1. */
  getVec4At(i: number) {
    return V4(
        this.elements[i * VertexAttributeColor3DArray.ElementsPerVertex],
        this.elements[i * VertexAttributeColor3DArray.ElementsPerVertex + 1],
        this.elements[i * VertexAttributeColor3DArray.ElementsPerVertex + 2],
        1
    );
  }
}

/** Four numbers (rgba) per vertex; `getAt` returns a `Color`. 3-number input gets an alpha of `_defaultAlpha` (1). */
@ASerializable("VertexAttributeColorArray")
export class VertexAttributeColorArray extends VertexAttributeArray<Color> {
  static ElementsPerVertex: number = 4;
  static get VertexClass() {
    return Color;
  }
  _defaultAlpha = 1;

  /** Returns vertex `i`'s color as a `Vec4`. */
  getVec4At(i: number) {
    return V4(
        this.elements[i * 4],
        this.elements[i * 4 + 1],
        this.elements[i * 4 + 2],
        this.elements[i * 4 + 3]
    );
  }

  /** A `Vec3` becomes `Point3DH` (alpha 1); a `Color` goes through `Color.Vec4`, which fills a missing alpha. */
  protected _vertexElements(vertex: VectorBase | number[]): number[] {
    if (vertex instanceof Vec3) {
      return vertex.Point3DH.elements;
    }
    if (vertex instanceof Color) {
      return vertex.Vec4.elements;
    }
    return super._vertexElements(vertex);
  }

  /** Multiplies every rgba value by `m` in place and returns `this`. */
  ApplyMatrix(m: Mat4 | Mat3) {
    m = m instanceof Mat4 ? m : Mat4.From2DMat3(m);
    // let rval = this.clone();
    for (let v = 0; v < this.nVerts; v++) {
      this.setAt(v, m.times(this.getVec4At(v)));
    }
    return this;
  }

  /** Appends a color; 3-number input gets `_defaultAlpha`. */
  push(vertex: Color | Vec4 | Vec3) {
    this.elements.push(vertex.elements[0]);
    this.elements.push(vertex.elements[1]);
    this.elements.push(vertex.elements[2]);
    if (vertex.elements.length === 3) {
      this.elements.push(this._defaultAlpha);
    } else if (vertex.elements.length === 4) {
      this.elements.push(vertex.elements[3]);
    } else {
      throw new Error(`Can't push ${vertex} onto ${this}`);
    }
  }

  /** Appends several colors; 3-number inputs get `_defaultAlpha`. */
  pushArray(vertices:Vec3[]|Vec4[]|Color[]){
    let newcoords:number[] = [];
    for(let v of vertices){
      newcoords.push(...v.elements);
      if(v.elements.length===3){
        newcoords.push(this._defaultAlpha);
      }
    }
    this.elements = this.elements.concat(newcoords);
  }
}


/**
 * 2D positions stored as 3 numbers per vertex (x, y, and a third, homogeneous coordinate). 2-element input is padded
 * with `_defaultZ`, which is 0, so a `Vec2` is stored as `(x, y, 0)`. `getPoint2DAt` converts back with `Point2D`,
 * which divides x and y by the third coordinate unless it is 0 or 1.
 */
@ASerializable("VertexPositionArray2DH")
export class VertexPositionArray2DH extends VertexAttributeArray3D {
  /** Third coordinate used for 2-element input (default 0). */
  public _defaultZ: number = 0;

  protected _vertexElements(vertex: VectorBase | number[]): number[] {
    let elements = Array.isArray(vertex) ? vertex : vertex.elements;
    return elements.length === 2 ? [elements[0], elements[1], this._defaultZ] : elements;
  }

  // Hand-indexed rather than the base's generic getAt/setAt because the generic form is measurably slower for this
  // class (see __tests__/VertexAttributeArray.bench.test.ts).
  setAt(i: number, vertex: Vec2 | Vec3 | number[]) {
    let elements = Array.isArray(vertex) ? vertex : vertex.elements;
    this.elements[i * 3] = elements[0];
    this.elements[i * 3 + 1] = elements[1];
    if (elements.length === 2) {
      this.elements[i * 3 + 2] = this._defaultZ;
    } else {
      this.elements[i * 3 + 2] = elements[2];
    }
  }

  pushArray(vertices: Vec3[] | Vec2[]) {
    let newcoords:number[] = [];
    vertices.map((v:Vec2|Vec3)=>{
      newcoords.push(...v.elements);
      if (v.elements.length === 2) {
        newcoords.push(this._defaultZ);
      }
      return
    });
    this.elements = this.elements.concat(newcoords);
  }

  unshift(vertex: Vec3 | Vec2) {
    let newcoords = vertex.elements.slice();
    if (vertex.elements.length === 2) {
      newcoords.push(this._defaultZ);
    }
    this.elements.unshift(...newcoords);
  }
  unshiftArray(vertices: Vec3[] | Vec2[]) {
    let newcoords:number[] = [];
    for(let v of vertices){
      newcoords.push(...v.elements);
      if (v.elements.length === 2) {
        newcoords.push(this._defaultZ);
      }
    }
    this.elements.unshift(...newcoords);
  }

  /** Returns vertex `i` as a 2D point (see the class description). */
  getPoint2DAt(i: number) {
    return this.getAt(i).Point2D;
  }

  /**
   * Transforms every position in place and returns `this`. A `Mat3` transforms the 2D point (the stored third
   * coordinate is replaced with `_defaultZ`); a `Mat4` transforms the stored `(x, y, z)` as a 3D point.
   */
  ApplyMatrix(m: Mat3 | Mat4) {
    // let rval = this.clone();
    if (m instanceof Mat3) {
      for (let v = 0; v < this.nVerts; v++) {
        this.setAt(v, m.times(this.getAt(v).Point2D));
      }
    } else {
      for (let v = 0; v < this.nVerts; v++) {
        this.setAt(v, m.times(this.getAt(v).Point3DH).Point3D);
      }
    }
    return this;
  }
}

/** Homogeneous 3D positions (x, y, z, w), 4 numbers per vertex; 3-element input is padded with `_defaultH` (1). */
@ASerializable("VertexPositionArray3DH")
export class VertexPositionArray3DH extends VertexAttributeArray4D {
  public _defaultH: number = 1;

  // Hand-indexed rather than the base's generic getAt/setAt because the generic form is measurably slower for this
  // class (see __tests__/VertexAttributeArray.bench.test.ts).
  setAt(i: number, vertex: Vec4 | Vec3 | number[]) {
    let elements = Array.isArray(vertex) ? vertex : vertex.elements;
    this.elements[i * 4] = elements[0];
    this.elements[i * 4 + 1] = elements[1];
    this.elements[i * 4 + 2] = elements[2];
    if (elements.length === 3) {
      this.elements[i * 4 + 3] = this._defaultH;
    } else {
      this.elements[i * 4 + 3] = elements[3];
    }
  }
}

/**
 * Converts a three.js buffer attribute into a {@link VertexAttributeArray2D}, {@link VertexAttributeArray3D}, or
 * {@link VertexAttributeArray4D}, depending on its item size. Throws for other sizes and for interleaved attributes.
 */
export function VertexAttributeArrayFromThreeJS(
  threeattribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute
) {
  if(threeattribute instanceof THREE.InterleavedBufferAttribute){
    throw new Error("Have not implemented parsing of interleaved attributes")
  }
  switch (threeattribute.itemSize) {
    case 2:
      return VertexAttributeArray2D.FromThreeJS(threeattribute);
    // break;
    case 3:
      return VertexAttributeArray3D.FromThreeJS(threeattribute);
    // break;
    case 4:
      return VertexAttributeArray4D.FromThreeJS(threeattribute);
    // break;
    default:
      throw new Error("What kind of attribute dis?");
    // break;
  }
}
