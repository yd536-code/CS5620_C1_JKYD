import {AGLNodeView, ALabel, ALineGraphic, ALineMaterialModel, Color, Mat3, V2} from "../../../anigraph";
import {SeaBodyFill} from "./SeaBodyFill";
import {SeaModel} from "./SeaModel";
import {UniverseExiter} from "./UniverseExiter";

@ALabel("SeaBodyView")
export class SeaBodyView extends AGLNodeView {
    copies: ALineGraphic[] = []; // One graphic per copy of waterline

    /** The model, typed as the class this view draws. */
    get model(): SeaBodyFill {
        return this._model as SeaBodyFill;
    }

    /**
     * Creates the graphics, once, when the view is created. Register each graphic with `registerAndAddGraphic` so
     * the view displays it and cleans it up when the view is released.
     */
    init(): void {
        this.createCopies();
        this.updateCopies();
        this.update();

        this.subscribe(this.model.addGeometryListener(()=>{
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
            copy.setLineWidth(SeaModel.SeaLineWidth * 2 + 0.004 * i);
            this.registerAndAddGraphic(copy);
            this.copies.push(copy);
        }

    }
    updateCopies() {
        for (let i = 0; i < this.model.nCopies; ++i) {
            this.copies[i].setTransform2D(this.model.getVertsForCopy(i), 0.001*(i+1));
            this.copies[i].setVerts2D(this.model.verts);
        }
    }

    /**
     * Runs whenever the model's state changes, including its transform. Applies the model's transform.
     */
    update(...args: any[]): void {
        // this.seaBody.setLineWidth(this.model.lineWidth);
        for (let i = 0; i < this.model.nCopies; ++i) {
            const copyShift = this.model.getVertsForCopy(i);
            let curLinewidth = SeaModel.SeaLineWidth * Math.abs(copyShift.getElement(1,2));
            curLinewidth *= (this.model.lineWidth === SeaModel.SeaLineWidth)
                ? 1 : 1.5*UniverseExiter.cosmicContract;
            this.copies[i].setLineWidth(curLinewidth);
        }
        console.log(...args);
        this.setTransform(this.model.transform);
    }
}