import {ANodeModel3D} from "../../nodeModel/ANodeModel3D";
import {VertexArray3D} from "../../../geometry";
import {ASerializable} from "../../../base";

import type {TransformationInterface, TransformationInterface3D} from "../../../math";

/**
 * The general-purpose 3D node type for triangle meshes: a `VertexArray3D` drawn by {@link ATriangleMeshView}. Its
 * transform representation follows `ANodeModel3D`'s default (`NodeTransform3D`).
 */
@ASerializable("AMeshModel3D")
export class AMeshModel3D extends ANodeModel3D{
    /**
     * @param verts The mesh's vertices. Defaults to an empty `VertexArray3D`.
     * @param transform The initial transform, stored as given (a `Mat4` makes a matrix node). Defaults to an
     * identity `NodeTransform3D`.
     */
    constructor(verts?:VertexArray3D, transform?:TransformationInterface) {
        // The base constructor stores the transform as given (before any transform exists, `setTransform` has no
        // representation to keep), so a node constructed with a `Mat4` holds a `Mat4`. It also keeps `verts`, or
        // creates an empty `VertexArray3D` if `verts` is undefined.
        super(verts, transform as TransformationInterface3D|undefined);
    }


    /**
     * Creates a model with an empty vertex array set up for rendering with the chosen attributes. Called on a
     * subclass, it creates an instance of that subclass. Note the argument order differs from
     * `AMeshModel2D.Create2DMeshModel`.
     * @param hasNormals Whether vertices have normals.
     * @param hasTextureCoords Whether vertices have texture coordinates.
     * @param hasColors Whether vertices have colors.
     */
    static Create(hasNormals: boolean,
                  hasTextureCoords: boolean,
                  hasColors: boolean, ...args:any[]){
        let verts = VertexArray3D.CreateForRendering(hasNormals, hasTextureCoords, hasColors);
        return new this(verts);
    }
}


