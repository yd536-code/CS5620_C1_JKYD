import {Color} from "../../math";

/**
 * SVG/canvas style properties forwarded directly to a Two.js shape.
 * `noFill`/`noStroke` map to Two.js's `shape.noFill()` / `shape.noStroke()` calls,
 * which remove the fill/stroke rather than setting them to transparent.
 */
export interface ATwoJSStyle {
    /** CSS fill color, e.g. `rgb(255,255,255)`. */
    fill: string;
    /** CSS stroke color. */
    stroke: string;
    /** Stroke width in pixels. */
    linewidth: number;
    /** Shape opacity in [0, 1] (taken from the fill color's alpha). */
    opacity: number;
    /** When true, `applyToShape` calls `shape.noFill()` instead of setting fill. */
    noFill: boolean;
    /** When true, `applyToShape` calls `shape.noStroke()` instead of setting stroke. */
    noStroke: boolean;
    /**
     * Dash pattern in pixels (alternating on/off lengths), forwarded to
     * Two.js's `shape.dashes`. Empty array = solid line. Only meaningful on
     * shape-backed graphics (`ATwoJSLineGraphic`, `ATwoJSPathGraphic`, ...) — see
     * `applyToShape`'s guard.
     */
    dashes: number[];
}

/**
 * Thin wrapper around a Two.js shape's visual style (fill, stroke, opacity).
 *
 * Stores style properties as CSS color strings and applies them via
 * `applyToShape`, which writes the properties directly to a Two.js shape
 * object. This must be called again after any style mutation because Two.js
 * does not observe the style object — it reads shape properties directly.
 *
 * Default fill: opaque white. Default stroke: opaque black, 1px.
 */
export class ATwoJSMaterial {
    protected _style: ATwoJSStyle;

    /**
     * @param color Fill color (default opaque white). Its alpha sets `opacity`.
     * @param strokeColor Stroke color (default opaque black).
     * @param linewidth Stroke width in pixels (default 1).
     */
    constructor(color?: Color, strokeColor?: Color, linewidth?: number) {
        const c = color ?? Color.FromRGBA(1, 1, 1, 1);
        const s = strokeColor ?? Color.FromRGBA(0, 0, 0, 1);
        this._style = {
            fill: ATwoJSMaterial.colorToCSS(c),
            stroke: ATwoJSMaterial.colorToCSS(s),
            linewidth: linewidth ?? 1,
            opacity: c.a,
            noFill: false,
            noStroke: false,
            dashes: [],
        };
    }

    /**
     * Converts an AniGraph `Color` to an opaque CSS `rgb(...)` string.
     *
     * Alpha is deliberately left out: some SVG programs (notably Adobe
     * Illustrator) don't understand `rgba()` in `fill`/`stroke` and draw such
     * shapes solid black. Transparency is carried by the shape's `opacity`
     * instead (set from the fill color's alpha in the constructor and
     * `setColor`).
     */
    static colorToCSS(color: Color): string {
        return `rgb(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)})`;
    }

    /** The current style values (a live reference; call `applyToShape` after editing it). */
    get style(): ATwoJSStyle {
        return this._style;
    }

    /** Sets the fill color. Also sets opacity to `color.a`. */
    setColor(color: Color): void {
        this._style.fill = ATwoJSMaterial.colorToCSS(color);
        this._style.opacity = color.a;
    }

    /**
     * Sets the stroke color and, optionally, the stroke width. This also turns
     * the stroke on, in case it was turned off with `setStrokeEnabled(false)`.
     */
    setStroke(color: Color, linewidth?: number): void {
        this._style.stroke = ATwoJSMaterial.colorToCSS(color);
        if (linewidth !== undefined) this._style.linewidth = linewidth;
        this._style.noStroke = false;
    }

    /**
     * Toggles wireframe mode.
     * - `true`: only the outline is drawn (stroke on, fill off).
     * - `false`: both the fill and the outline are drawn (stroke on, fill on).
     *
     * For a filled shape with no outline, use `setStrokeEnabled(false)` instead.
     */
    setWireframe(value: boolean): void {
        this._style.noFill = value;
        this._style.noStroke = false;
    }

    /**
     * Turns the stroke (outline) on or off without changing the fill.
     * `setStrokeEnabled(false)` gives a filled shape with no outline.
     */
    setStrokeEnabled(enabled: boolean): void {
        this._style.noStroke = !enabled;
    }

    /**
     * Sets the dash pattern (alternating on/off lengths, in pixels). Pass an
     * empty array (the default) for a solid line.
     */
    setDashes(pattern: number[]): void {
        this._style.dashes = pattern;
    }

    /**
     * Writes the current style properties onto a Two.js shape object.
     * Must be called whenever the style changes — Two.js reads these as plain
     * properties and does not observe the material.
     */
    applyToShape(shape: any): void {
        if (this._style.noFill) {
            shape.noFill();
        } else {
            shape.fill = this._style.fill;
        }
        if (this._style.noStroke) {
            shape.noStroke();
        } else {
            shape.stroke = this._style.stroke;
            shape.linewidth = this._style.linewidth;
        }
        shape.opacity = this._style.opacity;
        // Guarded: `applyToShape` is also called with a `Two.Group` (via
        // `ATwoJSGroupGraphic.twoShape`), which has no `dashes` property
        // (Two.js passes fill/stroke/linewidth on to a group's children, but
        // not dashes). Only set it on shapes that support it.
        if ('dashes' in shape) {
            shape.dashes = this._style.dashes.length ? [...this._style.dashes] : [];
        }
    }
}
