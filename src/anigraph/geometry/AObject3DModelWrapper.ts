import * as THREE from "three";
import {V3, Mat4, NodeTransform3D} from "../math";
import type {TransformationInterface} from "../math";
import {HasBounds} from "./HasBounds";
import {VertexArray3D} from "./VertexArray3D";
import {BoundingBox3D} from "./BoundingBox3D";
import { ref } from "valtio";
import {AObject, ALabel} from "../base";
import {GetDeepTHREEJSClone, ATexture} from "../rendering";

/**
 * Wraps a loaded three.js object (a `THREE.Object3D`, e.g., a model loaded from a file), with a source transform
 * and helpers for bounds, textures, and making copies for the scene. The wrapped object's `matrix` is set from
 * the source transform (`matrixAutoUpdate` is turned off).
 * https://threejs.org/docs/index.html?q=Object3D#api/en/core/Object3D
 */
@ALabel("AObject3DModelWrapper")
export class AObject3DModelWrapper extends AObject implements HasBounds {
  /** The wrapped three.js object. */
  public object: THREE.Object3D;
  protected _sourceTransform: TransformationInterface;

  /**
   * A transformation of the original asset into some new default coordinates. This is generally used, for example, if the asset was built with an x-z ground plane but you are using an x-y ground plane.
   * Setting it also copies its matrix into `object.matrix`. The identity by default.
   * @returns {TransformationInterface}
   */
  get sourceTransform() :TransformationInterface{
    return this._sourceTransform;
  }

  /** @param object The three.js object to wrap. Its `uuid` becomes this wrapper's uid. */
  constructor(object: THREE.Object3D) {
    super(object.uuid);
    this.object = ref(object);
    this.object.matrixAutoUpdate = false;

    // default the source transform to the identity
    this._sourceTransform = new NodeTransform3D();
  }

  /**
   * Returns the wrapped object and all its descendants that have a `material` property. Useful for setting the
   * materials of loaded objects.
   * @returns {Object3D[]}
   */
  getThreeJSDescendantsThatHaveMatProperty(){
    let objs:THREE.Object3D[] = [];
    function getRelevantChildren(obj:THREE.Object3D){
      if ('material' in obj) {
        objs.push(obj);
      }
      if('children' in obj) {
        for (let c of obj.children) {
          getRelevantChildren(c);
        }
      }
    }
    getRelevantChildren(this.object);
    return objs;
  }

  /** Returns the first mesh named `elementName` in the wrapped object's hierarchy (depth first), or undefined. */
  getMeshElementByName(elementName:string){
    function _getElement(p:THREE.Object3D):THREE.Object3D|undefined{
      if(p.type === "Mesh") {
        if (p.name === elementName) {
          return p;
        }
      }
      for(let c of p.children){
        let cel:THREE.Object3D|undefined = _getElement(c);
        if(cel){
          return cel;
        }
      }
    }
    return _getElement(this.object)
  }


  /**
   * Returns a new Object3D instance based on the asset, with its matrix set to the source transform.
   * @param wrapInGroup Whether to wrap the object in a group. This is sometimes what you want if the object is a mesh and you want to create a scene graph node.
   * @param deepCopy If true, copies geometry and materials too. Otherwise a mesh shares the asset's geometry and
   * material, and other objects are copied with three.js's `clone()`.
   * @param scale Optional uniform scale, applied before the source transform.
   * @returns {Object3D | Group}
   */
  getNewSceneObject(wrapInGroup:boolean=false, deepCopy?:boolean, scale?:number) {
    let obj: THREE.Object3D;
    if(deepCopy){
      obj = GetDeepTHREEJSClone(this.object);
    }else {
      if (this.object instanceof THREE.Mesh) {
        obj = new THREE.Mesh(this.object.geometry, this.object.material);
      } else {
        obj = this.object.clone();
      }
    }
    obj.matrixAutoUpdate = false;
    if(scale===undefined) {
      this.sourceTransform.assignTo(obj.matrix);
    }else{
      (this.sourceTransform.getMatrix() as Mat4).times(Mat4.Scale3D(scale)).assignTo(obj.matrix);
    }
    if(wrapInGroup){
      let group = new THREE.Group();
      group.matrixAutoUpdate=false;
      group.add(obj);
      return group;
    }else {
      return obj;
    }
  }

