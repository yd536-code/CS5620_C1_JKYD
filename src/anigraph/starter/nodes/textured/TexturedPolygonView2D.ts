import {PolygonView2D} from "../polygon2D";
import {APolygonGraphic2D} from "../../../rendering";
import {TexturedPolygonModel2D} from "./TexturedPolygonModel2D";
import {Color} from "../../../math";

/** Compile-time switch: when `USE_TEXTURES` is 0, textured polygons are drawn with a random solid color instead. */
export const enum TexturePolySettings2D{
    USE_TEXTURES=1
}


/** Three.js view for a {@link TexturedPolygonModel2D}. Draws like {@link PolygonView2D}, using the model's
 * (textured) material. */
export class TexturedPolygonView2D extends PolygonView2D{
    element!: APolygonGraphic2D;
    get model(): TexturedPolygonModel2D {
        return this._model as TexturedPolygonModel2D;
    }

    // updateTexCoords(){
    //     this.element.setTextureMatrix(this.model.textureMatrix);
    // }

    init(): void {
        super.init();
        if(!TexturePolySettings2D.USE_TEXTURES) {
            this.element.setMaterial(Color.Random())
        }
        // this.updateTexCoords();

        // const self = this;
        // this.subscribe(
        //     this.model.addTextureUpdateListener(
        //         ()=>{
        //             self.updateTexCoords();
        //         }
        //     )
        // )
    }

    update(...args:any[]): void {
        super.update();
    }
}




