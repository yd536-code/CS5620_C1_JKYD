import {AObjectState} from "../../../../base";
import {ASerializable} from "../../../../base";
import {Color, Vec2, Vec3, Vec4} from "../../../../math";
import {ANodeModel2D} from "../../../nodeModel/ANodeModel2D";
import {VertexAttributeColor3DArray} from "../../../../geometry";

/**
 * A set of separate 2D line segments: vertices `2i` and `2i+1` are the ends of segment `i`. Drawn by
 * {@link LineSegmentsView2D}.
 */
@ASerializable("LineSegmentsModel2D")
export class LineSegmentsModel2D extends ANodeModel2D{
    /** Width of the segments. Defaults to 0.01. */
    @AObjectState lineWidth!:number;
    /** Creates an empty set of segments whose vertices have a color attribute. */
    constructor(){
        super();
        this.verts.color = new VertexAttributeColor3DArray()
        this.lineWidth = 0.01;
    }

    /**
     * Appends a segment. Does not signal a geometry update: call `signalGeometryUpdate()` after adding segments so
     * views redraw.
     */
    addLine(start:Vec2, end:Vec2, startColor:Color, endColor:Color){
        this.verts.addVertices([start, end], [startColor.Vec4, endColor.Vec4]);
        // this.signalGeometryUpdate();
    }

    /**
     * Overwrites segment `index` in place. Does not signal a geometry update: call `signalGeometryUpdate()`
     * afterwards so views redraw.
     */
    setLine(index:number, start:Vec2, end:Vec2, startColor:Color, endColor:Color){
        this.verts.position.setAt(index*2, start);
        this.verts.position.setAt(index*2+1, end);
        this.verts.color.setAt(index*2, startColor);
        this.verts.color.setAt(index*2+1, endColor);

        // this.verts.addVertices([start, end], [startColor.Vec4, endColor.Vec4]);
        // this.signalGeometryUpdate();
    }
}
