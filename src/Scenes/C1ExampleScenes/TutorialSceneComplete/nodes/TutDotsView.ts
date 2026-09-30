import {ALabel} from "../../../../anigraph";
import {PolygonView2D} from "../../../../anigraph/starter/nodes/polygon2D";
import {TutDotGraphic} from "./TutDotGraphic";

/**
 * Step 6.8: a custom view. It extends `PolygonView2D`, so it draws its model's polygon the usual way, and then adds
 * one {@link TutDotGraphic} at each of the model's vertices. A graphic's transform is relative to its view, so the
 * dots move, rotate and scale with the node.
 */
@ALabel("TutDotsView")
export class TutDotsView extends PolygonView2D{
    /** The dots, one per vertex. */
    dots: TutDotGraphic[] = [];

    /** Draws the polygon (in `super.init()`), then adds the dots. */
    init(): void {
        super.init();
        const verts = this.model.verts;
        for(let v=0; v<verts.nVerts; v++){
            const dot = new TutDotGraphic(verts.vertexAt(v));
            this.registerAndAddGraphic(dot);
            this.dots.push(dot);
        }
    }
}
