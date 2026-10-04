import {AGLNodeView, ALabel, ALineGraphic, ALineMaterialModel} from "../../../anigraph";
import {SeaModel} from "./SeaModel";

@ALabel("SeaView")
export class SeaView extends AGLNodeView {
    /** The graphic that draws the polygons. */
    sea!: ALineGraphic;

    /** The model, typed as the class this view draws. */
    get model(): SeaModel {
        return this._model as SeaModel;
    }

    /**
     * Creates the graphics, once, when the view is created. Register each graphic with `registerAndAddGraphic` so
     * the view displays it and cleans it up when the view is released.
     */
    init(): void {
        const material = ALineMaterialModel.GlobalInstance.CreateMaterial();
        this.sea = new ALineGraphic();
        this.sea.init(this.model.verts, material);
        this.registerAndAddGraphic(this.sea);

        this.subscribe(this.model.addGeometryListener(()=>{
            this.sea.setVerts2D(this.model.verts);
        }));
        this.update();
    }

    /**
     * Runs whenever the model's state changes, including its transform. Applies the model's transform.
     */
    update(...args: any[]): void {
        this.sea.setLineWidth(this.model.lineWidth);
        this.setTransform(this.model.transform);
    }
}