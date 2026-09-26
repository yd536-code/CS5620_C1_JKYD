import * as THREE from "three";
import {ADisplayObject} from "../ADisplayObject";
import {Mat3, Mat4} from "../../math";

/** The Three.js implementation of {@link ADisplayObject}: wraps a `THREE.Object3D`. */
export class AGLDisplayObject implements ADisplayObject {
    protected _obj: THREE.Object3D;

    constructor(obj: THREE.Object3D) {
        this._obj = obj;
    }

    /** The wrapped object's Three.js `uuid`. */
    get uid(): string {
        return this._obj.uuid;
    }

    /** The wrapped `THREE.Object3D`. */
    get nativeObject(): THREE.Object3D {
        return this._obj;
    }

    /** Whether the object is drawn. */
    get visible(): boolean {
        return this._obj.visible;
    }

    set visible(value: boolean) {
        this._obj.visible = value;
    }

    /** Adds `child` as a child object. Throws if `child` is not an `AGLDisplayObject`. */
    add(child: ADisplayObject): void {
        if (child instanceof AGLDisplayObject) {
            this._obj.add(child._obj);
        } else {
            throw new Error("Cannot add non-Three.js display object to AGLDisplayObject");
        }
    }

    /** Removes `child` if it is an `AGLDisplayObject`; otherwise does nothing. */
    remove(child: ADisplayObject): void {
        if (child instanceof AGLDisplayObject) {
            this._obj.remove(child._obj);
        }
    }

    /** Detaches this object from its parent. */
    removeFromParent(): void {
        this._obj.removeFromParent();
    }

    /** Sets the object's local matrix. A 2D `Mat3` is converted to the equivalent `Mat4`. */
    setMatrix(mat: Mat3 | Mat4): void {
        if (mat instanceof Mat3) {
            Mat4.From2DMat3(mat).assignTo(this._obj.matrix);
        } else {
            mat.assignTo(this._obj.matrix);
        }
    }

    /** Returns a copy of the object's local matrix. */
    getMatrix(): Mat4 {
        return Mat4.FromThreeJS(this._obj.matrix);
    }

    /** Detaches the object from its parent. Does not dispose its geometry or materials. */
    dispose(): void {
        this._obj.parent?.remove(this._obj);
    }
}
