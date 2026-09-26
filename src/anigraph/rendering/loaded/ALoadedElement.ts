import {AGraphicGroup} from "../graphicobject";
import {Color} from "../../math";
import {AObject3DModelWrapper} from "../../geometry";
import {AMaterial} from "../material";
import * as THREE from "three";
import {ALabel} from "../../base";

/** Common interface for graphic elements that display a loaded model ({@link ALoadedElement}, {@link ALoadedBoundsElement}). */
export interface ALoadedElementInterface{
    updateSourceTransform():void;
    setMaterial(material: Color | THREE.Color | THREE.Material | THREE.Material[]):void;
}

/**
 * A graphic group that displays a loaded 3D model. It adds a new Three.js object from the given
 * {@link AObject3DModelWrapper} (via `getNewSceneObject()`) as its child.
 */
@ALabel("ALoadedElement")
export class ALoadedElement extends AGraphicGroup implements ALoadedElementInterface{
    /** The loaded model this element was created from. */
    public _sourceObject:AObject3DModelWrapper
    /** The Three.js object added to this group. */
    public loadedObject:THREE.Object3D;
    constructor(object:AObject3DModelWrapper) {
        super();
        this.loadedObject= object.getNewSceneObject();
        this.threejs.add(this.loadedObject);
        this._sourceObject=object;
    }

    /**
     * Sets the material of every mesh anywhere in the loaded object (it searches all descendants, not just groups).
     * - A `Color` or `THREE.Color` changes the color of each mesh's existing material(s) that have a `color`
     *   property. The materials themselves are kept.
     * - A Three.js material (or array of materials) replaces each mesh's material.
     */
    setMaterial(material:Color|THREE.Color|THREE.Material|THREE.Material[]){
        const isColor = material instanceof Color || material instanceof THREE.Color;
        const threeColor = (material instanceof Color) ? material.asThreeJS() : material;
        this.loadedObject.traverse((obj:THREE.Object3D)=>{
            if(!(obj instanceof THREE.Mesh)){
                return;
            }
            if(!isColor){
                obj.material = material as THREE.Material|THREE.Material[];
                return;
            }
            const meshMaterials:THREE.Material[] = Array.isArray(obj.material) ? obj.material : [obj.material];
            for(const m of meshMaterials){
                if(m && (m as any).color instanceof THREE.Color){
                    (m as any).color.set(threeColor as THREE.Color);
                }
            }
        });
    }

    /** Applies the new material's Three.js material to all meshes. */
    onMaterialChange(newMaterial:AMaterial){
        this.setMaterial(newMaterial.threejs);
    }
    onMaterialUpdate(newMaterial: AMaterial, ...args:any[]) {
        super.onMaterialUpdate(newMaterial, ...args);
    }

    /** Copies the model's source transform matrix into the loaded object's `matrix`. */
    updateSourceTransform(){
        this._sourceObject.sourceTransform.getMatrix().assignTo(this.loadedObject.matrix);
    }
}

