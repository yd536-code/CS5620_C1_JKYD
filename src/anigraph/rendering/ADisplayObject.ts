import {Mat3, Mat4} from "../math";

/**
 * Backend-independent interface for a node in a renderer's display hierarchy (e.g. {@link ATwoJSDisplayObject},
 * which wraps a Two.js group).
 */
export interface ADisplayObject {
    /** Unique id. */
    readonly uid: string;
    /** Whether the object is drawn. */
    visible: boolean;
    /** Adds `child` under this object. */
    add(child: ADisplayObject): void;
    /** Removes `child` from this object. */
    remove(child: ADisplayObject): void;
    /** Removes this object from its parent. */
    removeFromParent(): void;
    /** Sets the object's local transform. */
    setMatrix(mat: Mat3 | Mat4): void;
    /** Returns the object's local transform. */
    getMatrix(): Mat4;
    /** Frees resources and removes the object from its parent. */
    dispose(): void;
}
