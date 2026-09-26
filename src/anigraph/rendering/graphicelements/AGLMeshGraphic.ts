import {ALabel} from "../../base";
import {AGraphicElementBase} from "../graphicobject";
import * as THREE from "three";
import {Color} from "../../math";
import {AMaterial} from "../material";

/**
 * A simple Three.js mesh graphic: a `THREE.Mesh` built from a `THREE.BufferGeometry` and a material. Unlike
 * {@link AGraphicElement}, it takes Three.js geometry directly (no `VertexArray` conversion).
 */
@ALabel("AGLMeshGraphicBase")
export class AGLMeshGraphicBase extends AGraphicElementBase {
    _geometry!: THREE.BufferGeometry;
    _material!: THREE.Material | THREE.Material[];
    _element!: THREE.Mesh;

    /** The `THREE.Mesh`. */
    get mesh() {
        return this._element;
    }

    /** The Three.js geometry. */
    get geometry(): THREE.BufferGeometry {
        return this._geometry;
    }

    /** The Three.js material (or materials). */
    get material(): THREE.Material | THREE.Material[] {
        return this._material;
    }

    /** The `THREE.Mesh` (same as `mesh`). */
    get threejs(): THREE.Mesh {
        return this._element;
    }

    /** Sets the material (see {@link AGraphicElementBase._GetMaterialFromParam}) and applies it to the mesh if it exists. */
    setMaterial(material: Color | THREE.Color | THREE.Material | THREE.Material[] | AMaterial) {
        this._material = AGraphicElementBase._GetMaterialFromParam(material);
        if (this._element) {
            this.threejs.material = this._material;
        }
    }

    /** Stores any given geometry/material and creates the mesh (with `matrixAutoUpdate` off). Throws if called twice. */
    init(geometry?: THREE.BufferGeometry, material?: Color | THREE.Color | THREE.Material | THREE.Material[] | AMaterial) {
        if(geometry) {
            this._geometry = geometry;
        }
        if(material) {
            this._material = AGraphicElementBase._GetMaterialFromParam(material);
        }
        if (this._element) {
            throw new Error("Tried calling init on graphic that already has an _element! Are you calling this twice?");
        }
        this._element = new THREE.Mesh(this._geometry, this._material);
        this._element.matrixAutoUpdate=false;
    }
}

/** Concrete {@link AGLMeshGraphicBase}; create one with `AGLMeshGraphic.Create(geometry, material)`. */
@ALabel("AGLMeshGraphic")
export class AGLMeshGraphic extends AGLMeshGraphicBase {

    /** Creates the graphic and builds its mesh from `geometry` and `material`. */
    static Create(
        geometry:THREE.BufferGeometry|any,
        material:Color|THREE.Color|THREE.Material|THREE.Material[]|AMaterial,
        ...args:any[]
    ){
        let graphic = new this();
        graphic.init(geometry, material);
        return graphic;
    }
}
