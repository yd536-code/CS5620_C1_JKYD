import {ANodeModel, AGLNodeView} from "../../../scene";
import {CoordinateAxesModel3D} from "./CoordinateAxesModel3D";
import {ACoordinateAxesGraphic3D} from "../../../rendering/graphicelements/ACoordinateAxesGraphic3D";
import {Mat4} from "../../../math";

/**
 * View for {@link CoordinateAxesModel3D}. `update()` places the axes with the model's own transform and then scales
 * them by `axesScale`, so the axes move, turn, and resize along with the model.
 */
export class CoordinateAxesView3D extends AGLNodeView{
    coordinateAxesGraphic!: ACoordinateAxesGraphic3D

    get model():CoordinateAxesModel3D{
        return this._model as CoordinateAxesModel3D;
    }

    /** Creates a view and connects it to `model`. */
    static Create(model:ANodeModel, ...args:any[]){
        let view = new this();
        view.setModel(model);
        return view;
    }

    init(){
        this.coordinateAxesGraphic = new ACoordinateAxesGraphic3D();
        this.registerAndAddGraphic(this.coordinateAxesGraphic);
        this.update();
    }

    /**
     * Sets the render matrix to `transform * Scale3D(axesScale)`: the scale is applied first, in the axes' own
     * coordinates, so it changes the length of the axes without moving them. Also applies `lineWidth`.
     */
    update(): void {
        this.setTransform(this.model.getRenderMatrix().times(Mat4.Scale3D(this.model.axesScale)));
        this.coordinateAxesGraphic.setLineWidth(this.model.lineWidth);
    }
}
