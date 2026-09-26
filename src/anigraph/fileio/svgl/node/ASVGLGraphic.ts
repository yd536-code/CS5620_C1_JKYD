import {ALabel} from "../../../base";
import {AGraphicElement, AGraphicGroup} from "../../../rendering";
import {Color, Mat4} from "../../../math";
import * as THREE from "three";
import {ASVGLModel3D} from "./ASVGLModel3D";
import {SVGLAsset} from "../SVGLAsset";

/**
 * Graphic group that displays an {@link SVGLAsset}. Meshes keep the `id` (or tag name) of the SVG element they came
 * from as their Three.js `name`, so individual elements can be looked up and recolored by name.
 * Create with {@link ASVGLGraphic.Create}.
 */
@ALabel("ASVGLGraphic")
export class ASVGLGraphic extends AGraphicGroup{
    /** A clone of the object this graphic was constructed with (made before it was added to the group). */
    _svgObject!:THREE.Object3D;
    /**
     * The group made by `svgAsset.getNewSceneObject(true, ...)` in `Create`. Its child is the copy of the asset's
     * object, whose matrix is the asset's `sourceTransform`.
     */
    svgRootNode!:THREE.Object3D;
    /** A clone of the object this graphic was constructed with. */
    get svgObject():THREE.Object3D{
        return this._svgObject;
    }


    /**
     * Sets the color of every mesh named `elementName` (the SVG element's `id`). If `color.a < 1` the material is
     * made transparent with that opacity; otherwise it is made opaque.
     */
    setElementColor(elementName:string, color:Color){
        let parentObj = this.threejs;
        function setElColor(p:THREE.Object3D){
            if(p.type == "Mesh") {
                if (p.name == elementName) {
                    let material = ((p as THREE.Mesh).material as THREE.MeshBasicMaterial);
                    material.setValues({"color": color.asThreeJS()});
                    if(color.a<1){
                        material.setValues({"transparent": true});
                        material.setValues({"opacity": color.a});
                        // (p as THREE.Mesh).material.setValue("transparent", true);
                        // (p as THREE.Mesh).material.setValue("opacity", color.a);
                    }else{
                        material.setValues({"transparent": false});
                        material.setValues({"opacity": 1.0});
                    }
                }
            }
            for(let c of p.children){
                setElColor(c);
            }
        }
        setElColor(parentObj);
    }

    /** Returns the first mesh named `elementName` (depth-first), or `undefined` if there is none. */
    getMeshElementByName(elementName:string){
        function _getElement(p:THREE.Object3D):THREE.Object3D|undefined{
            if(p.type == "Mesh") {
                if (p.name == elementName) {
                    return p;
                }
            }
            for(let c of p.children){
                let cel:THREE.Object3D|undefined = _getElement(c);
                if(cel){
                    return cel;
                }
            }
        }
        return _getElement(this.threejs)
    }

    protected constructor(svgSourceObject:THREE.Object3D) {
        super();
        this._svgObject=svgSourceObject.clone();
        this.threejs.add(svgSourceObject);
    }

    /**
     * Creates a graphic from a new scene object made from `svgAsset` (see
     * {@link AObject3DModelWrapper.getNewSceneObject}).
     * @param deepCopy if true, the graphic gets its own copy of the geometry and materials. Otherwise they are shared
     * with the asset, so `setElementColor` would also affect other graphics made from the same asset.
     */
    static Create(svgAsset:SVGLAsset, deepCopy?:boolean){
        let svgObj = svgAsset.getNewSceneObject(true, deepCopy);
        let group = new THREE.Group();
        group.matrixAutoUpdate=false;
        group.add(svgObj);
        let newNode = new this(group);
        newNode.svgRootNode = svgObj;
        return newNode;
    }

    /**
     * Sets the matrix of `svgRootNode`. This is applied on top of the asset's own `sourceTransform` (which stays on
     * the child object).
     */
    setSourceTransform(mat:Mat4){
        mat.assignTo(this.svgRootNode.matrix);
    }

    // static Create(svgSourceObject:THREE.Object3D){
    //     return new this(svgSourceObject);
    // }
}
