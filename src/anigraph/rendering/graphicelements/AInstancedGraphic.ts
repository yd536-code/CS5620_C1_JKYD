import * as THREE from "three";
import {AInstancedGraphicBase} from "./AInstancedGraphicBase";
import {Color} from "../../math";
import {VertexArray3D} from "../../geometry";
import {AMaterial} from "../material";

/**
 * Instanced graphic that draws many copies of one geometry with a single `THREE.InstancedMesh` (used, e.g., for
 * particle systems). Call `init(nInstances, material, verts?)` to build the mesh; the number of instances is fixed
 * at that point.
 */
export abstract class AInstancedGraphic extends AInstancedGraphicBase{
    protected _mesh!:THREE.InstancedMesh
    protected _geometry!:THREE.BufferGeometry;
    protected _material!:THREE.Material;

    /** The `THREE.InstancedMesh`. */
    get threejs(){
        return this.mesh;
    }


    /** Sets the Three.js material, disposing the previous one. Does not update an existing mesh. */
    setMaterial(material:THREE.Material){
        if(this._material !== undefined){
            this._material.dispose();
        }
        this._material = material;
    }


    /** Flags the per-instance matrices and colors for re-upload to the GPU. Call after changing instances. */
    setNeedsUpdate(){
        this.threejs.instanceMatrix.needsUpdate=true;
        if(this.threejs.instanceColor) {
            this.threejs.instanceColor.needsUpdate = true;
        }

    }

    /**
     * Replaces the instanced geometry (disposing the old one). A `VertexArray3D` is converted to a buffer geometry;
     * `undefined` gives the default unit square. A `number[]` is not supported: it throws, and the old geometry is
     * kept.
     */
    setVerts(verts:VertexArray3D|number[]){
        if(Array.isArray(verts)){
            throw new Error("AInstancedGraphic.setVerts: a number[] is not supported; pass a VertexArray3D instead.");
        }
        if(this._geometry){
            this._geometry.dispose();
        }
        if(verts === undefined){
            this._setGeometryPlane();
        }else if(verts instanceof VertexArray3D){
            this._geometry = new THREE.BufferGeometry();
            this._geometry.setIndex(verts.indices.elements);
            for (let attribute in verts.attributes) {
                this._geometry.setAttribute(attribute, verts.getAttributeArray(attribute).BufferAttribute());
            }
        }
        if(this._mesh){
            this._mesh.geometry = this._geometry;
        }
    }

    /** Sets the geometry to a unit square in the xy plane (`VertexArray3D.SquareXYUV(1)`). */
    _setGeometryPlane(){
        let geometry = VertexArray3D.SquareXYUV(1);
        this._geometry = new THREE.BufferGeometry();
        this._geometry.setIndex(geometry.indices.elements);
        for(let attribute in geometry.attributes){
            this._geometry.setAttribute(attribute, geometry.getAttributeArray(attribute).BufferAttribute());
        }
    }

    /**
     * Builds the `THREE.InstancedMesh`.
     * @param nInstances Maximum number of instances (fixed after this call).
     * @param material Material for every instance. Required; throws if missing.
     * @param verts Geometry for one instance; defaults to a unit square.
     */
    init(nInstances:number, material?:THREE.Material|AMaterial, verts?:VertexArray3D|number[], ...args:any[]){
        // nParticles = nParticles!==undefined?nParticles:AParticleEnums.DEFAULT_MAX_N_PARTICLES;
        if(verts){
            this.setVerts(verts);
        }else{
            this._setGeometryPlane();
        }
        let mat = material;
        if(mat instanceof AMaterial){
            mat = mat.threejs;
        }
        if(mat){
            this.setMaterial(mat);
        }else {
            throw new Error("No instanced graphic material provided!");
        }
        if(this._geometry && this._material){
            this._mesh = new THREE.InstancedMesh(this._geometry, this._material, nInstances);
            // this.threejs.matrixAutoUpdate=false;
            this.mesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
            this.setColorAt(0, Color.FromString("#00ff00"));
            // @ts-ignore
            this.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage );
        }
    }

}
