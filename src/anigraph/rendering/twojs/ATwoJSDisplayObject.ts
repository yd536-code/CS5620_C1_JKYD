import {ADisplayObject} from "../ADisplayObject";
import {Mat3, Mat4} from "../../math";
import {Two, TwoGroup} from "./TwoJSImport";

/**
 * Adapts a Two.js `Group` to the AniGraph {@link ADisplayObject} interface.
 *
 * Two.js scenes are composed of groups and shapes. Each `ATwoJSDisplayObject`
 * wraps exactly one `Two.Group` and exposes position/rotation/scale through
 * `setMatrix` rather than modifying the group's matrix array directly (Two.js
 * groups decompose transforms as `translation`, `rotation`, and `scale`
 * scalars, not a raw matrix).
 *
 * `nativeGroup` provides direct access to the underlying `Two.Group` for cases
 * where shapes need to be added to the group.
 */
export class ATwoJSDisplayObject implements ADisplayObject {
    protected _group: TwoGroup;

    /** @param group Group to wrap; a new empty `Two.Group` is created if omitted. */
    constructor(group?: TwoGroup) {
        this._group = group ?? new Two.Group();
    }

    /** Two.js internal ID string for this group. */
    get uid(): string {
        return this._group.id;
    }

    /** The underlying Two.js group — use this to add shapes as children. */
    get nativeGroup(): TwoGroup {
        return this._group;
    }

    /** Invisible when opacity is 0; fully opaque when opacity is 1. */
    get visible(): boolean {
        return this._group.opacity > 0;
    }

    set visible(value: boolean) {
        this._group.opacity = value ? 1 : 0;
    }

    /** Adds `child`'s group to this group. Throws if `child` is not an `ATwoJSDisplayObject`. */
    add(child: ADisplayObject): void {
        if (child instanceof ATwoJSDisplayObject) {
            this._group.add(child._group);
        } else {
            throw new Error("Cannot add non-Two.js display object to ATwoJSDisplayObject");
        }
    }

    /** Removes `child`'s group from this group (ignored if `child` is not an `ATwoJSDisplayObject`). */
    remove(child: ADisplayObject): void {
        if (child instanceof ATwoJSDisplayObject) {
            this._group.remove(child._group);
        }
    }

    /** Removes this group from its parent group, if it has one. */
    removeFromParent(): void {
        if (this._group.parent) {
            this._group.parent.remove(this._group);
        }
    }

    /**
     * Decomposes a 2D affine matrix and applies it to the Two.js group's
     * `translation`, `rotation`, and `scale` properties.
     *
     * Mat3 uses **row-major storage** with **column-vector convention**:
     * ```
     *   [ m00  m01  m02 ]   [ cos·s  -sin·s  tx ]
     *   [ m10  m11  m12 ] = [ sin·s   cos·s  ty ]
     *   [ m20  m21  m22 ]   [   0       0     1 ]
     * ```
     * where `m_row_col = elements[3*row + col]`.
     * Translation lives in `m02` (elements[2]) and `m12` (elements[5]).
     * Rotation is extracted as `atan2(m10, m00) = atan2(sin, cos) = θ`.
     * Scale is the first-column magnitude: `sqrt(m00² + m10²)`, applied
     * uniformly (non-uniform scale and shear are lost).
     *
     * Mat4 input (also row-major) is reduced to its 2D part: `m00, m01, m03`
     * for the first row and `m10, m11, m13` for the second, i.e. the x/y
     * rotation-scale block plus the x/y translation (`m03`, `m13`).
     */
    setMatrix(mat: Mat3 | Mat4): void {
        let m: Mat3;
        if (mat instanceof Mat4) {
            m = new Mat3([
                mat.m00, mat.m01, mat.m03,
                mat.m10, mat.m11, mat.m13,
                0, 0, 1,
            ]);
        } else {
            m = mat;
        }
        const tx = m.m02;
        const ty = m.m12;
        const scaleX = Math.sqrt(m.m00 * m.m00 + m.m10 * m.m10);
        const rotation = Math.atan2(m.m10, m.m00);
        this._group.translation.set(tx, ty);
        this._group.rotation = rotation;
        this._group.scale = scaleX > 0 ? scaleX : 1;
    }

    /**
     * Builds a `Mat4` from the group's current `translation`, `rotation`, and
     * `scale`: a rotation about z scaled uniformly, with the translation in the
     * last column (`m03`, `m13`). It is the inverse of `setMatrix` for
     * transforms that `setMatrix` can represent.
     */
    getMatrix(): Mat4 {
        const tx = this._group.translation.x;
        const ty = this._group.translation.y;
        const r = this._group.rotation;
        const s = typeof this._group.scale === 'number' ? this._group.scale : 1;
        const cos = Math.cos(r) * s;
        const sin = Math.sin(r) * s;
        return new Mat4([
            cos, -sin, 0, tx,
            sin, cos, 0, ty,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
    }

    /** Removes the group from its parent. */
    dispose(): void {
        this.removeFromParent();
    }
}
