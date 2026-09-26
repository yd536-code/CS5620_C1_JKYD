import * as THREE from "three";
import {AGraphicElement} from "../graphicobject";
import {Color} from "../../math";
import {VertexArray3D} from "../../geometry";
import {ALabel} from "../../base";

/** A sphere mesh built from `VertexArray3D.ColoredSphere` (20 x 20 subdivisions). */
@ALabel("ASphereGraphic3D")
export default class ASphereGraphic3D extends AGraphicElement{

    /** The Three.js geometry. */
    get geometry(){return this._geometry;}


    /**
     * @param radius Sphere radius (default 100).
     * @param material Material or color. If omitted, the mesh is not created until a material is set and `init` is called.
     */
    constructor(radius:number=100,
                material?:Color|THREE.Color|THREE.Material|THREE.Material[],
                ...args:any[]){
        // super(new THREE.SphereBufferGeometry(radius, 100, 100), material, ...args);
        super(VertexArray3D.ColoredSphere(radius, 20, 20), material);
    }
}
