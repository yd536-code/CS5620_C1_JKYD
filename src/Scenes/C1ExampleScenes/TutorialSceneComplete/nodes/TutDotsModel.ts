import {ASerializable, AssetManager, Color} from "../../../../anigraph";
import {PolygonModel2D} from "../../../../anigraph/starter/nodes/polygon2D";
import {TutFactories} from "./TutFactories";

/**
 * Step 6.8: an ordinary pentagon. It is its own class only so the controller can pair it with
 * {@link TutDotsView}, which adds a dot at each vertex. The dots are about how the shape is drawn, so they live in
 * the view, not here.
 */
@ASerializable("TutDotsModel")
export class TutDotsModel extends PolygonModel2D{
    constructor(){
        super();
        const color = Color.FromString("#e98a15");
        this.setVerts(TutFactories.RegularPolygon(5, 1, color));
        this.setMaterial(AssetManager.CreateBasicMaterial(color));
    }
}
