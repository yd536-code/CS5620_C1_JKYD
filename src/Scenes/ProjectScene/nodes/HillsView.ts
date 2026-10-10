import {AGLNodeView, ALabel, APolygonGraphic2D} from "../../../anigraph";
import {HillsModel} from "./HillsModel";

/** Draws the hills using the model's shape and color. */
@ALabel("HillsView")
export class HillsView extends AGLNodeView {
    hillsGraphic!: APolygonGraphic2D;

    get model(): HillsModel {
        return this._model as HillsModel;
    }

    init(): void {
        // Create and display the polygon.
        this.hillsGraphic = new APolygonGraphic2D();
        this.hillsGraphic.init(this.model.verts, this.model.material);
        this.registerAndAddGraphic(this.hillsGraphic);

        // Refresh the graphic if the vertices or colors change.
        this.subscribe(this.model.addGeometryListener(() => {
            this.hillsGraphic.setVerts2D(this.model.verts);
        }));

        this.update();
    }

    update(): void {
        // Apply position, scale, rotation, and depth.
        this.updateTransform();
    }
}