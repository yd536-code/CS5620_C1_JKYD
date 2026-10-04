import {ASerializable, AssetManager, Color, V2} from "../../../../anigraph";
import {PolygonModel2D} from "../../../../anigraph/starter/nodes/polygon2D";
import {TutFactories} from "./TutFactories";

@ASerializable("TutPivotModel")
export class TutPivotModel extends PolygonModel2D {
    static HalfSize = 0.6;

    constructor() {
        super();
        const color = Color.FromString("#8e44ad");
        this.setVerts(TutFactories.RegularPolygon(
            4, TutPivotModel.HalfSize * Math.SQRT2, color, Math.PI/4));
        this.setMaterial(AssetManager.CreateBasicMaterial(color));
        this.prsa.anchor = V2(TutPivotModel.HalfSize, TutPivotModel.HalfSize); // upper-right corner
    }

    timeUpdate(t: number, ...args: any[]) {
        super.timeUpdate(t, ...args);
        this.prsa.rotation = t;
    }
}