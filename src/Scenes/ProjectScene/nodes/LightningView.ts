import {AGLNodeView, ALabel, ALineGraphic, ALineMaterialModel} from "../../../anigraph";
import {LightningModel} from "./LightningModel";

/**
 * Draws LightningModel as a line, using the same model/view pattern as BoatView.
 */
@ALabel("LightningView")
export class LightningView extends AGLNodeView {
    /** The graphic that draws the bolt's connected points. */
    lightningGraphic!: ALineGraphic;

    /** The model, typed as the lightning model this view draws. */
    get model(): LightningModel {
        return this._model as LightningModel;
    }

    /** Creates the graphic and listens for changes to the bolt's shape or colors. */
    init(): void {
        const material = ALineMaterialModel.GlobalInstance.CreateMaterial();
        this.lightningGraphic = new ALineGraphic();
        this.lightningGraphic.init(this.model.verts, material);
        this.registerAndAddGraphic(this.lightningGraphic);

        // Refresh the drawing when the model calls signalGeometryUpdate().
        this.subscribe(this.model.addGeometryListener(() => {
            this.lightningGraphic.setVerts2D(this.model.verts);
            //lightning opacity for the after image
            material.setValue("opacity", this.model.boltOpacity);
        }));
        this.update();
    }

    /** Applies the model's line width and position, rotation, and scale. */
    update(...args: any[]): void {
        this.lightningGraphic.setLineWidth(this.model.lineWidth);
        this.setTransform(this.model.transform);
    }
}