  /**
   * Returns the color (`map`) and normal (`normalMap`) textures of the object's material, wrapped as
   * {@link ATexture}s, under the keys `color` and `normal`. For a group, it uses the first mesh found anywhere
   * inside it. Any three.js material with those texture slots works, including `MeshStandardMaterial` (which
   * GLTFLoader creates), `MeshPhysicalMaterial` and `MeshPhongMaterial`. A texture the material doesn't have, or
   * an object with no mesh, gives `undefined` for that key.
   * @returns {{color: ATexture | undefined, normal: ATexture | undefined}}
   */
  getTextures(): {color: ATexture | undefined, normal: ATexture | undefined} {
    // Find the first mesh: the object itself, or the first one inside it (depth first).
    let objectMesh: THREE.Mesh | undefined;
    this.object.traverse((child: THREE.Object3D) => {
      if (objectMesh === undefined && child instanceof THREE.Mesh) {
        objectMesh = child;
      }
    });
    // A mesh can have an array of materials; use the first one.
    const rawMaterial = objectMesh?.material;
    const material: any = Array.isArray(rawMaterial) ? rawMaterial[0] : rawMaterial;
    const map: THREE.Texture | undefined = material?.map ?? undefined;
    const normalMap: THREE.Texture | undefined = material?.normalMap ?? undefined;
    return {
      color: map ? new ATexture(map, 'diffuse') : undefined,
      normal: normalMap ? new ATexture(normalMap, 'normal') : undefined,
    };
  }

  /**
   * Sets the uniform scale of the source transform and updates `object.matrix`. The source transform is changed in
   * place, so an {@link AGeometrySet} that shares it sees the change too.
   *
   * If the source transform is a matrix rather than a {@link NodeTransform3D}, this warns and first replaces it
   * with `NodeTransform3D.FromMatrix(matrix)`: rotation and scale come from the matrix, the anchor is zero, and the
   * position is the matrix's translation. The conversion is best effort; a matrix with shear can't be reproduced
   * exactly (a warning is logged once per session). The new scale then replaces the decomposed one.
   * @param sourceScale The new uniform scale.
   */
  setSourceScale(sourceScale:number){
    // this._sourceTransform.scale=sourceScale;
    if(this._sourceTransform instanceof NodeTransform3D){
      this._sourceTransform.scale = sourceScale
    }else{
      console.warn("Setting source scale when source transform is not a NodeTransform!")
      this._sourceTransform = NodeTransform3D.FromMatrix(this._sourceTransform as Mat4);
      (this._sourceTransform as NodeTransform3D).scale = sourceScale;
    }
    // Mat4.Scale3D(sourceScale).assignTo(this.object.matrix);
    this._sourceTransform.getMatrix().assignTo(this.object.matrix);
  }

  /**
   * Returns a triangle mesh of the wrapped object's bounding box.
   * @returns {VertexArray3D}
   */
  getBoundingBoxVertexArray() {
    return VertexArray3D.BoundingBoxMeshVertsForObject3D(this.object);
  }

  set sourceTransform(v: TransformationInterface) {
    this._sourceTransform = v;
    this._sourceTransform.assignTo(this.object.matrix);
  }

  /** Returns the wrapped object's bounds as computed by `THREE.Box3.setFromObject` (world space). */
  getBounds(): BoundingBox3D {
    let threebox = new THREE.Box3().setFromObject(this.object);
    let bounds = new BoundingBox3D();
    bounds.minPoint = V3(threebox.min.x, threebox.min.y, threebox.min.z);
    bounds.maxPoint = V3(threebox.max.x, threebox.max.y, threebox.max.z);
    return bounds;
  }
}
