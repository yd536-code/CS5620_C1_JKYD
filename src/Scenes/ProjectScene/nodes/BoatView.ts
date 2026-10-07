import {AGLNodeView, ALabel, APolygonGraphic2D} from "../../../anigraph";
import {BoatModel} from "./BoatModel";

@ALabel("BoatView")
export class BoatView extends AGLNodeView {
    /** The graphic that draws the polygon. */
    element!: APolygonGraphic2D;

    /** The model, typed as the class this view draws. */
    get model(): BoatModel {
        return this._model as BoatModel;
    }

    /**
     * Creates the graphics, once, when the view is created. Register each graphic with `registerAndAddGraphic` so
     * the view displays it and cleans it up when the view is released.
     */
    init(): void {
        this.element = new APolygonGraphic2D();
        this.element.init(this.model.verts, this.model.material);
        this.registerAndAddGraphic(this.element);

        // // Rebuild the graphic whenever the model signals that its geometry changed.
        // this.subscribe(this.model.addGeometryListener(()=>{
        //     this.seaBody.setVerts2D(this.model.verts);
        // }));

        this.update();
    }

    /**
     * Runs whenever the model's state changes, including its transform. Applies the model's transform.
     */
    update(...args: any[]): void {
        this.setTransform(this.model.transform);
    }
}