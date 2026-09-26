import {ATwoJSGraphicObject} from "../ATwoJSGraphicObject";
import {ATwoJSDisplayObject} from "../ATwoJSDisplayObject";
import {Color} from "../../../math";
import {Two, TwoGroup, TwoPath} from "../TwoJSImport";

/**
 * A filled circle rendered via Two.js.
 *
 * The circle is centered at the local origin (0, 0) of its group; position is
 * controlled by the owning {@link ATwoJSNodeView}'s transform.
 * Default style: white fill, black 1px stroke.
 */
export class ATwoJSCircleGraphic extends ATwoJSGraphicObject {
    protected _circle: any;

    /**
     * @param radius Circle radius in Two.js pixel units (default 1).
     * @param color  Fill color (default: opaque white).
     */
    constructor(radius: number = 1, color?: Color) {
        super(color);
        this._circle = new Two.Circle(0, 0, radius);
        const group: TwoGroup = new Two.Group();
        group.add(this._circle);
        this._displayObject = new ATwoJSDisplayObject(group);
        this._material.applyToShape(this._circle);
    }

    /** The Two.js `Circle`. */
    get twoShape(): TwoPath {
        return this._circle;
    }

    /** Sets the circle's radius without recreating the shape. */
    setRadius(radius: number): void {
        this._circle.radius = radius;
    }
}
