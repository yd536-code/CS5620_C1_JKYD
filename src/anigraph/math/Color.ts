import * as THREE from "three";
import tinycolor from "tinycolor2";
import {ASerializable} from "../base/aserial";
import {Random} from "./Random";
import {VectorBase, Vec4} from "./linalg";

/**
 * The part of a tinycolor2 color that {@link Color.FromTinyColor} uses.
 * @internal
 */
export interface TinyColor {
    toRgb(): tinycolor.ColorFormats.RGBA;
}

/**
 * An RGBA color with components in `[0, 1]`. Alpha is optional: a color created from three values stores only
 * r, g, b, and `a` reads as 1 until you set it. With no arguments, the constructor makes gray `(0.5, 0.5, 0.5)`.
 */
@ASerializable("Color")
export class Color extends VectorBase {
    static N_DIMENSIONS: number = 4;

    /** Creates a color from r, g, b (and optionally a), each in `[0, 1]`, or from an array of those values. */
    public constructor(r: number, g: number, b: number, a?: number);
    public constructor(rgb: Array<number>);
    public constructor(...args: Array<any>) {
        // common logic constructor
        super(...args);
    }

    toString() {
        return `Color(${this.r},${this.g},${this.b},${this.a})`;
    }

    get nDimensions() {
        return 4;
    }

    /** Returns this color as a `THREE.Color` (alpha is dropped). */
    public asThreeJS() {
        return new THREE.Color(this.r, this.g, this.b);
    }

    /**
     * The color as `[r, g, b, a]`. If the color stores an alpha, this is the color's own `elements` array (editing
     * it changes the color); otherwise it is a new array with `a = 1`.
     */
    get rgba() {
        if (this.elements.length === 4) {
            return this.elements;
        } else {
            return [this.elements[0], this.elements[1], this.elements[2], 1.0];
        }
    }

    /**
     * The color as `{r, g, b, a}` with r, g, b scaled to the 0-255 range (multiplied by 255) and `a` left in
     * `[0, 1]`, as used by tinycolor and the leva color picker.
     */
    get RGBuintAfloat() {
        return {
            r: this.elements[0] * 255,
            g: this.elements[1] * 255,
            b: this.elements[2] * 255,
            a: this.a,
        };
    }

    /** Returns white. */
    static White(){
        return new Color(1.0,1.0,1.0);
    }
    /** Returns black. */
    static Black(){
        return new Color(0,0,0);
    }

    /** Returns red. */
    static Red(){
        return new Color(1.0, 0.0, 0.0);
    }

    /** Returns green. */
    static Green(){
        return new Color(0.0, 1.0, 0.0);
    }

    /** Returns blue. */
    static Blue(){
        return new Color(0.0, 0.0, 1.0);
    }

    /** Creates a color from r, g, b in 0-255 range and `a` in `[0, 1]`. See {@link Color.setRGBuintAfloat}. */
    static FromRGBuintAfloat(
        r: number | { [name: string]: number },
        g?: number,
        b?: number,
        a?: number
    ) {
        let c = new Color(0, 0, 0);
        c.setRGBuintAfloat(r, g, b, a);
        return c;
    }

    /**
     * Sets this color from r, g, b in 0-255 range (divided by 255) and `a` in `[0, 1]`. Takes four numbers or one
     * `{r, g, b, a}` object.
     */
    setRGBuintAfloat(
        r: number | { [name: string]: number },
        g?: number,
        b?: number,
        a?: number
    ): void;
    setRGBuintAfloat(...args: any[]) {
        let rgba = [0, 0, 0, 0];
        if (typeof args[0] == "number") {
            rgba[0] = args[0];
            rgba[1] = args[1];
            rgba[2] = args[2];
            rgba[3] = args[3];
        } else {
            let r = args[0] as unknown as { [name: string]: number };
            rgba = [r.r, r.g, r.b, r.a];
        }
        this.elements[0] = rgba[0] / 255;
        this.elements[1] = rgba[1] / 255;
        this.elements[2] = rgba[2] / 255;
        if (this.elements.length < 4) {
            this.elements.push(rgba[3]);
        } else {
            this.elements[3] = rgba[3];
        }
    }

    /** Red component, in `[0, 1]`. */
    set r(value) {
        this.elements[0] = value;
    }

    get r() {
        return this.elements[0];
    }

    /** Green component, in `[0, 1]`. */
    set g(value) {
        this.elements[1] = value;
    }

    get g() {
        return this.elements[1];
    }

    /** Blue component, in `[0, 1]`. */
    set b(value) {
        this.elements[2] = value;
    }

    get b() {
        return this.elements[2];
    }

    /** Alpha (opacity) component, in `[0, 1]`. Reads as 1 if the color has no alpha stored. */
    set a(value) {
        if (this.elements.length === 3) {
            this.elements.push(value);
        } else {
            this.elements[3] = value;
        }
    }

    get a() {
        if (this.elements.length > 3) {
            return this.elements[3];
        } else {
            return 1.0;
        }
    }

    _setToDefault() {
        this.elements = [0.5, 0.5, 0.5];
    }

    /** Returns a color with random r, g, b, and a (uses `Math.random`, so it ignores the {@link Random} seed). */
    static RandomRGBA() {
        return new Color(
            Math.random(),
            Math.random(),
            Math.random(),
            Math.random()
        );
    }

