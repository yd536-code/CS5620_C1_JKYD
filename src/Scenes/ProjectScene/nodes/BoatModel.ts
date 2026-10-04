import {ANodeModel2D, ASerializable, AssetManager, Color, Polygon2D, V2} from "../../../anigraph";

@ASerializable("BoatModel")
export class BoatModel extends ANodeModel2D {
    constructor() {
        super();
        this.setVerts(BoatModel.makeBoat());
        this.setMaterial(AssetManager.Create2DRGBAMaterial());
    }

    static makeBoat(seaWidth:number = 200, seaDepth:number = 100): Polygon2D{
        // CreateForRendering(true) gives the polygon a color attribute, so each vertex can have its own color.
        let theBoat = Polygon2D.CreateForRendering(true);
        const BoatColor = Color.FromString("#cf7049");
        theBoat.addVertex(V2(-1.5, 0.35), BoatColor);
        theBoat.addVertex(V2(-1.05, -0.35), BoatColor);
        theBoat.addVertex(V2(0.9, -0.35), BoatColor);
        theBoat.addVertex(V2(1.5, 0.35), BoatColor);
        return theBoat;
    }
}