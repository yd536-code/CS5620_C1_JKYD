import * as THREE from "three";
import {Loader} from "three";
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";
import {PLYLoader} from "three/examples/jsm/loaders/PLYLoader";
import {AObject3DModelWrapper} from "../geometry";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";


/** Returns `obj` if it is a mesh, otherwise the first mesh found in a depth-first search of its descendants. */
function getDescendantMesh(obj:THREE.Object3D):THREE.Mesh|undefined{
    if(obj.type==="Mesh"){
        return obj as THREE.Mesh;
    }else{
        for(let c of obj.children){
            let cm = getDescendantMesh(c);
            if(cm && cm.type ==="Mesh"){
                return cm;
            }
        }
    }
    return;
}

/** Returns the lower-case file extension of `path` (the text after the last '.'), e.g. "obj" for "cat.OBJ". */
function getExtension(path:string):string{
    return (path.split('.').pop()??'').toLowerCase();
}

/** True for the glTF extensions (.glb binary files and .gltf text files). */
function isGLTFExtension(extension:string){
    return extension === 'glb' || extension === 'gltf';
}

/**
 * Makes sure a loaded geometry has vertex normals (which lighting needs): computes them if the geometry has none,
 * or always if `recompute` is true.
 */
function ensureNormals(geometry:THREE.BufferGeometry, recompute:boolean){
    if(recompute || geometry.attributes.normal === undefined){
        geometry.computeVertexNormals();
    }
}

/** Calls {@link ensureNormals} on the geometry of every mesh in `obj` (including `obj` itself). */
function ensureNormalsInHierarchy(obj:THREE.Object3D, recompute:boolean){
    obj.traverse((child:THREE.Object3D)=>{
        const mesh = child as THREE.Mesh;
        if(mesh.isMesh && mesh.geometry instanceof THREE.BufferGeometry){
            ensureNormals(mesh.geometry, recompute);
        }
    });
}

/**
 * Static helpers that load 3D model files with the matching Three.js loader (chosen by file extension) and wrap the
 * result in an {@link AObject3DModelWrapper}. Most code should load models through {@link AssetManager} instead.
 *
 * Supported extensions: .obj, .ply, .glb, and .gltf. Any other extension throws (or rejects) with
 * `Extension "..." not recognized`.
 *
 * Every loader makes sure the loaded meshes have vertex normals: they are computed for geometry that has none, and
 * recomputed for all geometry if `computeVertexNormals` is true.
 */
export class AModelLoader3D{
    /**
     * Creates the Three.js loader for a file extension. This is the one place that decides which extensions are
     * supported.
     * @param extension the file extension, without the '.', in lower case
     */
    static _CreateLoaderForExtension(extension:string):Loader{
        let loader: Loader;
        switch (extension) {
            case 'obj':
                loader = new OBJLoader();
                break;
            case 'ply':
                loader = new PLYLoader();
                break;
            case 'glb':
            case 'gltf':
                loader = new GLTFLoader();
                break;
            default:
                throw new Error(`Extension "${extension}" not recognized`);
        }
        loader.setCrossOrigin("");
        return loader;
    }

    /**
     * Turns what a Three.js loader returned into an {@link AObject3DModelWrapper}.
     * - PLY files load as a bare `BufferGeometry`, which gets wrapped in a mesh.
     * - glTF files load as a result object: with `firstMeshOnly`, the first mesh of the first scene is used (or the
     *   whole scene if it has no mesh); otherwise the whole first scene.
     * - Anything else (e.g. the group an OBJ file loads as) is wrapped as-is.
     * @param loaded what the loader returned
     * @param extension the file's extension, which says what kind of object `loaded` is
     * @param computeVertexNormals if true, recompute normals even for geometry that already has them
     * @param firstMeshOnly for glTF files: use only the first mesh instead of the whole scene
     */
    static _WrapLoadedObject(loaded:any, extension:string, computeVertexNormals:boolean, firstMeshOnly:boolean):AObject3DModelWrapper{
        let object3D:THREE.Object3D;
        if(isGLTFExtension(extension)){
            const scene:THREE.Object3D = loaded.scenes[0];
            object3D = firstMeshOnly ? (getDescendantMesh(scene) ?? scene) : scene;
        }else if(loaded instanceof THREE.BufferGeometry){
            object3D = new THREE.Mesh(loaded);
        }else{
            object3D = loaded as THREE.Object3D;
        }
        ensureNormalsInHierarchy(object3D, computeVertexNormals);
        return new AObject3DModelWrapper(object3D);
    }

    /**
     * Callback-based loader (.obj, .ply, .glb, .gltf). Loads the file, wraps the model the same way as
     * {@link AModelLoader3D.LoadFromPath} (the first mesh of a glTF file), and passes it to `callback`.
     *
     * The returned promise resolves after the model has loaded and `callback`'s promise has resolved. It rejects if
     * the extension isn't supported, the file can't be loaded, or `callback` throws.
     * @param path path (URL) of the model file
     * @param callback called with the wrapped model once it has loaded
     * @param computeVertexNormals if true, recompute vertex normals even for geometry that already has them
     */
    static async _LoadFromPath(path:string, callback:(model:AObject3DModelWrapper)=>Promise<void>, computeVertexNormals:boolean=false):Promise<void> {
        const extension = getExtension(path);
        const loader = AModelLoader3D._CreateLoaderForExtension(extension);
        const loaded = await new Promise<any>((resolve, reject)=>{
            // @ts-ignore  (the loaders' `load` signatures differ in their result type)
            loader.load(path, resolve, undefined, reject);
        });
        await callback(AModelLoader3D._WrapLoadedObject(loaded, extension, computeVertexNormals, true));
    }

    /**
     * Loads a model file (.obj, .ply, .glb, or .gltf) and wraps the whole loaded object. For glTF files this is the
     * entire first scene, not just one mesh. Rejects for other extensions.
     * @param path path (URL) of the model file
     * @param computeVertexNormals if true, recompute vertex normals even for geometry that already has them
     */
    static async LoadSceneFromPath(path:string, computeVertexNormals:boolean=false) {
        const extension = getExtension(path);
        const loader = AModelLoader3D._CreateLoaderForExtension(extension);
        const loaded = await loader.loadAsync(path);
        return AModelLoader3D._WrapLoadedObject(loaded, extension, computeVertexNormals, false);
    }

    /**
     * Loads a model file (.obj, .ply, .glb, or .gltf) and wraps it in an {@link AObject3DModelWrapper}. For glTF
     * files, returns the first mesh in the first scene (or the whole scene if it has no mesh). PLY geometry is
     * wrapped in a mesh. Rejects for other extensions.
     * @param path path (URL) of the model file
     * @param computeVertexNormals if true, recompute vertex normals even for geometry that already has them
     */
    static async LoadFromPath(path:string, computeVertexNormals:boolean=false) {
        const extension = getExtension(path);
        const loader = AModelLoader3D._CreateLoaderForExtension(extension);
        const loaded = await loader.loadAsync(path);
        return AModelLoader3D._WrapLoadedObject(loaded, extension, computeVertexNormals, true);
    }
}
