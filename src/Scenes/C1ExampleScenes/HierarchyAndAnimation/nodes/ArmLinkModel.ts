import {ANodeModel2D, ASerializable, AssetManager, Color, Polygon2D, V2, Vec2} from "../../../../anigraph";
import {PolygonModel2D} from "../../../../anigraph/starter/nodes/polygon2D";

/**
 * # One link of the articulated arm
 *
 * A long, pointed hexagon. Each link is a child of the previous one (the first is a child of the `ArmModel`), so
 * rotating a link swings every link after it.
 *
 * **How a link sits on its parent.** A `NodeTransform2D` maps a point `p` in this link's coordinates to
 * `position + R(rotation) * S(scale) * (p - anchor)` in its parent's coordinates. So:
 * - `anchor` is the point *in this link's own coordinates* that the link rotates around: its joint, the left end.
 * - `position` is where that joint goes *in the parent's coordinates*: the parent link's tip (its right end).
 *
 * Drawn by the engine's `PolygonView2D`.
 */
@ASerializable("HAArmLinkModel")
export class ArmLinkModel extends PolygonModel2D{
    /** Distance from one joint to the next, in the link's own coordinates. */
    static Length = 1;
    /** Half the link's thickness. */
    static HalfWidth = 0.12;

    /** Which link this is in the arm, counting from the star (0). */
    index: number;
    /** The link's color when it isn't selected. */
    baseColor: Color;
    /** Whether the link is selected, and so drawn highlighted. */
    selected: boolean = false;

    /**
     * The link's outline: a hexagon centered on the origin, pointed at both ends, listed **clockwise**.
     * The joints are at x = -Length/2 (where it attaches to its parent) and x = +Length/2 (where its child attaches).
     */
    static LinkGeometry(): Polygon2D{
        const half = ArmLinkModel.Length/2;
        const w = ArmLinkModel.HalfWidth;
        const polygon = Polygon2D.CreateForRendering(true);
        const white = Color.White();   // placeholder; setColor() fills in the real color
        polygon.addVertex(V2(-half-w, 0), white);
        polygon.addVertex(V2(-half+w, w), white);
        polygon.addVertex(V2(half-w, w), white);
        polygon.addVertex(V2(half+w, 0), white);
        polygon.addVertex(V2(half-w, -w), white);
        polygon.addVertex(V2(-half+w, -w), white);
        return polygon;
    }

    /** This link's joint (where it attaches to its parent), in its own coordinates. */
    static Joint(): Vec2{
        return V2(-ArmLinkModel.Length/2, 0);
    }

    /** This link's tip (where its child attaches), in its own coordinates. */
    static Tip(): Vec2{
        return V2(ArmLinkModel.Length/2, 0);
    }

    /**
     * @param index which link this is, counting from the star
     * @param color the link's unselected color
     */
    constructor(index: number = 0, color: Color = Color.FromString("#4a6fa5")){
        super();
        this.index = index;
        this.baseColor = color.clone();
        this.setMaterial(AssetManager.Create2DRGBAMaterial());
        this.setVerts(ArmLinkModel.LinkGeometry());
        // Rotate around the joint, not the link's center.
        this.prsa.anchor = ArmLinkModel.Joint();
        this.refreshColor();
    }

    /**
     * Puts this link's joint at `position`, given in the parent's coordinates.
     * @param position
     */
    attachAt(position: Vec2){
        this.prsa.position = position.clone();
        this.signalTransformUpdate();
    }

    /**
     * Sets the angle of this link relative to its parent.
     * @param angle in radians; 0 points the same way as the parent
     */
    setAngle(angle: number){
        this.prsa.rotation = angle;
        this.signalTransformUpdate();
    }

    /** Sets the unselected color. */
    setColor(color: Color){
        this.baseColor = color.clone();
        this.refreshColor();
    }

    /** Selects or deselects the link. */
    setSelected(selected: boolean){
        this.selected = selected;
        this.refreshColor();
    }

    /** Recolors the vertices: the base color, or a darker version of it while selected. */
    refreshColor(){
        this.verts.FillColor(this.selected ? this.baseColor.GetDarkened(30) : this.baseColor);
        this.signalGeometryUpdate();
    }

    /**
     * The angle that would point this link at `worldPoint`.
     *
     * The link's angle is measured in its *parent's* coordinates, so we bring the point into those coordinates:
     * the parent's world transform maps parent coordinates to world coordinates, and its inverse goes the other way.
     * Then the angle is the direction from the joint (`position`, in parent coordinates) to that point.
     *
     * Using the direction directly as the angle only works because every scale above this link is uniform (the
     * star's scale slider scales x and y equally). A non-uniform scale would distort directions.
     * @param worldPoint a point in world coordinates, like the cursor
     */
    angleToward(worldPoint: Vec2): number{
        const parent = this.parent;
        // `parent` is typed loosely; check that it is a 2D node, which has getWorldTransform().
        const worldFromParent = (parent instanceof ANodeModel2D) ? parent.getWorldTransform() : undefined;
        const pointInParent = worldFromParent ? worldFromParent.getInverse().times(worldPoint) : worldPoint;
        const direction = pointInParent.minus(this.prsa.position);
        return Math.atan2(direction.y, direction.x);
    }
}
