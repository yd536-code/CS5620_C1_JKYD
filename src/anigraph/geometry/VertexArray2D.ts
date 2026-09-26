import { VertexArray } from "./VertexArray";
import {Mat3, V2, Vec2, Vec3, Vec4} from "../math";
import { BoundingBox3D } from "./BoundingBox3D";
import { Color} from "../math";
import {
  VertexAttributeArray, VertexAttributeArray2D, VertexAttributeArray3D,
  VertexAttributeColor3DArray,
  VertexAttributeColorArray,
  VertexPositionArray2DH,
} from "./VertexAttributeArray";
import {VertexIndexArray} from "./VertexIndexArray";
import {ASerializable} from "../base/aserial";

/**
 * Vertex data for 2D geometry. Positions are stored as 3-number vectors in a {@link VertexPositionArray2DH}; a
 * `Vec2` added as a position is stored with a third coordinate of 0. Used by 2D nodes and {@link Polygon2D}.
 */
@ASerializable("VertexArray2D")
export class VertexArray2D extends VertexArray<Vec2> {
  public attributes: { [name: string]: VertexAttributeArray<any> } = {};

  /** The position attribute. */
  set position(value: VertexPositionArray2DH) {
    this.attributes[VertexArray.AttributeNames.POSITION] = value;
  }
  get position(): VertexPositionArray2DH {
    return this.attributes[VertexArray.AttributeNames.POSITION] as VertexPositionArray2DH;
  }

  /** True if an attribute named `name` exists. */
  hasAttribute(name:string){
    return (name in this.attributes);
  }

  /** True if there is a uv attribute. */
  get hasUVAttribute(){
    return VertexArray.AttributeNames.UV in this.attributes;
  }

  /** True if there is a normal attribute. */
  get hasNormalAttribute(){
    return VertexArray.AttributeNames.NORMAL in this.attributes;
  }

  /** True if there is a color attribute. */
  get hasColorAttribute(){
    return VertexArray.AttributeNames.COLOR in this.attributes;
  }

  /** Returns a {@link BoundingBox3D} of the stored 3-number positions (x, y, and the third coordinate). */
  getBounds() {
    let b = new BoundingBox3D();
    b.boundVertexPositionArrray(this.position);
    return b;
  }

  /** Number of vertices (same as `nVerts`). */
  get length() {
    return this.position.elements.length / 3;
  }

  /** Returns vertex `i`'s position as a `Vec2` (see {@link VertexPositionArray2DH.getPoint2DAt}). */
  getPoint2DAt(i: number) {
    return this.position.getPoint2DAt(i);
  }

  /** Same as `getPoint2DAt`. */
  vertexAt(index:number):Vec2{
    return this.getPoint2DAt(index);
  }

  /** Sets every vertex's color to `color`. Requires an existing color attribute with an entry per vertex. Returns `this`. */
  FillColor(color:Color){
    for (let v = 0; v < this.length; v++) {
      this.color.setAt(v, color);
    }
    return this;
  }

  /** Sets every vertex to a random color. Requires an existing color attribute with an entry per vertex. Returns `this`. */
  RandomizeColor(){
    for (let v = 0; v < this.length; v++) {
      this.color.setAt(v, Color.Random());
    }
    return this;
  }


  /**
   * Returns an empty instance for drawing a curve.
   * @param hasColor Whether to add an rgba color attribute (default true).
   */
  static CreateForCurve(hasColor:boolean=true) {
    let v = new this();
    if(hasColor) {
      v.initColorAttribute();
    }
    return v;
  }

  /** Returns `nverts` points evenly spaced on a circle of radius `size` around the origin. */
  static CircleVArray(size: number, nverts: number = 16) {
    let verts = new VertexArray2D();
    for (let v = 0; v < nverts; v++) {
      let phase = (v * (2 * Math.PI)) / nverts;
      verts.addVertex(V2(Math.cos(phase) * size, Math.sin(phase) * size));
    }
    return verts;
  }

