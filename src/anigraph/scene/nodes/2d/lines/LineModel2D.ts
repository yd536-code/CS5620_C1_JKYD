// import {ANodeModel2D} from "../../../../index";
// import {
//     AObjectState,
//     ASerializable,
//     Color,
//     Vec2, Vec3, Vec4
// } from "../../../../index";


import {AObjectState} from "../../../../base";
import {ASerializable} from "../../../../base";
import {Color, Vec2, Vec3, Vec4} from "../../../../math";
import {ANodeModel2D} from "../../../nodeModel/ANodeModel2D";

/**
 * A 2D polyline node: its vertices (with colors) are connected in order. Drawn by {@link LineView2D}.
 */
@ASerializable("LineModel2D")
export class LineModel2D extends ANodeModel2D{
    /** Width of the line. Defaults to 0.02. */
    @AObjectState lineWidth!:number;
    /** Creates an empty line whose vertices have a color attribute. */
    constructor(){
        super();
        // this.verts.initColor3DAttribute();
        this.verts.initColorAttribute()
        this.lineWidth = 0.02;
    }

    /**
     * Appends vertices to the line. Does not signal a geometry update: call `signalGeometryUpdate()` afterwards so
     * views redraw.
     * @param positions The new vertex positions.
     * @param colors Optional colors, one per position.
     */
    addVertices(positions: Vec2[] | Vec3[], colors?: Color[] | Vec3[] | Vec4[]){
        this.verts.addVertices(positions, colors);
    }
}
