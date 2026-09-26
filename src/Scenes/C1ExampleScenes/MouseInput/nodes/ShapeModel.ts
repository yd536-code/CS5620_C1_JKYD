import {AssetManager, ASerializable, Color, Polygon2D, V2, Vec2} from "../../../../anigraph";
import {PolygonModel2D} from "../../../../anigraph/starter/nodes/polygon2D";

/**
 * # A shape you can hover, drag, rotate and delete
 *
 * A regular polygon with a few methods that the scene model calls in response to the mouse. The shape doesn't know
 * about the mouse; it only knows how to be highlighted, moved and rotated.
 *
 * Drawn by the engine's `PolygonView2D`.
 */
@ASerializable("MIShapeModel")
export class ShapeModel extends PolygonModel2D{
    /** The shape's size: the distance from its center to each corner, in world units. */
    static Radius = 1.2;

    /** The shape's normal color. */
    color: Color;

    /** Whether the cursor is over the shape, which draws it lighter. */
    hovered: boolean = false;

    /**
     * Builds a regular polygon with its vertices listed **clockwise**.
     * @param position where to put the shape, in world coordinates
     * @param nSides how many sides it has
     * @param color its color
     */
    constructor(position: Vec2 = V2(0, 0), nSides: number = 5, color: Color = Color.FromString("#3a7bd5")){
        super();
        this.color = color.clone();
        const verts = Polygon2D.CreateForRendering(true);
        for(let i=0;i<nSides;i++){
            const theta = Math.PI/2 - i*2*Math.PI/nSides;
            verts.addVertex(V2(Math.cos(theta), Math.sin(theta)).times(ShapeModel.Radius), this.color);
        }
        this.setVerts(verts);
        this.setMaterial(AssetManager.Create2DRGBAMaterial());
        this.prsa.position = position.clone();
    }

    /**
     * Highlights the shape (draws it lighter), or stops highlighting it.
     * @param hovered
     */
    setHovered(hovered: boolean){
        if(hovered === this.hovered){
            return;
        }
        this.hovered = hovered;
        this.verts.FillColor(hovered ? ShapeModel.Lightened(this.color, 0.4) : this.color);
        // Changing geometry doesn't notify the view on its own, so signal the change.
        this.signalGeometryUpdate();
    }

    /**
     * A lighter version of `color`: each of r, g, b moves `amount` of the way toward 1 (white).
     * @param color
     * @param amount from 0 (unchanged) to 1 (white)
     */
    static Lightened(color: Color, amount: number): Color{
        return Color.FromRGBA(
            color.r + (1 - color.r)*amount,
            color.g + (1 - color.g)*amount,
            color.b + (1 - color.b)*amount,
            color.a,
        );
    }

    /**
     * Moves the shape by `delta`.
     * @param delta in world coordinates (the shape is a top-level node, so that is also its parent's coordinates)
     */
    moveBy(delta: Vec2){
        this.prsa.position = this.prsa.position.plus(delta);
    }

    /**
     * Rotates the shape about its center.
     * @param angle in radians; positive is counter-clockwise
     */
    rotateBy(angle: number){
        this.prsa.rotation = this.prsa.rotation + angle;
    }
}
