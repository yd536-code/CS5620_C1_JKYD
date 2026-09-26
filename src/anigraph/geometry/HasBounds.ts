import {BoundingBox3D} from "./BoundingBox3D";
import {BoundingBox2D} from "./BoundingBox2D";

/** Something with a uid that can report a 3D bounding box (e.g., vertex arrays and {@link AObject3DModelWrapper}). */
export interface HasBounds {
    // getBounds2D(cameraMatrix?:Mat4):BoundingBox2D;
    // getBounds3D():BoundingBox3D;
    uid: string;
    getBounds(): BoundingBox3D;
}


/** Something with a uid that can report a 2D bounding box. */
export interface HasBounds2D {
    // getBounds2D(cameraMatrix?:Mat4):BoundingBox2D;
    // getBounds3D():BoundingBox3D;
    uid: string;
    getBounds(): BoundingBox2D;
}
