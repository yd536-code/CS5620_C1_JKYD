import {ATwoJSGraphicObject} from "../ATwoJSGraphicObject";
import {ATwoJSDisplayObject} from "../ATwoJSDisplayObject";
import {Color} from "../../../math";
import {Two, TwoGroup} from "../TwoJSImport";

/**
 * A Two.js group that acts as a container for other {@link ATwoJSGraphicObject}
 * instances. Useful for building composite shapes where several primitives
 * should move together under a single transform.
 *
 * `twoShape` returns the group itself, so style setters are applied to the
 * group; Two.js passes fill, stroke, and linewidth on to the group's children.
 */
export class ATwoJSGroupGraphic extends ATwoJSGraphicObject {
    protected _group: TwoGroup;

    /** @param color Optional color stored on the material (rarely visible on a bare group). */
    constructor(color?: Color) {
        super(color);
        this._group = new Two.Group();
        this._displayObject = new ATwoJSDisplayObject(this._group);
    }

    /** The group itself. */
    get twoShape(): TwoGroup {
        return this._group;
    }

    /** Adds a child graphic into this group's Two.js hierarchy. */
    addGraphic(child: ATwoJSGraphicObject): void {
        this.add(child);
    }
}
