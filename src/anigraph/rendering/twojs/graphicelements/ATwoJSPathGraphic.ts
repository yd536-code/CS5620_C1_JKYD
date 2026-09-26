import {ATwoJSGraphicObject} from "../ATwoJSGraphicObject";
import {ATwoJSDisplayObject} from "../ATwoJSDisplayObject";
import {Color, Vec2} from "../../../math";
import {Two, TwoGroup, TwoPath} from "../TwoJSImport";

/**
 * An open or closed polygonal path rendered via Two.js.
 *
 * Points are supplied as an array of `Vec2` values and converted to
 * `Two.Anchor` objects internally. Calling `setPoints` again discards the
 * previous path and creates a new `Two.Path` shape — use this when the vertex
 * count changes. For same-count updates you may prefer to mutate the anchor
 * positions directly on `twoShape.vertices`.
 */
export class ATwoJSPathGraphic extends ATwoJSGraphicObject {
    /** Null until at least one `setPoints` call has provided vertices. */
    protected _path: any = null;

    /**
     * @param points  Initial vertex list (optional; call `setPoints` later if omitted).
     * @param closed  Whether the path closes back to its first point.
     * @param color   Fill color (default: opaque white). Stroke defaults to opaque black.
     */
    constructor(points?: Vec2[], closed: boolean = false, color?: Color) {
        super(color);
        const group: TwoGroup = new Two.Group();
        this._displayObject = new ATwoJSDisplayObject(group);
        if (points && points.length > 0) {
            this.setPoints(points, closed);
        }
    }

    /** The current Two.js path shape, or null if no points have been set yet. */
    get twoShape(): TwoPath | null {
        return this._path ?? null;
    }

    /**
     * Replaces the path geometry with a new set of vertices.
     *
     * Removes the old `Two.Path` from the group (if any), constructs anchors
     * from `points`, and adds a fresh path. The current material style is
     * re-applied to the new shape.
     *
     * @param points  New vertex positions.
     * @param closed  True to close the path back to the first vertex.
     */
    setPoints(points: Vec2[], closed: boolean = false): void {
        const group: TwoGroup = (this._displayObject as ATwoJSDisplayObject).nativeGroup;
        if (this._path) {
            group.remove(this._path);
        }
        const anchors = points.map(p => new Two.Anchor(p.x, p.y));
        this._path = new Two.Path(anchors, closed, false);
        this._material.applyToShape(this._path);
        group.add(this._path);
    }
}
