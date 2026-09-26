// import {ANodeView, ALineSegmentsGraphic, VertexArray3D, VertexArray2D, Color} from "../../../../index";
import {AGLNodeView} from "../../../nodeView";
import {ALineSegmentsGraphic} from "../../../../rendering";

import {LineSegmentsModel2D} from "./LineSegmentsModel2D";
// import {VertexArray3D, VertexArray2D, Color} from "../../../../math";

/**
 * View for {@link LineSegmentsModel2D}: draws each pair of vertices as a separate segment, placed by the model's
 * transform.
 */
export class LineSegmentsView2D extends AGLNodeView{
    /** The graphic that draws the segments. */
    lineSegments!:ALineSegmentsGraphic;
    get model():LineSegmentsModel2D{
        return this._model as LineSegmentsModel2D;
    }
    /** Creates a view for `model`, already connected to it. */
    static Create(model:LineSegmentsModel2D){
        let view = new LineSegmentsView2D();
        view.setModel(model);
        return view;
    }

    /** Creates the segments graphic from the model's vertices, material and line width. */
    init(){
        // this.lines = new ALineSegmentsGraphic(VertexArray3D.CreateForRendering(false, false, true))
        this.lineSegments = ALineSegmentsGraphic.Create(this.model.verts, this.mainMaterial.threejs, this.model.lineWidth)
        // this.lines.setLineWidth(0.01);
        this.registerAndAddGraphic(this.lineSegments);
    }

    /** Applies the model's transform, and re-sends the model's vertices and line width to the graphic. */
    update(): void {
        this.updateTransform();
        this.lineSegments.setVerts(this.model.verts);
        this.lineSegments.setLineWidth(this.model.lineWidth);
    }
}
