import {AGLNodeView, ALabel, ALineGraphic, ALineMaterialModel, Color, Mat3} from "../../../anigraph";
import {SeaBodyFill} from "./SeaBodyFill";

@ALabel("SeaBodyView")
export class SeaBodyView extends AGLNodeView {
    seaBody!: ALineGraphic;      // actual waterline for physics
    copies: ALineGraphic[] = []; // One graphic per copy

    /** The model, typed as the class this view draws. */
    get model(): SeaBodyFill {
        return this._model as SeaBodyFill;
    }

    /**
     * Creates the graphics, once, when the view is created. Register each graphic with `registerAndAddGraphic` so
     * the view displays it and cleans it up when the view is released.
     */
    init(): void {
        let material = ALineMaterialModel.GlobalInstance.CreateMaterial();
        this.seaBody = new ALineGraphic();
        this.seaBody.init(this.model.verts, material);
        this.createCopies();
        this.updateCopies();
        // this.registerAndAddGraphic(this.seaBody);
        this.update();

        this.subscribe(this.model.addGeometryListener(()=>{
            this.seaBody.setVerts2D(this.model.verts);
            if(this.copies.length !== this.model.nCopies)
                this.createCopies();
            this.updateCopies();
        }));
    }

    createCopies() {
        for (const copy of this.copies)
            this.disposeGraphic(copy);  // dispose older graphic
        this.copies = [];
        for (let i = 0; i < this.model.nCopies; ++i) {
            const copy = new ALineGraphic();
            copy.init(this.model.verts, ALineMaterialModel.GlobalInstance.CreateMaterial());
            this.registerAndAddGraphic(copy);
            this.copies.push(copy);
            copy.setLineWidth(0.03 + 0.01*i);
        }
    }
    updateCopies() {
        const time = SeaBodyFill.time;
        for (let i = 0; i < this.model.nCopies; ++i) {
            this.copies[i].setVerts2D(this.model.verts);
            this.copies[i].setTransform2D(this.model.getVertsForCopy(i), 0.001*i);
        }
    }

    /**
     * Runs whenever the model's state changes, including its transform. Applies the model's transform.
     */
    update(...args: any[]): void {
        // this.seaBody.setLineWidth(this.model.lineWidth);
        this.setTransform(this.model.transform);
    }
}