    // static FromRGBA(r:number|number[],g?:number,b?:number,a:number=1){
    /** Creates a color from r, g, b, and optional a (default 1), given as numbers or as one array. */
    static FromRGBA(r: number, g: number, b: number, a?: number): Color;
    static FromRGBA(rbga: number[]): Color;
    static FromRGBA(...args: any[]) {
        let rgba = args;
        if (Array.isArray(args[0])) {
            rgba = rgba[0];
        }
        return new Color(rgba[0], rgba[1], rgba[2], rgba.length > 3 ? rgba[3] : 1);
    }

    /** Creates a color from a `THREE.Vector4` (x, y, z, w as r, g, b, a). */
    static FromTHREEVector4(vector4: THREE.Vector4) {
        return new Color(vector4.x, vector4.y, vector4.z, vector4.w);
    }

    /** Returns a color with random r, g, b (from the shared {@link Random} generator) and no stored alpha. */
    static Random() {
        var r = new this(Random.floatArray(3));
        return r;
    }

    /** Creates a color from a `THREE.Color`. */
    static FromThreeJS(threecolor: THREE.Color) {
        return new this(threecolor.r, threecolor.g, threecolor.b);
    }

    /** Creates a color from a tinycolor object. Alpha is stored only if it is not 1. */
    static FromTinyColor(tc: TinyColor) {
        let rgba = tc.toRgb();
        if (rgba.a === 1) {
            return new Color(rgba.r / 255, rgba.g / 255, rgba.b / 255);
        } else {
            return new Color(rgba.r / 255, rgba.g / 255, rgba.b / 255, rgba.a);
        }
    }

    /** Returns a short string like `[r,g,b]`. */
    sstring() {
        return `[${this.r},${this.g},${this.b}]`;
    }

    /** Returns the color as a hex string like `"#ff8800"`. */
    toHexString() {
        return this._tinycolor().toHexString();
    }



    /** Returns the color as a hex number like `0xff8800`. */
    toHex() {
        return parseInt(this._tinycolor().toHex(), 16);
    }

    /** Returns the color as a {@link Vec4} `(r, g, b, a)`. */
    get Vec4() {
        return new Vec4(this.r, this.g, this.b, this.a);
    }

    /**
     * Returns a new color with the hue rotated by `angle`.
     * @param angle The hue rotation, in radians.
     */
    GetSpun(angle: number): Color {
        let spuntc = this._tinycolor().spin((angle * 180) / Math.PI);
        let rval = Color.FromTinyColor(spuntc);
        return rval;
    }

    /** Returns a new color desaturated by `percent` (0-100). */
    GetDesaturated(percent: number): Color {
        let dst = this._tinycolor().desaturate(percent);
        let rval = Color.FromTinyColor(dst);
        return rval;
    }

    /** Returns a new color darkened by `percent` (0-100). */
    GetDarkened(percent: number): Color {
        let dst = this._tinycolor().darken(percent);
        let rval = Color.FromTinyColor(dst);
        return rval;
    }

    /**
     * Creates a color from hue, saturation, and value, each in `[0, 1]` (hue is a fraction of a full turn), and an
     * optional alpha. Each of h, s, v is rounded down to a whole percent.
     */
    static FromHSVA(h: number, s: number, v: number, a?: number) {
        var rgbob = tinycolor(
            `hsv(${parseInt(String(h * 100))}%, ${parseInt(
                String(s * 100)
            )}%, ${parseInt(String(v * 100))}%)`
        ).toRgb();
        if (a !== undefined) {
            return new Color(rgbob.r / 255, rgbob.g / 255, rgbob.b / 255, a);
        } else {
            return new Color(rgbob.r / 255, rgbob.g / 255, rgbob.b / 255);
        }
    }

    /**
     * Creates a color from any CSS-style color string tinycolor understands (e.g. `"red"`, `"#ff0000"`,
     * `"rgb(255, 0, 0)"`).
     * @param colorString The color string.
     * @param alpha Optional alpha; defaults to the string's alpha (1 if it has none).
     */
    static FromString(colorString: string, alpha?: number) {
        var tcolor = tinycolor(colorString).toRgb();
        return new Color(
            tcolor.r / 255,
            tcolor.g / 255,
            tcolor.b / 255,
            alpha ?? tcolor.a
        );
    }

    /**
     * Creates a `THREE.Color` from a color string (parsed with tinycolor, like {@link Color.FromString}), a hex
     * number, or r, g, b values in `[0, 1]`.
     */
    static ThreeJS(hexstring: string): THREE.Color;
    static ThreeJS(hex: number): THREE.Color;
    static ThreeJS(r: number | string, g?: number, b?: number): THREE.Color {
        if (typeof r === "string") {
            let c = Color.FromString(r);
            return new THREE.Color(c.r, c.g, c.b);
        }
        if (g === undefined || b === undefined) {
            return new THREE.Color(r);
        } else {
            return new THREE.Color(r, g, b);
        }
    }

    /** Returns this color as a tinycolor object. */
    _tinycolor() {
        return tinycolor(this.RGBuintAfloat);
    }

    /** Returns the color as a CSS string like `"rgba(255, 136, 0, 0.5)"` (or `"rgb(...)"` when opaque). */
    toRGBAString() {
        return this._tinycolor().toRgbString();
    }
}
