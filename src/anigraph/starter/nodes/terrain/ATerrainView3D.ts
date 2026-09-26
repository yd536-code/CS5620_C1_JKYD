import {AGLNodeView} from "../../../scene";
import {ATriangleMeshGraphic} from "../../../rendering";
import {ANodeModel} from "../../../scene";
import {ATerrainModel3D} from "./ATerrainModel3D";
import {APlaneGraphic3D} from "../../../rendering/graphicelements/APlaneGraphic3D";

/** View for an {@link ATerrainModel3D}: a plane graphic with the model's size and segment counts, drawn with the
 * model's material. */
export class ATerrainView3D extends AGLNodeView{
    graphicElement!:APlaneGraphic3D;

    get model():ATerrainModel3D{
        return this._model as ATerrainModel3D;
    }

    /** Creates a view and connects it to `model`. */
    static Create(model:ANodeModel, ...args:any[]){
        let view = new ATerrainView3D();
        view.setModel(model);
        return view;
    }

    init(){
        this.graphicElement = APlaneGraphic3D.Create(this.model, this.mainMaterial);
        this.registerAndAddGraphic(this.graphicElement);
        this.setTransform(this.model.transform);
    }

    update(): void {
        // this.graphicElement.setTransform(this.model.transform);
        // this.graphicElement.setTransform(this.model.getWorldTransform());
        this.setTransform(this.model.transform);
    }

}

