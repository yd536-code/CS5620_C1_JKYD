import {ATwoJSGraphicObject} from "../ATwoJSGraphicObject";
import {ATwoJSDisplayObject} from "../ATwoJSDisplayObject";
import {Color, Vec2} from "../../../math";
import {Two, TwoGroup, TwoText} from "../TwoJSImport";

/**
 * A single line of text rendered via Two.js.
 *
 * The text is anchored at the local origin (0, 0) of its group; position is
 * controlled by `setPosition` or by the owning {@link ATwoJSNodeView}'s transform.
 *
 * Default style: opaque black fill, no stroke ({@link ATwoJSMaterial} gives shapes
 * a stroke by default, which looks like a bold outline on text). The stroke is
 * turned off in the material itself, so it stays off when other style setters
 * (such as `setColor`) re-apply the material. Call `setStroke` to give the text
 * an outline on purpose.
 */
export class ATwoJSTextGraphic extends ATwoJSGraphicObject {
    protected _text: any;

    /**
     * @param message Text content.
     * @param size    Font size in pixels (default 12).
     * @param color   Fill color (default: opaque black).
     */
    constructor(message: string = "", size: number = 12, color?: Color) {
        super(color ?? Color.Black());
        this._text = new Two.Text(message, 0, 0, {size});
        const group: TwoGroup = new Two.Group();
        group.add(this._text);
        this._displayObject = new ATwoJSDisplayObject(group);
        // Turn the stroke off in the material (not just on the shape), so later
        // calls that re-apply the material keep it off.
        this._material.setStrokeEnabled(false);
        this._material.applyToShape(this._text);
    }

    /** The Two.js `Text` shape. */
    get twoShape(): TwoText {
        return this._text;
    }

    /** Replaces the displayed text without recreating the shape. */
    setText(message: string): void {
        this._text.value = message;
    }

    /** Moves the text by setting its group's translation (relative to the owning view). */
    setPosition(position: Vec2): void {
        this.displayObject.nativeGroup.translation.set(position.x, position.y);
    }

    /** Sets the horizontal alignment ("left" | "center" | "right"). */
    setAlignment(alignment: "left" | "center" | "right"): void {
        this._text.alignment = alignment;
    }
}
