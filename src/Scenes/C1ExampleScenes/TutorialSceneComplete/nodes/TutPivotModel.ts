import {ASerializable, AssetManager, Color, V2} from "../../../../anigraph";
import {PolygonModel2D} from "../../../../anigraph/starter/nodes/polygon2D";
import {TutFactories} from "./TutFactories";

/**
 * Step 4.1: a square that rotates about one of its corners instead of its center, because its `anchor` is that
 * corner. The anchor is the point, in the node's own coordinates, that ends up at `position` and that the node
 * rotates and scales around:
 * `Matrix = Translate(position) * Rotate(rotation) * Scale(scale) * Translate(-anchor)`.
 */
@ASerializable("TutPivotModel")
export class TutPivotModel extends PolygonModel2D{
    /** Half the square's side length, so `V2(HalfSize, HalfSize)` is its upper-right corner. */
    static HalfSize = 0.6;

    constructor(){
        super();
        const color = Color.FromString("#8e44ad");
        this.setVerts(TutFactories.RegularPolygon(4, TutPivotModel.HalfSize*Math.SQRT2, color, Math.PI/4));
        this.setMaterial(AssetManager.CreateBasicMaterial(color));
        this.prsa.anchor = V2(TutPivotModel.HalfSize, TutPivotModel.HalfSize);
    }

    /**
     * Rotates as a function of time.
     * @param t the current time, in seconds
     * @param args anything else the caller passes
     */
    timeUpdate(t: number, ...args: any[]){
        super.timeUpdate(t, ...args);
        this.prsa.rotation = t;
    }
}
