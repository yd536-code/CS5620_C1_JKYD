import {AssetManager, ASerializable, Color, Polygon2D, V2, Vec2} from "../../../../anigraph";
import {PolygonModel2D} from "../../../../anigraph/starter/nodes/polygon2D";

/**
 * # A moon
 *
 * A small regular polygon. A moon has no behavior of its own: it orbits only because it is a child of an
 * `OrbitModel`, which rotates. The scene model moves moons between the orbit and the top level of the scene.
 *
 * Drawn by the engine's `PolygonView2D`.
 */
@ASerializable("ADMoonModel")
export class MoonModel extends PolygonModel2D{
    /** The moon's size: the distance from its center to each corner, in its own coordinates. */
    static Radius = 0.7;

    /**
     * @param position where to put the moon, in its parent's coordinates
     * @param nSides how many sides it has
     * @param color its color
     */
    constructor(position: Vec2 = V2(0, 0), nSides: number = 4, color: Color = Color.FromString("#29a36a")){
        super();
        // A regular polygon, listed clockwise.
        const verts = Polygon2D.CreateForRendering(true);
        for(let i=0;i<nSides;i++){
            const theta = Math.PI/2 - i*2*Math.PI/nSides;
            verts.addVertex(V2(Math.cos(theta), Math.sin(theta)).times(MoonModel.Radius), color);
        }
        this.setVerts(verts);
        this.setMaterial(AssetManager.Create2DRGBAMaterial());
        this.prsa.position = position.clone();
    }
}
