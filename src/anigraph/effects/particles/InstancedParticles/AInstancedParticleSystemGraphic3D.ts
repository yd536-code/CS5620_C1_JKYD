import {
    AInstancedGraphic,
    AMaterial,
    VertexArray3D
} from "../../../index";
import * as THREE from "three";



/**
 * An {@link AInstancedGraphic} (one `THREE.InstancedMesh`, one instance per particle) set up for particles. Views
 * write each particle's transform and color with `setMatrixAt`/`setColorAt`, then call `setNeedsUpdate()`.
 */
export class AInstancedParticleSystemGraphic3D extends AInstancedGraphic {
    /** Instance count used by `init()` when no count is given. */
    static MAX_PARTICLES:number=300;
    protected _mesh!:THREE.InstancedMesh
    protected _geometry!:THREE.BufferGeometry;
    protected _material!:THREE.Material;

    /** The underlying `THREE.InstancedMesh`. */
    get threejs(){
        return this.mesh;
    }

    // get particleTexture(){return "images/particleFlare.jpg"}
    // get particleTexture(){return "images/flameParticle.jpg"}

    /**
     * Creates and initializes a particle graphic.
     * @param nParticles Number of instances (default 100).
     * @param material Material to use; see `init`.
     */
    static Create(nParticles:number=100, material?:AMaterial|THREE.Material, ...args:any[]){
        let psystem = new this();
        psystem.init(nParticles, material)
        return psystem;
    }


    /**
     * Initializes the instanced mesh.
     * @param nParticles Number of instances (default `MAX_PARTICLES`).
     * @param material An {@link AMaterial} or three.js material. Defaults to a transparent `THREE.MeshBasicMaterial`
     * that does not write depth.
     * @param geometry Geometry for each instance, passed on to {@link AInstancedGraphic.init}.
     */
    init(nParticles?:number, material?:AMaterial|THREE.Material, geometry?:VertexArray3D, ...args:any[]){
        let mat = material;
        if(mat instanceof AMaterial){
            mat = mat.threejs;
        }else if(mat === undefined){
            mat = new THREE.MeshBasicMaterial({
                depthWrite: false,
                transparent:true,
                // alphaTest:0.2,
                // alphaMap: new THREE.TextureLoader().load(this.particleTexture),
                // alphaMap: new THREE.Texture(particleTex)
            })
        }
        super.init(nParticles??AInstancedParticleSystemGraphic3D.MAX_PARTICLES, mat, geometry, ...args);
    }


}
