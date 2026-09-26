import {AMaterial, APolygonGraphic2D, AssetManager, Color, Mat3, Polygon2D, V2, Vec2} from "../../../../anigraph";

/**
 * # A custom graphic element
 *
 * A small triangle with a red, a green and a blue corner. A *graphic element* is one drawable piece of a view (a
 * polygon, a line, a mesh...). A view can hold any number of them, and you can write your own element classes, like
 * this one, when you want to reuse a piece of drawing.
 *
 * Every marker shares one triangle geometry and one material, created the first time a marker is made.
 */
export class VertexMarkerGraphic extends APolygonGraphic2D{
    /** The marker's size, in world units. */
    static Size = 0.35;

    /** The triangle, listed clockwise (see `ColorWheel.Outline`), with a different color at each corner. */
    static Geometry?: Polygon2D;

    /** The material shared by every marker. */
    static Material?: AMaterial;

    /**
     * @param position where to draw the marker, in the coordinates of the view it is added to
     */
    constructor(position: Vec2){
        if(!VertexMarkerGraphic.Geometry){
            const s = VertexMarkerGraphic.Size;
            VertexMarkerGraphic.Geometry = Polygon2D.FromLists(
                [V2(0, s), V2(s*0.87, -s*0.5), V2(-s*0.87, -s*0.5)],
                [Color.FromString("#ff0000"), Color.FromString("#00cc00"), Color.FromString("#0044ff")]
            );
            VertexMarkerGraphic.Material = AssetManager.Create2DRGBAMaterial();
        }
        super(VertexMarkerGraphic.Geometry, VertexMarkerGraphic.Material);
        this.setTransform(Mat3.Translation2D(position));
    }
}
