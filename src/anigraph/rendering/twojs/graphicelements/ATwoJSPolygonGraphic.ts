import {ATwoJSGraphicObject} from "../ATwoJSGraphicObject";
import {ATwoJSDisplayObject} from "../ATwoJSDisplayObject";
import {Color} from "../../../math";
import {VertexArray2D} from "../../../geometry";
import {Two, TwoGroup, TwoPath} from "../TwoJSImport";

/**
 * A closed polygon driven by an AniGraph {@link VertexArray2D}, rendered via Two.js.
 *
 * Similar to {@link ATwoJSPathGraphic} but takes a `VertexArray2D` instead of a raw
 * point array, making it easy to attach directly to a geometry-bearing model.
 * The path is always closed (the last anchor connects back to the first).
 *
 * Call `setVerts` whenever the vertex data changes; it replaces the old
 * `Two.Path` entirely.
 */
export class ATwoJSPolygonGraphic extends ATwoJSGraphicObject {
    protected _path: TwoPath | null = null;

    /**
     * @param verts  Initial vertex array (optional; call `setVerts` later if omitted).
     * @param color  Fill color (default: opaque white). Stroke defaults to opaque black.
     */
    constructor(verts?: VertexArray2D, color?: Color) {
        super(color);
        const group: TwoGroup = new Two.Group();
        this._displayObject = new ATwoJSDisplayObject(group);
        if (verts) {
            this.setVerts(verts);
        }
    }

    /** The current Two.js path shape, or null if no vertices have been set. */
    get twoShape(): TwoPath | null {
        return this._path;
    }

    /**
     * Replaces the polygon geometry from a `VertexArray2D`.
     *
     * Reads `verts.position` and converts each vertex to a `Two.Anchor`. The
     * current material style is re-applied to the new shape. If the array is
     * empty, the old path is removed, no new one is added, and `twoShape`
     * becomes null until vertices are set again.
     */
    setVerts(verts: VertexArray2D): void {
        const group: TwoGroup = this._displayObject.nativeGroup;
        if (this._path) {
            group.remove(this._path);
            this._path = null;
        }
        const positions = verts.position;
        if (!positions || positions.nVerts === 0) return;
        const anchors: any[] = [];
        for (let i = 0; i < positions.nVerts; i++) {
            const p = positions.getAt(i);
            anchors.push(new Two.Anchor(p.x, p.y));
        }
        this._path = new Two.Path(anchors, true, false);
        this._material.applyToShape(this._path);
        group.add(this._path);
    }
}
