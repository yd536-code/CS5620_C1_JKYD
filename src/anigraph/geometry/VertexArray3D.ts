import {V2, Vec2, V3, Vec3, V4, Vec4, Mat4, V4A} from "../math/linalg";
import {
  VertexAttributeArray,
  VertexAttributeArray2D,
  VertexAttributeArray3D,
  VertexAttributeArrayFromThreeJS, VertexAttributeColor3DArray, VertexAttributeColorArray,
} from "./VertexAttributeArray";
import { ASerializable} from "../base/aserial/ASerializable";
import { VertexArray } from "./VertexArray";
import { VertexIndexArray } from "./VertexIndexArray";
import { BoundingBox3D } from "./BoundingBox3D";
import { Color} from "../math";

// import { ATexture } from "../arender/ATexture";


/** The attributes of one vertex, as passed to {@link VertexArray3D.addTriangleWithAttributesCCW}. */
export interface VertexAttributes3D{
  position:Vec3;
  normal?:Vec3;
  color?:Color;
  uv?:Vec2;
}

/**
 * Vertex data for 3D geometry: `Vec3` positions plus optional normals, uvs, colors, and indices, with factory methods
 * for common shapes. Adding a vertex silently skips any attribute the array doesn't have, so set up the attributes
 * first (e.g., with `CreateForRendering`).
 */
@ASerializable("VertexArray3D")
export class VertexArray3D extends VertexArray<Vec3> {
  /** Creates an empty array with only a position attribute (no indices). */
  constructor() {
    super();
    this.position = new VertexAttributeArray3D();
  }

  /** Returns a {@link BoundingBox3D} of the positions. */
  getBounds(): BoundingBox3D {
    let b = new BoundingBox3D();
    b.boundVertexPositionArrray(this.position);
    return b;
  }

  /** The position attribute. */
  set position(value: VertexAttributeArray3D) {
    this.attributes["position"] = value;
  }
  get position() {
    return this.attributes["position"] as VertexAttributeArray3D;
  }

  /** Sets (or replaces) the attribute named `name`. */
  setAttributeArray(name: string, attributeArray: VertexAttributeArray<any>) {
    this.attributes[name] = attributeArray;
  }

  /** Copies a three.js `BufferGeometry`'s index buffer and all of its attributes. */
  static FromThreeJS(buffergeo: THREE.BufferGeometry) {
    let varray = new VertexArray3D();
    varray.indices = VertexIndexArray.FromThreeJS(buffergeo.index);
    for (let atrname in buffergeo.attributes) {
      varray.attributes[atrname] = VertexAttributeArrayFromThreeJS(
        buffergeo.attributes[atrname]
      );
    }
    return varray;
  }

  // static FromVertexArray2D(v2:VertexArray2D, transform:Mat4){
  //     let v3=new VertexArray3D();
  // }

  /**
   * Returns the unit normal of the triangle `A`, `B`, `C` (counterclockwise order): the normalized cross product of
   * the edges AB and AC. By the right-hand rule, it points toward a viewer who sees the vertices go counterclockwise.
   */
  static TriangleNormal(A: Vec3, B: Vec3, C: Vec3): Vec3 {
    return B.minus(A).cross(C.minus(A)).getNormalized();
  }

  /**
   * Appends a triangle with vertices `A`, `B`, `C` in counterclockwise order and its indices. Each vertex gets the
   * triangle's unit face normal (see {@link VertexArray3D.TriangleNormal}) if the array has normals. Requires
   * `indices` to exist.
   * @param uv Optional uvs, one per vertex.
   * @param color Optional colors, one per vertex. The given array is not modified.
   */
  addTriangleCCW(A: Vec3, B: Vec3, C: Vec3, uv?: Vec2[], color?: Vec4[]|Color[]) {
    let i = this.nVerts;
    let N = VertexArray3D.TriangleNormal(A, B, C);

    // `addVertex` accepts both `Color` and `Vec4`, so the colors can be passed through as they are.
    this.addVertex(A, N, uv ? uv[0] : undefined, color ? color[0] : undefined);
    this.addVertex(B, N, uv ? uv[1] : undefined, color ? color[1] : undefined);
    this.addVertex(C, N, uv ? uv[2] : undefined, color ? color[2] : undefined);

    this.addTriangleIndices(i, i + 1, i + 2);
  }

