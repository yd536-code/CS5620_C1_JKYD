import { BoundingBox2D} from "./BoundingBox2D";
import { VertexArray} from "./VertexArray";
import { BoundingBox3D} from "./BoundingBox3D";
import { AObject3DModelWrapper } from "./AObject3DModelWrapper";
import * as THREE from "three";
import { Color} from "../math";
import { NodeTransform3D} from "../math";
import {HasBounds} from "./HasBounds";
import {AObject, ASerializable} from "../base";
import {TransformationInterface} from "../math";

enum GeometrySetEnum {
  VertsElementName = "verts",
}

/**
 * A named collection of geometry ({@link HasBounds} objects such as vertex arrays and
 * {@link AObject3DModelWrapper}s) with a shared source transform. Used as a node model's `geometry`.
 */
@ASerializable("AGeometrySet")
export class AGeometrySet extends AObject implements HasBounds {
  _sourceTransform: TransformationInterface;
  /** The members, by name (members added with `addMember` are stored under their uid). */
  public members: { [name: string]: HasBounds } = {};
  // protected _uid: string;
  // get uid() {
  //   return this._uid;
  // }



  /**
   * Transform from each loaded asset's own coordinates into the coordinates the app uses. Setting it gives every
   * {@link AObject3DModelWrapper} member its own copy (see `updateTransform`).
   */
  get sourceTransform() {
    return this._sourceTransform;
  }
  // get sourceScale() {
  //   // this assumes we don't use non-uniform scales...
  //   return this._sourceTransform.scale.x;
  // }
  // set sourceScale(s: number) {
  //   this.sourceTransform.scale = s;
  //   for (let m in this.members) {
  //     let mo = this.members[m];
  //     if (mo instanceof AObject3DModelWrapper) {
  //       // mo.setSourceScale(this.sourceScale);
  //       mo.sourceTransform = this.sourceTransform;
  //     }
  //   }
  // }

  /** Same as setting `sourceTransform`. */
  setSourceTransform(v: NodeTransform3D) {
    this.sourceTransform = v;
  }

  /**
   * Gives every {@link AObject3DModelWrapper} member a copy (clone) of this set's `sourceTransform`. Because each
   * member has its own copy, changing one member's source transform in place (e.g., with
   * {@link AObject3DModelWrapper.setSourceScale}) doesn't change the set or the other members. It also means that
   * changing the set's `sourceTransform` in place does nothing to the members: assign a new transform to
   * `sourceTransform` (or call this method) to pass it on.
   */
  updateTransform() {
    for (let m in this.members) {
      let mo = this.members[m];
      if (mo instanceof AObject3DModelWrapper) {
        mo.sourceTransform = this.sourceTransform.clone();
      }
    }
  }

  set sourceTransform(v: TransformationInterface) {
    this._sourceTransform = v;
    this.updateTransform();
  }

  /** Returns the members as an array. */
  getMemberList() {
    return Object.values(this.members);
  }

  constructor() {
    super();
    this._sourceTransform = new NodeTransform3D();
  }

  /** Stores `element` under `name`, replacing any member with that name. */
  setMember(name: string, element: HasBounds) {
    this.members[name] = element;
  }

  /**
   * Adds a member under its uid. A three.js object is wrapped in an {@link AObject3DModelWrapper}. Logs an error
   * (and replaces the old member) if the same member (same uid) was already added. Every vertex array and model
   * wrapper has its own uid, so adding different ones keeps them all.
   * @param member A {@link HasBounds} object (e.g., a vertex array), a three.js object, or a `THREE.BufferGeometry`
   * (wrapped in a mesh with a random color).
   */
  addMember(member: HasBounds | THREE.Object3D | THREE.BufferGeometry) {
    let element: HasBounds;

    //the member might be geometry only
    if (member instanceof THREE.BufferGeometry) {
      let threemesh = new THREE.Mesh(
        member,
        new THREE.MeshBasicMaterial({
          color: Color.RandomRGBA().asThreeJS(),
          transparent: true,
          opacity: 1,
          side: THREE.DoubleSide,
          depthWrite: true,
        })
      );
      element = new AObject3DModelWrapper(threemesh);
    } else if (member instanceof THREE.Object3D) {
      element = new AObject3DModelWrapper(member);
    } else {
      element = member;
    }
    if (this.members[element.uid] !== undefined) {
      console.error(`Geometry member with uid ${element.uid} already added!`);
    }
    this.members[element.uid] = element;
  }

  // getBounds2D(cameraMatrix?:Mat4){
  //     let b = new BoundingBox2D();
  //     for (let e in this.members){
  //         b.boundBounds(this.members[e].getBounds2D(cameraMatrix));
  //     }
  //     return b;
  // }

  /** Returns a 3D box that contains the bounds of every member (2D bounds are converted to 3D). */
  getBounds() {
    let b = new BoundingBox3D();
    for (let e in this.members) {
      let nb = this.members[e].getBounds();
      if (nb instanceof BoundingBox2D) {
        nb = BoundingBox3D.FromBoundingBox2D(nb);
      }
      b.boundBounds(nb);
    }
    return b;
  }

  /** The member stored under the name `"verts"`, as a vertex array. */
  get verts() {
    return this.members[
      GeometrySetEnum.VertsElementName
    ] as unknown as VertexArray<any>;
  }
  set verts(v: VertexArray<any>) {
    // @ts-ignore
    this.members[GeometrySetEnum.VertsElementName] = v;
  }
}
