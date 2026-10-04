import {AGLNodeView, ALabel, ALineGraphic, ALineMaterialModel} from "../../../../anigraph";
import {TutLineModel} from "./TutLineModel";

@ALabel("TutlineView")
export class TutLineView extends AGLNodeView{
    line!: ALineGraphic;
    get model(): TutLineModel { return this._model as TutLineModel; }

    init(): void {
        // One line material can be shared by many lines. It uses the vertex colors.
        const material = ALineMaterialModel.GlobalInstance.CreateMaterial();
        this.line = new ALineGraphic();
        this.line.init(this.model.verts, material);
        this.registerAndAddGraphic(this.line);

        this.subscribe(this.model.addGeometryListener(()=>{
            this.line.setVerts2D(this.model.verts);
        }));
        this.update();
    }

    update(...args: any[]): void {
        this.line.setLineWidth(this.model.lineWidth);
        this.setTransform(this.model.transform);
    }
}