  /** Appends one triangle's indices. Requires `indices` to exist. */
  addTriangleIndices(a:number, b:number, c:number){
    this.indices.push([a,b,c]);
  }

  /**
   * Appends a triangle from three vertices' attributes, in counterclockwise order, and its indices.
   * Each vertex gets its own `uv` and `color`, if given.
   * @param calcNormals If true and the array has normals, a vertex without a `normal` gets the triangle's unit face
   * normal (see {@link VertexArray3D.TriangleNormal}). If false, no normals are added, even ones given in `v0`-`v2`.
   */
  addTriangleWithAttributesCCW(v0:VertexAttributes3D, v1:VertexAttributes3D, v2:VertexAttributes3D, calcNormals=true){
    // this.hasAttribute("")
    let i = this.nVerts;
    let A = v0["position"];
    let B = v1["position"];
    let C = v2["position"];

    let hasNormal = this.hasNormal;

    let normals:(Vec3|undefined)[] = [];
    if(calcNormals && hasNormal) {
      let N = VertexArray3D.TriangleNormal(A, B, C);
      normals.push(v0["normal"]??N);
      normals.push(v1["normal"]??N);
      normals.push(v2["normal"]??N);
    }else{
      normals = [undefined, undefined, undefined];
    }

    this.addVertex(A, normals[0], v0["uv"], v0["color"]);
    this.addVertex(B, normals[1], v1["uv"], v1["color"]);
    this.addVertex(C, normals[2], v2["uv"], v2["color"]);
    this.indices.push([i, i + 1, i + 2]);
  }

  // addTriangleCCW(A: Vec3, B: Vec3, C: Vec3, uv?: Vec2[], color?: Vec4[]) {
  //   let i = this.nVerts;
  //   let AB = B.minus(A);
  //   let AC = C.minus(A);
  //   let N = AB.getNormalized().cross(AC.getNormalized());
  //
  //   let colorv=color;
  //   // if(colorv !== undefined) {
  //   //   for(let c=0; c<colorv?.length;c++) {
  //   //     if (colorv[c] instanceof Color) {
  //   //       colorv[c] = (colorv[c] as Color).Vec4;
  //   //     }
  //   //   }
  //   // }
  //
  //   this.addVertex(A, N, uv ? uv[0] : undefined, colorv ? colorv[0] : undefined);
  //   this.addVertex(B, N, uv ? uv[1] : undefined, colorv ? colorv[1] : undefined);
  //   this.addVertex(C, N, uv ? uv[2] : undefined, colorv ? colorv[2] : undefined);
  //
  //   this.indices.push([i, i + 1, i + 2]);
  // }

  /**
   * Returns three colored line segments from the origin, `scale` long: red along +x, green along +y, and blue
   * along -z. Indices are pairs (`VertsPerElement` 2).
   */
  static Axis(scale = 1) {
    let o = V3(0, 0, 0);
    let x = V3(scale, 0, 0);
    let y = V3(0, scale, 0);
    let nz = V3(0, 0, -scale);
    let verts = VertexArray3D.CreateForRendering(false, false, true);
    verts.addVertex(o, undefined, undefined, Color.FromString("#ff0000"));
    verts.addVertex(x, undefined, undefined, Color.FromString("#ff0000"));
    verts.addVertex(o, undefined, undefined, Color.FromString("#00ff00"));
    verts.addVertex(y, undefined, undefined, Color.FromString("#00ff00"));
    verts.addVertex(o, undefined, undefined, Color.FromString("#0000ff"));
    verts.addVertex(nz, undefined, undefined, Color.FromString("#0000ff"));
    verts.indices = new VertexIndexArray(2);
    verts.indices.push([0, 1, 2, 3, 4, 5]);
    return verts;
  }

