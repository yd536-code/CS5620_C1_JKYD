import {Color} from "../../math";
import {AObject3DModelWrapper} from "../../geometry";
import {ATriangleMeshGraphic} from "../graphicelements";
import {ALoadedElementInterface} from "./ALoadedElement";
import {AMaterial} from "../material";
import * as THREE from "three";


/**
 * Draws the bounding box of a loaded {@link AObject3DModelWrapper} as a triangle mesh with a random color. Useful for
 * checking a loaded model's size and placement.
 */
export class ALoadedBoundsElement extends ATriangleMeshGraphic implements ALoadedElementInterface{
    /** The loaded model whose bounds are drawn. */
    public _sourceObject:AObject3DModelWrapper
    constructor(object:AObject3DModelWrapper) {
        super();
        // this.setVerts(object.getBoundingBoxVertexArray());
        this._sourceObject=object;
        let verts = this._sourceObject.getBoundingBoxVertexArray()
        this.setGeometry(verts);
        this.setMaterial(Color.Random());
    }

    /** Sets the box color. */
    onModelColorChange(color:Color){
        this.setMaterial(color);
    }

    /** Does nothing: the box keeps its own color material. */
    onMaterialChange(newMaterial:AMaterial){
        // this.setMaterial(newMaterial.threejs);
    }
    /** Does nothing. */
    onMaterialUpdate(newMaterial: AMaterial, ...args:any[]) {
        // super.onMaterialUpdate(newMaterial, ...args);
        // if('color' in this._element.material){
        //     // @ts-ignore
        //     this._element.material.color = newMaterial.getColor();
        // }
    }

    /** Recomputes the box vertices from the model's current bounds. */
    updateSourceTransform(){
        this.setVerts(this._sourceObject.getBoundingBoxVertexArray());
    }
}

