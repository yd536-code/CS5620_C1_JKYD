import {AGLNodeView} from "../../../nodeView";
import {ALineGraphic} from "../../../../rendering";
import {LineModel2D} from "./LineModel2D";


/**
 * View for {@link LineModel2D}: draws the model's vertices as a connected line, placed by the model's transform.
 */
export class LineView2D extends AGLNodeView{
    /** The graphic that draws the line. */
    line!:ALineGraphic;
    get model():LineModel2D{
        return this._model as LineModel2D;
    }
    /** Creates a view for `model`, already connected to it. */
    static Create(model:LineModel2D){
        let view = new LineView2D();
        view.setModel(model);
        return view;
    }

    /** Creates the line graphic from the model's vertices and material. */
    init(){
        this.line = new ALineGraphic();
        this.line.init(this.model.verts, this.mainMaterial);
        // this.line.setLineWidth();
        this.registerAndAddGraphic(this.line);
        // this.addGraphicToRoot(this.line);
    }

    /** Applies the model's transform, and re-sends the model's vertices and line width to the graphic. */
    update(): void {
        this.updateTransform();
        this.line.setVerts(this.model.verts);
        this.line.setLineWidth(this.model.lineWidth);
    }
}
