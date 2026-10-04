import {ANodeModel2D, ASerializable, AssetManager, Color, Polygon2D, V2} from "../../../anigraph";

@ASerializable("SeaModel")
export class SeaModel extends ANodeModel2D {
    constructor() {
        super();
        this.setVerts(SeaModel.makeSea());
        this.setMaterial(AssetManager.Create2DRGBAMaterial());
    }

    static makeSea(seaWidth:number = 200, seaDepth:number = 100): Polygon2D{
        // CreateForRendering(true) gives the polygon a color attribute, so each vertex can have its own color.
        let theSea = Polygon2D.CreateForRendering(true);
        for (let i = 0; i < 4; ++i)
            theSea.addVertex(V2( -seaWidth/2 + (i&1)*seaWidth, -((i >> 1) & 1) * seaDepth ),
                Color.FromString("#67ceef"));
        return theSea;
    }
}