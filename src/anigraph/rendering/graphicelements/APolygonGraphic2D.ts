import * as THREE from "three";
import { AGraphicElement } from "../graphicobject";
import {Color, Mat4, V4, Vec4} from "../../math";
import {VertexArray, VertexArray2D} from "../../geometry";
import {ALabel} from "../../base";
import {AMaterial} from "../material";
import {Float32BufferAttribute} from "three";



/**
 * A filled 2D polygon. The outline comes from the vertex positions, in order, and is triangulated with
 * `THREE.ShapeGeometry`, so the polygon may be concave.
 */
@ALabel("APolygonGraphic2D")
export class APolygonGraphic2D extends AGraphicElement {
  protected verts!: VertexArray2D;
  /** The `THREE.Mesh`. */
  get mesh():THREE.Mesh{
    return this._element as THREE.Mesh;
  }

  /**
   * @param verts Outline vertices, as a `VertexArray2D` or a flat number array. If omitted, call `init` later.
   * @param material Material or color (default: a random color). Only used if `verts` is given.
   */
  constructor(verts?:VertexArray2D|number[], material?:Color|THREE.Color|THREE.Material|THREE.Material[]|AMaterial){
    super();
    if(verts){
      this.init(
          (verts instanceof VertexArray2D)?verts:new VertexArray2D(verts),
          material?material:Color.RandomRGBA());
    }
  }

  /** Sets the geometry and material and creates the mesh. Throws if either is missing. */
  init(geometry?:THREE.BufferGeometry|VertexArray2D, material?:Color|THREE.Color|THREE.Material|THREE.Material[]|AMaterial) {
    super._initIfNotAlready(geometry, material);
  }

  /**
   * Sets texture coordinates by transforming each vertex position: `uv = (mat * p)`, homogenized, taking x and y.
   * `p` is `[x, y, z, 1]` for 3D positions, `[x, y, z, w]` for 4D (homogeneous) positions, and `[x, y, 0, 1]` for
   * 2D positions.
   */
  setTextureMatrix(mat:Mat4){
    let posattr = this.geometry.getAttribute('position');
    let vpositions = posattr.array;
    let uvs:number[] = [];
    let ndim = posattr.itemSize;
    for (let vi = 0; vi < posattr.count; vi++) {
      let p4:Vec4;
      if(ndim===3) {
        p4 = V4(vpositions[vi * ndim], vpositions[vi * ndim + 1], vpositions[vi * ndim + 2], 1);
      }else if(ndim===4){
        p4 = V4(vpositions[vi * ndim], vpositions[vi * ndim + 1], vpositions[vi * ndim + 2], vpositions[vi * ndim + 3]);
      }else{
        p4 = V4(vpositions[vi * ndim], vpositions[vi * ndim + 1], 0, 1);
      }
      let p4t = mat.times(p4).getHomogenized();
      uvs.push(p4t.x);
      uvs.push(p4t.y);
    }
    this.geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))

  }

  /**
   * Rebuilds the polygon from new outline vertices (a `VertexArray2D` or a flat number array). The vertex array's
   * attributes are also copied onto the new geometry.
   */
  setVerts2D(verts:VertexArray2D|number[]){
    let geometry:VertexArray2D;
    if(Array.isArray(verts)){
      geometry = new VertexArray2D(verts);
    }else if (verts instanceof VertexArray2D){
      geometry = verts;
    }else{
      throw new Error(`cannot set verts to unsupported type: ${verts}`);
    }
    if(this._geometry){
      this._geometry.dispose();
    }
    let shape = new THREE.Shape();
    if(geometry.length){
      shape.moveTo(geometry.position.elements[0], geometry.position.elements[1]);
      for (let v=1;v<geometry.length;v++){
        let vert =geometry.position.getAt(v);
        shape.lineTo(vert.x, vert.y);
      }
    }
    this._geometry = new THREE.ShapeGeometry(shape);
    if(verts instanceof VertexArray) {
      for (let attribute in verts.attributes) {
        // if (!(attribute in this._geometry.attributes)) {
          this._geometry.setAttribute(attribute, verts.getAttributeArray(attribute).BufferAttribute());
        // }
      }
    }
    if(this._element){
      this.mesh.geometry = this._geometry;
    }
  }
}
