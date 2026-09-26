import {AGraphicElement} from "../graphicobject";
import {Color} from "../../math";
import {VertexArray2D} from "../../geometry";

/** A small filled circle (radius 1, 16 sides) meant for drawing draggable control handles. */
export class HandleGraphic2D extends AGraphicElement{
    /** @param color Fill color (default mid gray). */
    constructor(color?:Color) {
        let verts = VertexArray2D.CircleVArray(1.0);
        super(verts, color??Color.FromRGBA(0.5,0.5,0.5,1.0));
    }
}
