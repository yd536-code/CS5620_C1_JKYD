import {
    ANodeModel2D, ASerializable, AssetManager, Color, Polygon2D, V2
} from "../../../anigraph";

/** A background layer of hills. */
@ASerializable("HillsModel")
export class HillsModel extends ANodeModel2D {
    constructor() {
        super();

        let hills = Polygon2D.CreateForRendering(true);
        let color = Color.FromString("#567568");

        // Follow the hilltops from left to right.
        hills.addVertex(V2(-20, 2), color);
        hills.addVertex(V2(-14, 3), color);
        hills.addVertex(V2(-9, 2.6), color);
        hills.addVertex(V2(-4, 1.5), color);
        hills.addVertex(V2(2, 1.2), color);
        hills.addVertex(V2(8, 2.4), color);
        hills.addVertex(V2(14, 3.2), color);
        hills.addVertex(V2(20, 2), color);

        // Close the shape below the waterline.
        hills.addVertex(V2(20, -3), color);
        hills.addVertex(V2(-20, -3), color);

        this.setVerts(hills);
        this.setMaterial(AssetManager.Create2DRGBAMaterial());
    }
}