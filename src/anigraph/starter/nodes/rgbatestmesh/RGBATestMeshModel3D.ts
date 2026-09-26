import {AMeshModel3D} from "../../../scene";
import {VertexArray3D} from "../../../geometry";
import type {TransformationInterface} from "../../../math";
import {ASerializable} from "../../../base";


/** A mesh model for testing per-vertex RGBA colors. Drawn by {@link RGBATestMeshView}. */
@ASerializable("RGBATestMeshModel3D")
export class RGBATestMeshModel3D extends AMeshModel3D{
    constructor(verts?:VertexArray3D, transform?:TransformationInterface) {
        super(verts, transform);
    }


    /** Creates a model with an empty vertex array that has RGBA vertex colors. */
    static Create(...args:any[]){
        let verts = VertexArray3D.CreateForRendering(false, false, true);
        return new this(verts);
    }
}


