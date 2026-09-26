import * as THREE from "three";

/**
 * Recursively clones a Three.js object and its children. For each `THREE.Mesh` in the hierarchy, the geometry and
 * material (or each material in a material array) are cloned too, unless turned off, so the copy doesn't share them
 * with the original.
 * @param cloneGeometry If false, the copies share the original meshes' geometry. Applies to every level.
 * @param cloneMaterial If false, the copies share the original meshes' materials. Applies to every level.
 */
export function GetDeepTHREEJSClone(object:THREE.Object3D, cloneGeometry:boolean=true, cloneMaterial:boolean=true){
    let clone:THREE.Object3D;
    if (object instanceof THREE.Mesh) {
        clone = object.clone(false) as THREE.Mesh;
        let g = object.geometry;
        if(cloneGeometry){
            g=g.clone();
        }
        let m=object.material;
        if(cloneMaterial){
            m = Array.isArray(m) ? m.map((mat:THREE.Material)=>mat.clone()) : m.clone();
        }
        (clone as THREE.Mesh).geometry=g;
        (clone as THREE.Mesh).material=m;
        // clone = new THREE.Mesh(g, m);
        // clone.copy(object, false)
    }else{
        clone = object.clone(false);
    }
    for(let c of object.children){
        clone.add(GetDeepTHREEJSClone(c, cloneGeometry, cloneMaterial));
    }
    return clone;

}
