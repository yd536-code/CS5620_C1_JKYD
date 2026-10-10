import {AGLNodeView, ALabel, APolygonGraphic2D} from "../../../anigraph";
import {BoatModel} from "./BoatModel";

@ALabel("BoatView")
export class BoatView extends AGLNodeView {
    /** The graphic that draws the polygon. */
    boatGraphic!: APolygonGraphic2D;
    mastGraphic!: APolygonGraphic2D;
    sailGraphic!: APolygonGraphic2D;


    /** The model, typed as the class this view draws. */
    get model(): BoatModel {
        return this._model as BoatModel;
    }

    /**
     * Creates the graphics, once, when the view is created. Register each graphic with `registerAndAddGraphic` so
     * the view displays it and cleans it up when the view is released.
     */
    init(): void {
        this.boatGraphic = new APolygonGraphic2D();
        this.boatGraphic.init(this.model.verts, this.model.material);
        this.registerAndAddGraphic(this.boatGraphic);

        //adding the mast to the boad
        this.mastGraphic = new APolygonGraphic2D();
        this.mastGraphic.init(BoatModel.makeMast(), this.model.material);
        this.registerAndAddGraphic(this.mastGraphic);
        //drawing the sail besides the mast
        this.sailGraphic = new APolygonGraphic2D();
        this.sailGraphic.init(BoatModel.makeSail(), this.model.material);
        this.registerAndAddGraphic(this.sailGraphic);
        // // Rebuild the graphic whenever the model signals that its geometry changed.
        this.subscribe(this.model.addGeometryListener(()=>{
            this.boatGraphic.setVerts2D(this.model.verts);
         }));

        this.update();
    }

    /**
     * Runs whenever the model's state changes, including its transform. Applies the model's transform.
     */
    update(...args: any[]): void {
        this.setTransform(this.model.transform);
    }
}