  /** Returns the four corners of the axis-aligned box from `minxy` to `maxxy`, counterclockwise from `minxy`. */
  static BoundingBoxVerts(minxy: Vec2, maxxy: Vec2) {
    let va = new VertexArray2D();
    va.addVertex(minxy);
    va.addVertex(V2(maxxy.x, minxy.y));
    va.addVertex(maxxy);
    va.addVertex(V2(minxy.x, maxxy.y));
    return va;
  }

  /**
   * Returns an eight-point star outline (points at `outerRadius` on the axes, inner corners at `±innerRadius`),
   * optionally offset to `location`.
   */
  static Anchor(
    outerRadius: number = 25,
    innerRadius: number = 10,
    location?: Vec2
  ) {
    let verts = [
      new Vec2(innerRadius, innerRadius),
      new Vec2(0, outerRadius),
      new Vec2(-innerRadius, innerRadius),
      new Vec2(-outerRadius, 0),
      new Vec2(-innerRadius, -innerRadius),
      new Vec2(0, -outerRadius),
      new Vec2(innerRadius, -innerRadius),
      new Vec2(outerRadius, 0),
    ];
    if (location) {
      verts = verts.map((v) => {
        return v.plus(location);
      });
    }
    return VertexArray2D.FromLists(verts);
  }

  /**
   * Rebuilds an instance from serialized data (used by {@link ASerializableFromJSON}). This is the same as the
   * default `Object.assign(new this(), data)`, written out so that `@ASerializable`'s zero-argument-constructor
   * check doesn't warn about the constructor's two optional parameters.
   */
  static fromJSON(data: { [name: string]: any }) {
    return Object.assign(new this(), data);
  }

  /**
   * @param homogeneous_positions Optional flat list of positions, three numbers per vertex.
   * @param colors Optional flat list of colors, four numbers (rgba) per vertex. Creates a color attribute if given.
   */
  constructor(homogeneous_positions?: number[], colors?: number[]) {
    super();
    if (homogeneous_positions !== undefined) {
      this.position = new VertexPositionArray2DH(homogeneous_positions);
    } else {
      this.position = new VertexPositionArray2DH();
    }
    if(colors !== undefined){
      this.initColorAttribute();
      this.color.setElements(colors);
    }
  }

  /**
   * Returns an empty instance set up for rendering, with triangle indices and the requested attributes. Note the
   * parameter order differs from {@link VertexArray3D.CreateForRendering} (normals, uvs, colors).
   * @param hasColors Whether to add a color attribute (default true).
   * @param hasTextureCoords Whether to add a uv attribute (default true).
   * @param hasNormals Whether to add a normal attribute (default false).
   */
  static CreateForRendering(
      hasColors: boolean = true,
      hasTextureCoords: boolean = true,
      hasNormals: boolean = false,
  ) {
    let v = new this();
    v.indices = new VertexIndexArray(3);
    if (hasNormals) {
      v.normal = new VertexAttributeArray3D();
    }
    if (hasTextureCoords) {
      v.uv = new VertexAttributeArray2D();
    }
    if (hasColors) {
      v.initColorAttribute();
      // v.color = new VertexAttributeColorArray();
    }
    return v;
  }

  /** Appends one triangle's indices, creating `indices` first if needed. */
  addTriangleIndices(indices:number[]){
      if(this.indices === undefined || this.indices === null){
          this.initIndices()
      }
      this.indices.push(indices);
  }


  /** Creates an empty rgba color attribute (replacing any existing one). */
  initColorAttribute(){
    this.color = new VertexAttributeColorArray();
  }
  /** Creates an empty rgb color attribute (replacing any existing one). */
  initColor3DAttribute(){
    this.color = new VertexAttributeColor3DArray();
  }
  /** Creates an empty index array (replacing any existing one). */
  initIndices(vertsPerElement:number=3){
    this.indices = new VertexIndexArray(vertsPerElement);
  }

