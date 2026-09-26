// import {ALineGraphic, ALineSegmentsGraphic, ANodeView, Mat3, V2, V3, VertexArray2D} from "../../../../index";
import {ALineGraphic, ALineSegmentsGraphic} from "../../../../rendering";
import {AGLNodeView} from "../../../nodeView";
import {Mat3, V2, V3} from "../../../../math";
import {VertexArray2D} from "../../../../geometry";
import {VectorModel2D} from "./VectorModel2D";

/**
 * View for {@link VectorModel2D}: a line through the model's vertices plus a two-segment arrowhead at the tip, in
 * the color of the last vertex. The arrowhead points along the direction from the origin to the tip, so it looks
 * right for vectors drawn from the origin (in the model's own coordinates). The whole arrow is placed by the model's
 * transform.
 */
export class VectorView2D extends AGLNodeView {
    /** The graphic that draws the arrow's line. */
    line!: ALineGraphic;
    /** The graphic that draws the arrowhead. */
    arrowHead!: ALineSegmentsGraphic;
    /** The arrowhead's vertices in its own unit coordinates (placed by `_setArrowheadTransform`). */
    arrowHeadVerts!:VertexArray2D;

    // arrowhead!:ALineSegmentsGraphic;
    get model(): VectorModel2D {
        return this._model as VectorModel2D;
    }

    /** Creates a view for `model`, already connected to it. */
    static Create(model: VectorModel2D) {
        let view = new VectorView2D();
        view.setModel(model);
        return view;
    }

    /** The color of the model's last vertex, used for the arrowhead. */
    get headColor() {
        return this.model.verts.color.getAt(this.model.verts.nVerts - 1);
    }



    /** Creates the line and arrowhead graphics. */
    init() {
        this.line = new ALineGraphic();
        // this.line = new ALineSegmentsGraphic();
        this.line.init(this.model.verts, this.mainMaterial);
        this.line.setLineWidth(this.model.lineWidth);
        this.registerAndAddGraphic(this.line);

        this.arrowHeadVerts = new VertexArray2D();
        this.arrowHeadVerts.initColorAttribute();

        let headColor = this.headColor;
        this.arrowHeadVerts.addVertices([
                V2(),
                V2(-1, -1),
                V2(),
                V2(1, -1)
            ],
            [
                headColor,
                headColor,
                headColor,
                headColor
            ]
        )

        this.arrowHead = new ALineSegmentsGraphic();
        this.arrowHead.init(this.arrowHeadVerts, this.mainMaterial);
        this.arrowHead.setLineWidth(this.model.lineWidth);
        this._setArrowheadTransform();
        this.registerAndAddGraphic(this.arrowHead);


    }

    /** Places the arrowhead at the model's endpoint, scaled by `arrowheadSize` and pointing away from the origin. */
    _setArrowheadTransform(){
        let ep =this.model.getEndPoint();
        let tvec = ep.getNormalized();
        let ahs = this.model.arrowheadSize;
        let tvrot = V2(-tvec.y, tvec.x);
        let aht = Mat3.FromColumns(V3(tvrot.x, tvrot.y, 0).times(ahs), V3(tvec.x, tvec.y, 0).times(ahs), V3(ep.x, ep.y, 1));
        this.arrowHead.setTransform(aht);
    }

    /** Applies the model's transform, re-sends the model's vertices and line width, and moves the arrowhead to the tip. */
    update(): void {
        this.updateTransform();
        this.line.setVerts(this.model.verts);
        this.line.setLineWidth(this.model.lineWidth);
        this._setArrowheadTransform();
    }
}

