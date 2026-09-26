import {AssetManager, ASerializable, Color, Polygon2D, V2} from "../../../../anigraph";
import {PolygonModel2D} from "../../../../anigraph/starter/nodes/polygon2D";

/**
 * A pentagon drawn by `MarkedShapeView`, which adds a small marker at each vertex. The model itself is an ordinary
 * polygon; it exists as its own class so that the controller can pair it with that view.
 */
@ASerializable("MarkedShapeModel")
export class MarkedShapeModel extends PolygonModel2D{
    /**
     * Builds a pentagon (clockwise) with a single flat color.
     */
    constructor(){
        super();
        const verts = Polygon2D.CreateForRendering(true);
        for(let i=0;i<5;i++){
            const theta = Math.PI/2 - i*2*Math.PI/5;
            verts.addVertex(V2(Math.cos(theta), Math.sin(theta)).times(1.3), Color.FromString("#8844cc"));
        }
        this.setVerts(verts);
        this.setMaterial(AssetManager.Create2DRGBAMaterial());
    }
}
