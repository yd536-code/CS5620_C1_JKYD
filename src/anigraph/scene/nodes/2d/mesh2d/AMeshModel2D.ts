import {ASerializable} from "../../../../base";
import {ANodeModel2D} from "../../../nodeModel/ANodeModel2D";
import {VertexArray2D} from "../../../../geometry";
import type {TransformationInterface2D} from "../../../../math";

/**
 * The general-purpose 2D node type for arbitrary flat geometry: a raw `VertexArray2D` mesh, drawn by `AMeshView2D`.
 * Its transform representation follows `ANodeModel2D`'s default (`NodeTransform2D`).
 */
@ASerializable("AMeshModel2D")
export class AMeshModel2D extends ANodeModel2D{
    /**
     * @param verts The mesh's vertices. Defaults to an empty `VertexArray2D`.
     * @param transform The initial transform, stored as given (a `Mat3` makes a matrix node). Defaults to an
     * identity `NodeTransform2D`.
     */
    constructor(verts?:VertexArray2D, transform?:TransformationInterface2D) {
        // Pass the transform to the base constructor, which stores it as given (before any transform exists,
        // `setTransform` has no representation to keep), so a node constructed with a `Mat3` holds a `Mat3`.
        super(undefined, transform);
        if(verts === undefined){
            verts = new VertexArray2D();
        }
        this._setVerts(verts);
    }

    /**
     * Creates a model with an empty vertex array set up for rendering with the chosen attributes. Called on a
     * subclass, it creates an instance of that subclass. Note the argument order differs from
     * `AMeshModel3D.Create`.
     * @param hasColors Whether vertices have colors.
     * @param hasTextureCoords Whether vertices have texture coordinates.
     * @param hasNormals Whether vertices have normals.
     */
    static Create2DMeshModel(hasColors: boolean = true,
                  hasTextureCoords: boolean = true,
                  hasNormals: boolean = false, ...args:any[]){
        let verts = VertexArray2D.CreateForRendering(hasColors, hasTextureCoords, hasNormals);
        return new this(verts);
    }
}
