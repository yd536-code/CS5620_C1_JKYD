import {APolygonGraphic2D} from "./APolygonGraphic2D";
import {Color} from "../../math";

/** An {@link APolygonGraphic2D} whose `setColor` sets the color of its `MeshBasicMaterial` directly. */
export class BasicParticleGraphic extends APolygonGraphic2D{
    /** Sets the material's color (alpha is ignored). */
    setColor(v:Color){
        (this._material as THREE.MeshBasicMaterial).setValues({color:v.asThreeJS()})
    }
}



