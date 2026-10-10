import {ASerializable, AssetManager, Color, Polygon2D, V2} from "../../../anigraph";
import {PolygonModel2D} from "../../../anigraph/starter/nodes/polygon2D";

@ASerializable("CosmicMicrowaveBackground")
export class CosmicMicrowaveBackground {
    static makeBackground(semiDiameter: number, nSides: number, color: Color){
        let theBackgroundVerts = Polygon2D.CreateForRendering(true);

        for (let i = 0; i < nSides; ++i) {
            const i_ang = 2 * Math.PI * i / nSides;
            theBackgroundVerts.addVertex(
                V2(semiDiameter*Math.cos(i_ang),
                   semiDiameter*Math.sin(i_ang)));
        }

        const theBackground = new PolygonModel2D(theBackgroundVerts);
        theBackground.setMaterial(AssetManager.CreateBasicMaterial(color));
        theBackground.zValue = -0.2; // Behind the hills.
        return theBackground;
    }
}