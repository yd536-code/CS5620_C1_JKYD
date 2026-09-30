import {AGLNodeView, ALabel, ALineGraphic, ALineMaterialModel} from "../../../../anigraph";
import {TutLineModel} from "./TutLineModel";

/**
 * Step 6.7: draws a {@link TutLineModel} with an `ALineGraphic`, following the docs' `WaveLineView`. It makes its
 * own line material, which uses the vertex colors, and rebuilds the line whenever the model signals a geometry
 * change.
 */
@ALabel("TutLineView")
export class TutLineView extends AGLNodeView{
    /** The graphic that draws the line. */
    line!: ALineGraphic;

    /** The model, typed as this view's model class. */
    get model(): TutLineModel {
        return this._model as TutLineModel;
    }

    /** Creates the line graphic and subscribes to the model's geometry changes. */
    init(): void {
        const material = ALineMaterialModel.GlobalInstance.CreateMaterial();
        this.line = new ALineGraphic();
        this.line.init(this.model.verts, material);
        this.registerAndAddGraphic(this.line);

        // Passing the listener to subscribe means it is removed when this view is released.
        this.subscribe(this.model.addGeometryListener(()=>{
            this.line.setVerts2D(this.model.verts);
        }));
        this.update();
    }

    /** Applies the model's line width and transform. Runs whenever the model's state changes. */
    update(...args: any[]): void {
        this.line.setLineWidth(this.model.lineWidth);
        this.setTransform(this.model.transform);
    }
}
