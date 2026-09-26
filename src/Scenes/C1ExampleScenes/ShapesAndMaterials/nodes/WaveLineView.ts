import {AGLNodeView, ALabel, ALineGraphic, ALineMaterialModel} from "../../../../anigraph";
import {WaveLineModel} from "./WaveLineModel";

/**
 * Draws a `WaveLineModel` with an `ALineGraphic`, which draws a line through the model's vertices using each vertex's
 * color.
 *
 * GPUs don't draw thick lines natively: a "line" is really a thin strip of triangles. The line material takes care of
 * that for us; `setLineWidth` sets how thick the strip is.
 */
@ALabel("WaveLineView")
export class WaveLineView extends AGLNodeView{
    /** The graphic that draws the line. */
    line!: ALineGraphic;

    /** The model, typed as the class this view draws. */
    get model(): WaveLineModel {
        return this._model as WaveLineModel;
    }

    /**
     * Creates the line graphic, and redraws it whenever the model signals a geometry update.
     */
    init(): void {
        // One line material can be shared by many lines. It uses the vertex colors.
        const material = ALineMaterialModel.GlobalInstance.CreateMaterial();
        this.line = new ALineGraphic();
        this.line.init(this.model.verts, material);
        this.registerAndAddGraphic(this.line);

        this.subscribe(this.model.addGeometryListener(()=>{
            this.line.setVerts2D(this.model.verts);
        }));
        this.update();
    }

    /**
     * Runs whenever the model's state changes (its transform or its line width).
     */
    update(...args: any[]): void {
        this.line.setLineWidth(this.model.lineWidth);
        this.setTransform(this.model.transform);
    }
}
