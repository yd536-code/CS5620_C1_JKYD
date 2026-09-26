import {AGraphicElement} from "../graphicobject";
import * as THREE from "three";
import {VertexArray2D, VertexArray3D} from "../../geometry";
import {ALabel} from "../../base";

/** A triangle mesh drawn from a 2D or 3D vertex array (positions plus indices and any other attributes). */
@ALabel("ATriangleMeshGraphic")
export class ATriangleMeshGraphic extends AGraphicElement{
    protected verts!:VertexArray3D|VertexArray2D;

    /** The Three.js mesh. */
    get mesh(){
        return this._element;
    }

    // static CreateMeshGraphic(geometry?:THREE.BufferGeometry|VertexArray<any>,
    //                   material?:Color|THREE.Color|THREE.Material|THREE.Material[],
    //                   ...args:any[]){
    //     return new this(geometry, material, ...args);
    // }

    /** Sets the geometry from `verts` (or the stored `verts`). Throws if geometry was already set. */
    initGeometry(verts?:VertexArray3D){
        if(!this._geometry){
            if(verts){
                this.verts = verts;
            }
            this.setGeometry(this.verts);
        }else{
            throw new Error("Tried to re-init geometry in ATriangleMeshElements");
        }
    }

    /** Returns a green, double-sided, transparent `MeshBasicMaterial`. */
    _createDefaultMaterial(){
        return new THREE.MeshBasicMaterial({
            color: 0x22aa22,
            transparent: true,
            side: THREE.DoubleSide,
            opacity: 1.0,
        });
    }

    /**
     * Sets the mesh's vertices, 2D or 3D. 2D vertex arrays go to `setVerts2D`.
     * @param verts The vertex array to draw.
     */
    setVerts(verts:VertexArray3D|VertexArray2D){
        if(verts instanceof VertexArray2D){
            this.setVerts2D(verts);
            return;
        }
        this.verts = verts;
        // console.log({ indices: this.verts.indices });
        this.setGeometry(this.verts);
    }

    /** Sets the mesh's vertices from a 2D vertex array. */
    setVerts2D(verts:VertexArray2D){
        this.verts = verts;
        // console.log({ indices: this.verts.indices });
        this._setGeometry2D(verts);
    }

}