  /**
   * Returns four triangles (a pyramid without its base) from the origin to the corners of the view frustum
   * described by projection matrix `P`, where the frustum meets the plane z = -`imagePlaneDepth`. Has normals and
   * indices.
   */
  static FrustumFromProjectionMatrix(P: Mat4, imagePlaneDepth = 100) {
    let imagePlaneNDC = 0.0;
    let baseNDC = [
      V4(-1, -1, imagePlaneNDC, 1),
      V4(1, -1, imagePlaneNDC, 1),
      V4(1, 1, imagePlaneNDC, 1),
      V4(-1, 1, imagePlaneNDC, 1),
    ];

    let PInv = P.getInverse();
    let baseV = baseNDC.map((v: Vec4) => {
      return PInv.times(v);
    });

    let verts = new VertexArray3D();
    verts.normal = new VertexAttributeArray3D();
    verts.indices = new VertexIndexArray(3);

    for (let i = 0; i < 3; i++) {
      verts.addTriangleCCW(
        V3(0, 0, 0),
        baseV[i].Point3D.getHomogenized().times(-imagePlaneDepth),
        baseV[i + 1].Point3D.getHomogenized().times(-imagePlaneDepth)
      );
    }
    verts.addTriangleCCW(
      V3(0, 0, 0),
      baseV[3].Point3D.getHomogenized().times(-imagePlaneDepth),
      baseV[0].Point3D.getHomogenized().times(-imagePlaneDepth)
    );
    return verts;
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

  /** Creates an empty normal attribute (replacing any existing one). */
  initNormalAttribute(){
    this.normal = new VertexAttributeArray3D();
  }


  /**
   * Returns an empty instance of the class it's called on, with triangle indices and the requested attributes.
   * Note the parameter order differs from {@link VertexArray2D.CreateForRendering} (colors, uvs, normals).
   * @param hasNormals Whether to add a normal attribute (default true).
   * @param hasTextureCoords Whether to add a uv attribute (default true).
   * @param hasColors Whether to add an rgba color attribute (default false).
   */
  static CreateForRendering(
    hasNormals: boolean = true,
    hasTextureCoords: boolean = true,
    hasColors: boolean = false
  ) {
    let v = new this();
    // v.indices = new VertexIndexArray(3);
    v.initIndices()
    if (hasNormals) {
      v.initNormalAttribute();
    }
    if (hasTextureCoords) {
      v.initUVAttribute();
    }
    if (hasColors) {
      v.initColorAttribute();
    }
    return v;
  }


  /**
   * Returns a square of side `scale` in the xy-plane centered at the origin, facing +z, with uvs from 0 to `wraps`
   * and two triangles. Every normal is the unit vector (0, 0, 1).
   */
  static SquareXYUV(scale: number = 1, wraps: number = 1) {
    let verts = new VertexArray3D();
    // verts.position = new VertexAttributeArray3D();
    verts.position.push(V3(-0.5, -0.5, 0.0).times(scale));
    verts.position.push(V3(0.5, -0.5, 0.0).times(scale));
    verts.position.push(V3(0.5, 0.5, 0.0).times(scale));
    verts.position.push(V3(-0.5, 0.5, 0.0).times(scale));
    // verts.uv = new VertexAttributeArray2D();
    verts.initUVAttribute();
    verts.uv.push(V2(0, 0).times(wraps));
    verts.uv.push(V2(1, 0).times(wraps));
    verts.uv.push(V2(1, 1).times(wraps));
    verts.uv.push(V2(0, 1).times(wraps));

    // verts.normal = new VertexAttributeArray3D();
    verts.initNormalAttribute();
    verts.normal.push(V3(0.0, 0.0, 1.0));
    verts.normal.push(V3(0.0, 0.0, 1.0));
    verts.normal.push(V3(0.0, 0.0, 1.0));
    verts.normal.push(V3(0.0, 0.0, 1.0));

    // verts.indices = new VertexIndexArray(3);
    verts.initIndices();
    verts.indices.push([0, 1, 2]);
    verts.indices.push([0, 2, 3]);
    return verts;
  }

  /**
   * Returns a `width` by `height` grid in the xy-plane centered at the origin, split into
   * `widthSegments` x `heightSegments` cells (two triangles each), with +z normals, uvs from 0 to `textureWraps`
   * (default (1, 1)), and every vertex set to `color` (default white).
   */
  static IndexedGrid(
    width: number = 1,
    height: number = 1,
    widthSegments: number = 1,
    heightSegments: number = 1,
    textureWraps?:Vec2,
    color?: Color
  ) {
    // let width:number=1, height:number=1, widthSegments:number=1,heightSegments:number=1;

    color = color ?? Color.FromString("#ffffff");

    if(textureWraps === undefined){
      textureWraps = V2(1, 1);
    }

    let halfW = width * 0.5;
    let halfH = height * 0.5;
    // let's use normals, texture coords, and colors...
    let v = VertexArray3D.CreateForRendering(true, true, true);
    for (let y = 0; y < heightSegments + 1; y++) {
      for (let x = 0; x < widthSegments + 1; x++) {
        v.addVertex(
          V3(
            -halfW + (x / widthSegments) * width,
            -halfH + (y / heightSegments) * height,
            0
          ),
          V3(0, 0, 1),
          V2(x*textureWraps.x / widthSegments, y*textureWraps.y / heightSegments),
          color
        );
      }
    }

    for (let y = 0; y < heightSegments; y++) {
      for (let x = 0; x < widthSegments; x++) {
        v.indices.push([
          x + y * (widthSegments + 1),
          x + 1 + y * (widthSegments + 1),
          x + 1 + (y + 1) * (widthSegments + 1),
        ]);
        v.indices.push([
          x + 1 + (y + 1) * (widthSegments + 1),
          x + (y + 1) * (widthSegments + 1),
          x + y * (widthSegments + 1),
        ]);
      }
    }
    return v;
  }

  // static VertsForBounds2D(bound:BoundingBox3D){
  //     let verts = new VertexArray3D();
  //     verts.position= new VertexAttributeArray3D();
  //     verts.position.push(V3(-0.5*aspect,-0.5,0.0).times(scale))
  //     verts.position.push(V3(0.5*aspect,-0.5,0.0).times(scale))
  //     verts.position.push(V3(0.5*aspect,0.5,0.0).times(scale))
  //     verts.position.push(V3(-0.5*aspect,0.5,0.0).times(scale))
  //     verts.uv = new VertexAttributeArray2D()
  //     verts.uv.push(V2(0,0));
  //     verts.uv.push(V2(1,0));
  //     verts.uv.push(V2(1,1));
  //     verts.uv.push(V2(0,1));
  //
  //     verts.normal = new VertexAttributeArray3D();
  //     verts.normal.push(V3(0.0,0.0,-1.0).times(scale))
  //     verts.normal.push(V3(0.0,0.0,-1.0).times(scale))
  //     verts.normal.push(V3(0.0,0.0,-1.0).times(scale))
  //     verts.normal.push(V3(0.0,0.0,-1.0).times(scale))
  //
  //     verts.indices = new VertexIndexArray(3);
  //     verts.indices.push([0,1,2]);
  //     verts.indices.push([0,2,3]);
  //     return verts;
  // }

  /**
   * Returns a box from `minPoint` to `maxPoint`: six faces of four vertices each, with uvs and two triangles per face.
   * Each face's vertices get that face's outward unit normal, and each face's triangles are wound counterclockwise
   * as seen from outside the box, so they agree with the normal.
   */
  static Box3D(minPoint:Vec3, maxPoint:Vec3) {
    // let va = new VertexArray3D();
    let va = VertexArray3D.CreateForRendering(true, true)
    let corners = [minPoint.clone(),
      V3(maxPoint.x, minPoint.y, minPoint.z),
      V3(maxPoint.x, maxPoint.y, minPoint.z),
      V3(minPoint.x, maxPoint.y, minPoint.z),
      V3(minPoint.x, minPoint.y, maxPoint.z),
      V3(maxPoint.x, minPoint.y, maxPoint.z),
        maxPoint.clone(),
      V3(minPoint.x, maxPoint.y, maxPoint.z)
    ];

    va.indices = new VertexIndexArray(3);
    let startIndex = 0;
    /**
     * Adds one face from its four corners, given in order around the face. The normal comes from the winding
     * (see `TriangleNormal`), so each call below lists the corners counterclockwise as seen from outside the box.
     */
    function addSide(verts:Vec3[]){
      let si = startIndex;
      let normal = VertexArray3D.TriangleNormal(verts[0], verts[1], verts[2]);
      va.addVertex(verts[0],normal,V2(0,1));
      va.addVertex(verts[1],normal,V2(1,1));
      va.addVertex(verts[2],normal,V2(1,0));
      va.addVertex(verts[3],normal,V2(0,0));
      va.indices.push([si,si+1,si+2]);
      va.indices.push([si,si+2,si+3]);
      startIndex = startIndex+4;
    }

    // min-z face and min-x face: listed in reverse so they wind counterclockwise from outside (outward normals).
    addSide([corners[3],corners[2],corners[1],corners[0]])
    addSide([corners[0],corners[1],corners[5],corners[4]])
    addSide([corners[4],corners[7],corners[3],corners[0]])

    addSide([corners[4],corners[5],corners[6],corners[7]])
    addSide([corners[2],corners[3],corners[7],corners[6]])
    addSide([corners[1],corners[2],corners[6],corners[5]])
    return va;
  }


  /** Returns a triangle mesh of a bounding box (see {@link BoundingBox3D.GetBoxTriangleMeshVerts}). */
  static MeshVertsForBoundingBox3D(bounds: BoundingBox3D) {
    return bounds.GetBoxTriangleMeshVerts();
  }

  /** Returns a triangle mesh of a three.js object's bounding box. */
  static BoundingBoxMeshVertsForObject3D(obj: THREE.Object3D) {
    return BoundingBox3D.FromTHREEJSObject(obj).GetBoxTriangleMeshVerts();
  }

  /**
   * Returns a sphere (or part of one) centered at the origin, with normals, uvs, and triangle indices. Slightly
   * modified from three.js's `SphereGeometry`.
   * @param radius
   * @param widthSegments Segments around the y axis (at least 3).
   * @param heightSegments Segments from pole to pole (at least 2).
   * @param phiStart Start angle around the y axis.
   * @param phiLength Angle swept around the y axis.
   * @param thetaStart Start angle down from the +y pole.
   * @param thetaLength Angle swept down from `thetaStart`.
   * @param ccw Triangle winding: true (default) uses three.js's order; false reverses it.
   */
  static Sphere(
    radius = 1,
    widthSegments = 32,
    heightSegments = 16,
    phiStart = 0,
    phiLength = Math.PI * 2,
    thetaStart = 0,
    thetaLength = Math.PI,
    ccw:boolean = true
  ) {
    let sphere = VertexArray3D.CreateForRendering(true, true);
    VertexArray3D._AddSphereGrid(sphere, radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength, ccw);
    return sphere;
  }


  /**
   * A full sphere (see `Sphere`) with a per-vertex color attribute.
   * @param radius
   * @param widthSegments
   * @param heightSegments
   * @param color The color of every vertex; if omitted, each vertex gets its own `Color.RandomRGBA()`.
   */
  static ColoredSphere(
      radius = 1,
      widthSegments = 32,
      heightSegments = 16,
      color?:Color
  ) {
    let sphere = VertexArray3D.CreateForRendering(true, true, true);
    VertexArray3D._AddSphereGrid(sphere, radius, widthSegments, heightSegments, 0, Math.PI * 2, 0, Math.PI, true,
      () => color ?? Color.RandomRGBA());
    return sphere;
  }

  /**
   * The vertex/index grid shared by `Sphere` and `ColoredSphere`, slightly modified from ThreeJS.
   * @param vertexColor If given, called once per vertex for that vertex's color.
   */
  private static _AddSphereGrid(
    sphere: VertexArray3D,
    radius: number,
    widthSegments: number,
    heightSegments: number,
    phiStart: number,
    phiLength: number,
    thetaStart: number,
    thetaLength: number,
    ccw: boolean,
    vertexColor?: () => Color
  ) {
    widthSegments = Math.max(3, Math.floor(widthSegments));
    heightSegments = Math.max(2, Math.floor(heightSegments));
    const thetaEnd = Math.min(thetaStart + thetaLength, Math.PI);
    let index = 0;
    const grid = [];
    const vertex = new Vec3();
    // generate vertices, normals and uvs

    for (let iy = 0; iy <= heightSegments; iy++) {
      const verticesRow = [];
      const v = iy / heightSegments;
      // special case for the poles
      let uOffset = 0;
      if (iy === 0 && thetaStart === 0) {
        uOffset = 0.5 / widthSegments;
      } else if (iy === heightSegments && thetaEnd === Math.PI) {
        uOffset = -0.5 / widthSegments;
      }
      for (let ix = 0; ix <= widthSegments; ix++) {
        const u = ix / widthSegments;
        // vertex
        vertex.x =
          -radius *
          Math.cos(phiStart + u * phiLength) *
          Math.sin(thetaStart + v * thetaLength);
        vertex.y = radius * Math.cos(thetaStart + v * thetaLength);
        vertex.z =
          radius *
          Math.sin(phiStart + u * phiLength) *
          Math.sin(thetaStart + v * thetaLength);

        // uv
        let uv = V2(u + uOffset, 1 - v);

        verticesRow.push(index++);
        sphere.addVertex(vertex, vertex.getNormalized(), uv, vertexColor ? vertexColor() : undefined);
      }
      grid.push(verticesRow);
    }

    // indices

    for (let iy = 0; iy < heightSegments; iy++) {
      for (let ix = 0; ix < widthSegments; ix++) {
        const a = grid[iy][ix + 1];
        const b = grid[iy][ix];
        const c = grid[iy + 1][ix];
        const d = grid[iy + 1][ix + 1];
        if (iy !== 0 || thetaStart > 0) {
          if(!ccw) {
            sphere.indices.push([d, b, a]);
          }else{
            sphere.indices.push([a, b, d]);
          }
        }
        if (iy !== heightSegments - 1 || thetaEnd < Math.PI) {
          if(!ccw){
            sphere.indices.push([d, c, b]);
          }else{
            sphere.indices.push([b, c, d]);
          }
        }
      }
    }
  }


  // static SpriteGeometry(texture: ATexture, scale: number = 100) {
  //   let verts = new VertexArray3D();
  //   let aspect = texture.width / texture.height;
  //   verts.position = new VertexAttributeArray3D();
  //   verts.position.push(V3(-0.5 * aspect, -0.5, 0.0).times(scale));
  //   verts.position.push(V3(0.5 * aspect, -0.5, 0.0).times(scale));
  //   verts.position.push(V3(0.5 * aspect, 0.5, 0.0).times(scale));
  //   verts.position.push(V3(-0.5 * aspect, 0.5, 0.0).times(scale));
  //   verts.uv = new VertexAttributeArray2D();
  //   verts.uv.push(V2(0, 0));
  //   verts.uv.push(V2(1, 0));
  //   verts.uv.push(V2(1, 1));
  //   verts.uv.push(V2(0, 1));
  //
  //   verts.normal = new VertexAttributeArray3D();
  //   verts.normal.push(V3(0.0, 0.0, -1.0).times(scale));
  //   verts.normal.push(V3(0.0, 0.0, -1.0).times(scale));
  //   verts.normal.push(V3(0.0, 0.0, -1.0).times(scale));
  //   verts.normal.push(V3(0.0, 0.0, -1.0).times(scale));
  //
  //   verts.indices = new VertexIndexArray(3);
  //   verts.indices.push([0, 1, 2]);
  //   verts.indices.push([0, 2, 3]);
  //   return verts;
  // }

  /**
   * Appends a vertex. Each of `normal`, `uv`, and `color` is added only if given and the array has that attribute;
   * otherwise it is silently skipped.
   */
  addVertex(v: Vec3, normal?: Vec3, uv?: Vec2, color?: Color | Vec4) {
    this.position.push(v);
    if (color) {
      this.color?.push(V4A(...color.elements));
    }
    if (normal) {
      this.normal?.push(V3(...normal.elements));
    }
    if (uv) {
      this.uv?.push(V2(...uv.elements));
    }
  }

  /** Returns a position-only vertex array with the given points. */
  static FromVec3List(verts: Vec3[]) {
    let va = new VertexArray3D();
    for (let v of verts) {
      va.addVertex(v);
    }
    return va;
  }
}
