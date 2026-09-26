import {ANodeModel2D} from "../../../scene";
import type {TransformationInterface} from "../../../math";
import {ASerializable} from "../../../base";
import {Polygon2D} from "../../../geometry";
import {Color, Mat3, TransformationInterface2D, Vec2} from "../../../math";

/**
 * A 2D node whose geometry is a {@link Polygon2D} (drawn by {@link PolygonView2D}). Its transform works like any 2D
 * node's: edit it through `prsa` (e.g. `node.prsa.position = V2(1, 0)`), which redraws automatically. `prsa`
 * throws if the transform is a `Mat3` (e.g. one passed to the constructor): check `transformIsPRSA` or call
 * `convertTransformToPRSA()` first. If you edit the
 * vertices in place, call `signalGeometryUpdate()` afterward (`setVerts` does this for you).
 */
@ASerializable("PolygonModel2D")
export class PolygonModel2D extends ANodeModel2D{
    /** The polygon's vertices, in object coordinates. */
    get verts(): Polygon2D{
        return this._geometry.verts as Polygon2D;
    }


    /**
     * Makes `newChild` a child of this node, removing it from its current parent first (`reparent`).
     * @param newChild
     */
    adoptChild(newChild:PolygonModel2D){
        // newChild.reparent(this, false);
        newChild.reparent(this);
    }

    /**
     * @param verts the polygon. Defaults to an empty polygon with vertex colors and texture coordinates.
     * @param transform the initial transform, stored as given (a `NodeTransform2D` or a `Mat3`). Defaults to an
     * identity `NodeTransform2D`.
     */
    constructor(verts?: Polygon2D, transform?: TransformationInterface, ...args: any[]) {
        // Pass the transform to the base constructor, which stores it as given (before any transform exists,
        // `setTransform` has no representation to keep), so a node constructed with a `Mat3` holds a `Mat3`. With
        // no transform, it sets the default representation (see `ANodeModel2D.setTransformToIdentity`).
        super(undefined, transform as TransformationInterface2D|undefined, ...args);
        this.setVerts(
            verts??Polygon2D.CreateForRendering(true, true, false)
        )
    }

    /**
     * Returns the node's transform as a 4x4 matrix: the 2D transform embedded as a 2D homogeneous 4x4 matrix, with
     * `zValue` as its z translation. The same as `getRenderMatrix()`.
     */
    getTransform3D() {
        return this.getRenderMatrix();
    }

    /**
     * Sets every vertex's color to `color`.
     * @param color
     */
    setUniformColor(color:Color){
        this.verts.FillColor(color);
    }


//     ///////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    /**
     * Returns the transform from object coordinates (the coordinate system `this.verts` is defined in) to world
     * coordinates: the product of this node's and its 2D ancestors' transform matrices.
     * @returns {Mat3}
     */
    getWorldTransform2D():Mat3{
        // No 3D check needed: `AObjectNode._addChild` rejects mixing 2D and 3D node models, so a node-model parent
        // here is always 2D.
        let parent = this.parent;
        if(parent && parent instanceof ANodeModel2D){
            return parent.getWorldTransform().times(this.transform.getMatrix());
        }else{
            return this.transform.getMatrix();
        }
    }

    /**
     * Returns the points where this polygon's edges cross `other`'s edges, in world coordinates (both polygons are
     * transformed to world space, then compared with `Polygon2D.getIntersectionsWithPolygon`).
     * @param other
     * @returns {Vec2[]}
     */
    getIntersectionsWith(other: PolygonModel2D): Vec2[] {
        let thisGeometry = this.verts.GetTransformedBy(this.getWorldTransform2D());
        let otherGeometry = other.verts.GetTransformedBy(other.getWorldTransform2D());
        return thisGeometry.getIntersectionsWithPolygon(otherGeometry);
    }


}


