import {ALabel} from "../../../../anigraph";
import {PolygonView2D} from "../../../../anigraph/starter/nodes/polygon2D";
import {VertexMarkerGraphic} from "./VertexMarkerGraphic";

/**
 * # A view with several graphic elements
 *
 * Draws a polygon the usual way (it extends the engine's `PolygonView2D`), then adds a `VertexMarkerGraphic` at each
 * of the polygon's vertices. All of the elements belong to this one view, so they all move with the model's
 * transform.
 *
 * The model is a plain `PolygonModel2D` subclass, `MarkedShapeModel`: the markers are purely a matter of how the
 * model is drawn, so they live in the view.
 */
@ALabel("MarkedShapeView")
export class MarkedShapeView extends PolygonView2D{
    /** One marker per vertex of the model. */
    markers: VertexMarkerGraphic[] = [];

    /**
     * Creates the polygon (in `super.init()`), then one marker per vertex.
     */
    init(): void {
        super.init();
        const verts = this.model.verts;
        for(let v=0; v<verts.nVerts; v++){
            const marker = new VertexMarkerGraphic(verts.vertexAt(v));
            this.registerAndAddGraphic(marker);
            this.markers.push(marker);
        }
    }
}
