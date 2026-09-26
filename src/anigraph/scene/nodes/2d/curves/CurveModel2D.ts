import {ANodeModel2D} from "../../../nodeModel/ANodeModel2D";
import {ALineMaterialModel} from "../../../../rendering";

/** How a {@link CurveModel2D} connects its control points. */
export enum CurveInterpolationModes{
    Linear="Linear",
    CubicBezier="CubicBezier"
}

/**
 * A 2D curve node: its vertices are control points, connected by line segments or cubic Bezier segments depending
 * on `interpolationMode`. The vertices have a color attribute. This class holds the data; drawing it is up to the
 * view class a scene pairs it with.
 */
export class CurveModel2D extends ANodeModel2D {
    /**
     * Width (thickness) of the drawn curve. A plain field, not state: changing it does not update views by itself.
     */
    lineWidth: number = 0.05;

    /** The interpolation modes, `CurveModel2D.InterpolationModes.Linear` and `.CubicBezier` (see {@link CurveInterpolationModes}). */
    static InterpolationModes=CurveInterpolationModes;

    /** Backing value for `interpolationMode`. Defaults to `Linear`. */
    protected _interpolationMode:CurveInterpolationModes=CurveInterpolationModes.Linear;
    /**
     * The curve's interpolation mode. Setting it signals a geometry update, since the drawn curve changes shape.
     */
    set interpolationMode(value){
        this._interpolationMode = value;
        this.signalGeometryUpdate();
    }
    get interpolationMode(){return this._interpolationMode;}

    /** Creates a new line material (from `ALineMaterialModel.GlobalInstance`) for drawing the curve. */
    getStrokeMaterial() {
        return ALineMaterialModel.GlobalInstance.CreateMaterial();
    }

    /** Creates a new line material (from `ALineMaterialModel.GlobalInstance`) for drawing the control frame. */
    getFrameMaterial() {
        return ALineMaterialModel.GlobalInstance.CreateMaterial();
    }

    /** Creates an empty curve whose vertices have a color attribute. */
    constructor() {
        super();
        this.verts.initColorAttribute()
    }
}
