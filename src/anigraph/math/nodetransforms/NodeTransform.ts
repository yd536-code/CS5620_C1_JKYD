//##################//--node transform possible parent class--\\##################
// <editor-fold desc="node transform possibel parent class">
import {Mat4, Matrix, Quaternion, Vec3, VectorBase} from "../linalg";
import { TransformationInterface} from "../TrasnformationInterface";
import * as THREE from "three";

/**
 * The shape shared by {@link NodeTransform2D} and {@link NodeTransform3D}: a transform stored as position, rotation,
 * scale, and anchor (PRSA), whose matrix is `P * R * S * A` (A is a translation by `-anchor`). The two classes
 * `implement` this class rather than extend it, so it only describes the members they have in common.
 * @typeParam VType The vector type for position/anchor/scale (`Vec2` or `Vec3`).
 * @typeParam MType The matrix type (`Mat3` or `Mat4`).
 */
abstract class NodeTransform<VType extends VectorBase, MType extends Matrix>
  implements TransformationInterface
{
  /** Where the anchor point ends up in the parent's coordinates. */
  position!: VType;
  /** The point, in the object's own coordinates, that rotation and scale happen about. */
  anchor!: VType;
  scale!: VType | number;
  /** The rotation (an angle in radians in 2D, a {@link Quaternion} in 3D). */
  rotation!: any;

  abstract clone():NodeTransform<VType, MType>;
  abstract getMatrix(): MType;
  abstract getMat4(): Mat4;

  abstract assignTo(threejsMat: THREE.Matrix4):void;

  /** Sets this transform from a matrix, best effort. See {@link NodeTransform2D.setWithMatrix}. */
  abstract setWithMatrix(m: MType, position?: VType, rotation?: any): void;
  /** Returns this transform as a {@link NodeTransform3D}. */
  abstract NodeTransform3D(): any;
  /** Returns this transform as a {@link NodeTransform2D}. */
  abstract NodeTransform2D(): any;

  abstract getPosition(): Vec3;
  abstract _getQuaternionRotation(): Quaternion;
  abstract _setQuaternionRotation(q: Quaternion):void;
  abstract setPosition(position: Vec3):void;
}
export { NodeTransform };

//</editor-fold>
//##################\\--node transform possible parent class--//##################