  /** Creates an empty uv attribute (replacing any existing one). */
  initUVAttribute(){
    this.uv = new VertexAttributeArray2D();
  }

  /** Appends a vertex. `color` is added only if given and the array has a color attribute. */
  addVertex(v: Vec2 | Vec3, color?: Color | Vec3 | Vec4) {
    this.position.push(v);
    if (color) {
      this.color?.push(color);
    }
  }

  /** Inserts a vertex at the front. `color` is added only if given and the array has a color attribute. */
  addVertexToFront(v: Vec2 | Vec3, color?: Color | Vec3 | Vec4){
    this.position.unshift(v);
    if (color) {
      this.color?.unshift(color);
    }
  }

  /** Inserts vertices at the front, keeping their order. Colors are added only if the array has a color attribute. */
  addVerticesToFront(positions: Vec2[] | Vec3[], colors?: Color[] | Vec3[] | Vec4[]) {
    this.position.unshiftArray(positions);
    if (colors) {
      this.color?.unshiftArray(colors)
    }
  }


  /** Returns a `new VertexArray2D([...])` expression with the raw position numbers. */
  toString() {
    let rstring = `new VertexArray2D([\n`;
    for (let e = 0; e < this.position.elements.length - 1; e++) {
      rstring = rstring + `${this.position.elements[e]},`;
    }
    rstring =
      rstring +
      `${this.position.elements[this.position.elements.length - 1]}])`;
    return rstring;
  }

  /**
   * Builds a vertex array from lists of positions (and, optionally, colors). The `this` parameter makes the result
   * the type of the class it is called on, so `Polygon2D.FromLists(...)` returns a `Polygon2D`, not a `VertexArray2D`.
   * @param positions The vertex positions.
   * @param colors Optional per-vertex colors, one per position.
   * @returns A new instance of the class this was called on.
   */
  static FromLists<T extends VertexArray2D>(this: new () => T, positions:Vec2[], colors?:Color[]): T {
    let v = new this();
    if(colors===undefined) {
      v.addVertices(positions);
    }else{
      v.initColorAttribute()
      v.addVertices(positions, colors);
    }
    return v;
  }

  /**
   * Returns a square of side `scale` centered at the origin, with uv coordinates from 0 to `wraps` and two
   * triangles.
   */
  static SquareXYUV(scale:number=1, wraps:number=1){
    let verts = new VertexArray2D();
    verts.position= new VertexPositionArray2DH();
    verts.position.push(V2(-0.5,-0.5).times(scale))
    verts.position.push(V2(0.5,-0.5).times(scale))
    verts.position.push(V2(0.5,0.5).times(scale))
    verts.position.push(V2(-0.5,0.5).times(scale))
    verts.uv = new VertexAttributeArray2D()
    verts.uv.push(V2(0,0).times(wraps));
    verts.uv.push(V2(1,0).times(wraps));
    verts.uv.push(V2(1,1).times(wraps));
    verts.uv.push(V2(0,1).times(wraps));
    verts.indices = new VertexIndexArray(3);
    verts.indices.push([0,1,2]);
    verts.indices.push([0,2,3]);
    return verts;
  }

  /**
   * Creates a new uv attribute (replacing any existing one) that gives each vertex a uv equal to its 2D position,
   * transformed by `textureTransform`. For example, a translation by (0.5, 0.5) maps a unit square centered at the
   * origin onto uvs from 0 to 1.
   * @param textureTransform A 2D homogeneous transform applied to each position as a point (default identity).
   */
  setUVToPositions(textureTransform?:Mat3){
    textureTransform = textureTransform??new Mat3();
    this.initUVAttribute()
    for(let vi=0;vi<this.length;vi++){
      // `Mat3.times(Vec2)` treats the position as the point (x, y, 1) and returns the transformed 2D point.
      this.uv.push(textureTransform.times(this.getPoint2DAt(vi)));
    }
  }

}
