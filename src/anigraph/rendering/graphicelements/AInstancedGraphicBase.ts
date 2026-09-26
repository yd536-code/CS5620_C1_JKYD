import {AGLGraphicObject} from "../graphicobject";
import {Color, Mat3, Mat4} from "../../math";

/**
 * Base class for graphics drawn with a `THREE.InstancedMesh`: one geometry drawn many times, each instance with its
 * own transform matrix and color. See {@link AInstancedGraphic}.
 */
export abstract class AInstancedGraphicBase extends AGLGraphicObject{
    protected abstract _mesh:THREE.InstancedMesh;
    protected abstract _geometry:THREE.BufferGeometry;
    protected abstract _material:THREE.Material;
    /** The `THREE.InstancedMesh`. */
    get mesh(){return this._mesh;}
    /** Number of instances drawn (at most the count the mesh was created with). */
    set count(value:number){this.mesh.count=value;}
    get count(){
        return this.mesh.count;
    }




    /** Sets the color of instance `index`. */
    setColorAt(index:number, color:Color){
        this.mesh.setColorAt(index, color.asThreeJS());
    }

    /** Sets the transform of instance `index`. A `Mat3` is treated as a 2D transform (`Mat4.From2DMat3`). */
    setMatrixAt(index:number, m:Mat4|Mat3){
        if(m instanceof Mat4){
            this.mesh.setMatrixAt(index, m.asThreeJS());
        }else{
            this.mesh.setMatrixAt(index, Mat4.From2DMat3(m).asThreeJS());
        }
    }

    /**
     * Sets both the transform and the color of instance `index`. Warns if `index` is greater than `count`.
     * @param mat The instance transform. A `Mat3` is treated as a 2D transform (`Mat4.From2DMat3`), as in
     * `setMatrixAt`.
     * @param useOpacity If true (the default), `1 - color.a` is stored in element `m30` of the instance matrix so a
     * shader can read the instance's transparency from there. This is written to a copy, so the caller's matrix is
     * not changed.
     */
    setMatrixAndColorAt(index:number, mat:Mat3|Mat4, color:Color, useOpacity:boolean=true){
        if(index>this.count){
            console.warn("You are trying to set the transform for a graphic instance that doesn't exist! Instanced graphics need to have the number of instances specified up front for GPU resource allocation. When you initialize your model, specify the maximum number of particles you may use so that the GPU resources can be allocated! (e.g., when you initialize a particle system model, set the number of particles up front and just set visible=false for any you aren't using yet)")
        }
        if(useOpacity){
            // Copy the matrix (converting a 2D Mat3 first) so writing m30 doesn't change the caller's matrix.
            let mat4 = (mat instanceof Mat4) ? mat.clone() : Mat4.From2DMat3(mat);
            mat4.m30 = 1.0-color.a;
            this.setMatrixAt(index, mat4);
            this.setColorAt(index, color);
        }else {
            this.setMatrixAt(index, mat);
            this.setColorAt(index, color);
        }
    }


    /** Removes the mesh from its parent and disposes its geometry and material. */
    dispose(){
        super.dispose();
        if(this._geometry){
            this._geometry.dispose();
        }
        if(this._material){
            this._material.dispose();
        }
    }

    /** Sets the GPU usage hint for the instance matrices (e.g. `THREE.DynamicDrawUsage` for per-frame updates). */
    setUsage(usage:THREE.Usage){
        // mesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
        this.mesh.instanceMatrix.setUsage( usage );
    }

    /** The Three.js geometry. */
    get geometry(){return this._geometry;}
    /**
     * Old, misspelled name for `geometry`, kept so existing code still works.
     * @deprecated Use `geometry`.
     */
    get geometery(){return this._geometry;}
    /** The Three.js material. */
    get material(){return this._material;}
}
