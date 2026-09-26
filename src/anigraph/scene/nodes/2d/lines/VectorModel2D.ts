import {ASerializable, AObjectState} from "../../../../base";
import {ANodeModel2D} from "../../../nodeModel/ANodeModel2D";
import {Color, V2, Vec2, Vec3, Vec4} from "../../../../math";

/**
 * A 2D arrow: a polyline through its vertices, with an arrowhead at the last vertex. Drawn by {@link VectorView2D}.
 */
@ASerializable("VectorModel2D")
export class VectorModel2D extends ANodeModel2D{
    /** Width of the line and arrowhead. Defaults to 0.002. */
    @AObjectState lineWidth!:number;
    /** Scale of the arrowhead. Defaults to 10. */
    @AObjectState arrowheadSize!:number;

    /** Creates an empty arrow whose vertices have a color attribute. Add vertices with `addVertices`. */
    constructor(){
        super();
        this.verts.initColorAttribute()
        this.lineWidth = 0.002;
        this.arrowheadSize = 10;
    }

    /**
     * Appends vertices. Does not signal a geometry update: call `signalGeometryUpdate()` afterwards so views redraw.
     */
    addVertices(positions: Vec2[] | Vec3[], colors?: Color[] | Vec3[] | Vec4[]){
        this.verts.addVertices(positions, colors);
    }
    /** Moves the last vertex (the arrow's tip) to `position` and signals a geometry update. */
    setEndpoint(position:Vec2){
        this.verts.position.setAt(this.verts.nVerts-1, position);
        this.signalGeometryUpdate()
    }

    /** Returns the position of the last vertex (the arrow's tip). */
    getEndPoint(){
        let ep3 = this.verts.position.getAt(this.verts.nVerts-1);
        return V2(ep3.x, ep3.y);
    }

}

