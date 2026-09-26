import {ATwoJSDisplayObject} from "./ATwoJSDisplayObject";
import {ATwoJSMaterial} from "./ATwoJSMaterial";
import {Color} from "../../math";
import {AMaterial} from "../material";
import {ALabel} from "../../base";
import {TwoGroup, TwoPath} from "./TwoJSImport";
import type {AGraphicObject} from "../graphicobject/AGraphicObject";

/**
 * Abstract base for all Two.js drawable primitives (circles, lines, paths, etc.).
 *
 * Each concrete subclass creates one or more Two.js shapes, wraps them in a
 * `TwoGroup`, and packages that group as an {@link ATwoJSDisplayObject}. The
 * {@link ATwoJSNodeView} that owns this graphic calls `registerAndAddGraphic`, which
 * adds `displayObject.nativeGroup` to the view's own group.
 *
 * Ownership chain:
 * ```
 * ATwoJSNodeView._twoGroup
 *   └── ATwoJSGraphicObject.displayObject.nativeGroup  (TwoGroup)
 *         └── Two.js shape (Circle, Path, etc.)
 * ```
 *
 * Subclasses must:
 * - Set `this._displayObject` to a new `ATwoJSDisplayObject` wrapping their group.
 * - Implement `get twoShape()` to return the primary shape for material updates.
 */
@ALabel("ATwoJSGraphicObject")
export abstract class ATwoJSGraphicObject implements AGraphicObject {
    protected _displayObject!: ATwoJSDisplayObject;
    protected _material: ATwoJSMaterial;

    /** @param color Fill color (default: opaque white). Stroke defaults to opaque black. */
    constructor(color?: Color) {
        this._material = new ATwoJSMaterial(color);
    }

    /**
     * The primary Two.js shape for this graphic. Used by `setColor` and
     * the other style setters to re-apply the material after a style change.
     * Returns null for graphics whose shape is dynamically built (e.g. before
     * `setPoints` has been called on a `ATwoJSPathGraphic`).
     */
    abstract get twoShape(): TwoPath | TwoGroup | null;

    /** The display object wrapping this graphic's Two.js group. */
    get displayObject(): ATwoJSDisplayObject {
        return this._displayObject;
    }

    /** Unique id (the Two.js group's id). */
    get uid(): string {
        return this._displayObject.uid;
    }

    /** Whether the graphic is shown (implemented as group opacity 1 or 0). */
    get visible(): boolean {
        return this._displayObject.visible;
    }

    set visible(value: boolean) {
        this._displayObject.visible = value;
    }

    /** Nests another graphic's group inside this one. */
    add(toAdd: ATwoJSGraphicObject): void {
        this._displayObject.add(toAdd._displayObject);
    }

    /** Removes a nested graphic's group from this one. */
    remove(toRemove: ATwoJSGraphicObject): void {
        this._displayObject.remove(toRemove._displayObject);
    }

    /** Does nothing for Two.js graphics; use `onMaterialChange` or the style setters. */
    onMaterialUpdate(_newMaterial: AMaterial, ..._args: any[]): void {}

    /**
     * Sets the fill color and re-applies the style to the Two.js shape.
     * Accepts either a `Color` or an {@link AMaterial} (whose model color is
     * used). Two.js cannot use Three.js materials, but shared view code
     * passes `model.material` to this callback. Does nothing if no color is
     * given or `twoShape` is null.
     */
    onMaterialChange(newMaterial?: AMaterial | Color): void {
        const color = newMaterial instanceof AMaterial ? newMaterial.getModelColor() : newMaterial;
        if (color && this.twoShape) {
            this._material.setColor(color);
            this._material.applyToShape(this.twoShape);
        }
    }

    /** Sets the fill color and immediately re-applies the full material to the shape. */
    setColor(color: Color): void {
        this._material.setColor(color);
        if (this.twoShape) {
            this._material.applyToShape(this.twoShape);
        }
    }

    /**
     * Sets the stroke color (and optionally width), turns the stroke on, and
     * immediately re-applies the material.
     */
    setStroke(color: Color, linewidth?: number): void {
        this._material.setStroke(color, linewidth);
        if (this.twoShape) {
            this._material.applyToShape(this.twoShape);
        }
    }

    /**
     * Toggles wireframe mode and immediately re-applies the material.
     * `true`: only the stroke outline is drawn (no fill). `false`: both fill
     * and stroke are drawn. For a fill with no outline, use
     * `setStrokeEnabled(false)`.
     */
    setWireframe(value: boolean): void {
        this._material.setWireframe(value);
        if (this.twoShape) {
            this._material.applyToShape(this.twoShape);
        }
    }

    /**
     * Turns the stroke (outline) on or off and immediately re-applies the
     * material. `setStrokeEnabled(false)` gives a filled shape with no
     * outline. `setStroke` turns the stroke back on.
     */
    setStrokeEnabled(enabled: boolean): void {
        this._material.setStrokeEnabled(enabled);
        if (this.twoShape) {
            this._material.applyToShape(this.twoShape);
        }
    }

    /**
     * Sets the stroke dash pattern (alternating on/off lengths, in pixels)
     * and immediately re-applies the material. Pass `[]` for a solid line.
     * Only meaningful on shape-backed graphics (`ATwoJSLineGraphic`,
     * `ATwoJSPathGraphic`, ...) — a bare `ATwoJSGroupGraphic`'s `twoShape` is a
     * `Two.Group`, which has no `dashes` property, so `applyToShape` skips
     * the write there rather than erroring.
     */
    setDashes(pattern: number[]): void {
        this._material.setDashes(pattern);
        if (this.twoShape) {
            this._material.applyToShape(this.twoShape);
        }
    }

    /** Removes the graphic's group from its parent. */
    dispose(): void {
        this._displayObject.dispose();
    }
}
