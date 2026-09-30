import {AMaterial, APolygonGraphic2D, AssetManager, Color, Mat3, Polygon2D, Vec2} from "../../../../anigraph";
import {TutFactories} from "./TutFactories";

/**
 * Step 6.8: a custom graphic element: a small dark hexagon. All dots share one geometry and one material, created
 * the first time a dot is made. Sharing is fine here because the dots live exactly as long as their view; see the
 * caution about disposing graphics in the docs' Custom views section.
 */
export class TutDotGraphic extends APolygonGraphic2D{
    /** The dot's radius. */
    static Radius = 0.15;

    /** The geometry every dot shares. */
    static Geometry?: Polygon2D;

    /** The material every dot shares. */
    static Material?: AMaterial;

    /**
     * @param position where the dot goes, in its view's coordinates
     */
    constructor(position: Vec2){
        if(!TutDotGraphic.Geometry){
            const color = Color.FromString("#222222");
            TutDotGraphic.Geometry = TutFactories.RegularPolygon(6, TutDotGraphic.Radius, color);
            TutDotGraphic.Material = AssetManager.Create2DRGBAMaterial();
        }
        super(TutDotGraphic.Geometry, TutDotGraphic.Material);
        // A small z, so the dot is drawn in front of the polygon it sits on.
        this.setTransform2D(Mat3.Translation2D(position), 0.01);
    }
}
