import {Mat3, Mat4, Matrix, Quaternion, Vec3} from "./linalg";
import * as THREE from "three";

/**
 * What every transform in AniGraph can do, whether it is stored as a matrix ({@link Mat3}/{@link Mat4}) or as
 * position/rotation/scale/anchor ({@link NodeTransform2D}/{@link NodeTransform3D}).
 */
export interface TransformationInterface {
    /** Returns the transform as a matrix (a `Mat3` for 2D transforms, a `Mat4` for 3D ones). */
    getMatrix(): Matrix;
    /** Returns the transform as a 4x4 matrix. */
    getMat4(): Mat4;
    /** Copies this transform's 4x4 matrix into a three.js matrix. */
    assignTo(threejsMat:THREE.Matrix4):void;
    /** Sets the translation part of the transform. */
    setPosition(position:Vec3):void;
    /** Returns the translation part of the transform (z is 0 for 2D transforms). */
    getPosition():Vec3;
    /** Returns a copy of this transform. */
    clone():TransformationInterface;
    /** Returns the rotation part of the transform as a quaternion. Not supported by every transform. */
    _getQuaternionRotation():Quaternion;
    /** Sets the rotation part of the transform from a quaternion. Not supported by every transform. */
    _setQuaternionRotation(q:Quaternion):void;
}


/** A 3D transform: a {@link TransformationInterface} that can also be applied to a 3D point. */
export interface TransformationInterface3D extends TransformationInterface{
    /** Returns the point `p` transformed by this transform. */
    appliedToPoint(p:Vec3):Vec3;
}

/** A 2D transform: a {@link TransformationInterface} whose matrix is a 3x3 homogeneous 2D matrix. */
export interface TransformationInterface2D extends TransformationInterface{
    getMatrix(): Mat3;
}
