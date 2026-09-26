import {ATwoJSGraphicObject} from "../ATwoJSGraphicObject";
import {ATwoJSDisplayObject} from "../ATwoJSDisplayObject";
import {Color, Vec2} from "../../../math";
import {Two, TwoGroup, TwoPath} from "../TwoJSImport";

/**
 * A straight line segment rendered via Two.js.
 *
 * Default endpoints: (0, 0) → (1, 0). Endpoints can be updated in-place via
 * `setEndpoints`, which mutates the Two.js `Line` vertices so Two.js can
 * re-render without creating a new shape.
 *
 * A line has no fillable area, so fill is disabled by default (`setWireframe`)
 * and `color` is applied as the stroke color via `setStroke`.
 */
export class ATwoJSLineGraphic extends ATwoJSGraphicObject {
    protected _line: any;

    /**
     * @param start  Start point in the owning view's local coordinates (default: origin).
     * @param end    End point in the owning view's local coordinates (default: (1, 0)).
     * @param color  Stroke color (default: opaque black).
     */
    constructor(start?: Vec2, end?: Vec2, color?: Color) {
        super();
        const s = start ?? new Vec2(0, 0);
        const e = end ?? new Vec2(1, 0);
        this._line = new Two.Line(s.x, s.y, e.x, e.y);
        const group: TwoGroup = new Two.Group();
        group.add(this._line);
        this._displayObject = new ATwoJSDisplayObject(group);
        this.setWireframe(true);
        if (color) {
            this.setStroke(color);
        }
    }

    /** The Two.js `Line`. */
    get twoShape(): TwoPath {
        return this._line;
    }

    /**
     * Moves the line endpoints in place by directly mutating the Two.js
     * `Line.vertices` array. More efficient than creating a new shape each frame.
     */
    setEndpoints(start: Vec2, end: Vec2): void {
        const v = this._line.vertices as any[];
        if (v && v.length >= 2) {
            v[0].set(start.x, start.y);
            v[1].set(end.x, end.y);
        }
    }
}
