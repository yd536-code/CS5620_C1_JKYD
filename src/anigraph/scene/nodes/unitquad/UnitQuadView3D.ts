import {AGraphicElement} from "../../../rendering";
import {AGLNodeView} from "../../nodeView";
import {UnitQuadModel3D} from "./UnitQuadModel3D";

/** View for {@link UnitQuadModel3D}: draws a simple quad with the model's material. */
export class UnitQuadView3D extends AGLNodeView{
    /** The quad graphic. */
    quad!:AGraphicElement
    get model():UnitQuadModel3D{
        return this._model as UnitQuadModel3D;
    }
    /** Creates the quad graphic. */
    init(){
        this.quad = AGraphicElement.CreateSimpleQuad(this.mainMaterial);
        this.registerAndAddGraphic(this.quad);
        this.update();
    }

    /** Applies `model.matrix * model.transform` to the render object. */
    update(): void {
        this.setTransform(this.model.matrix.times(this.model.transform.getMat4()));
    }
}
