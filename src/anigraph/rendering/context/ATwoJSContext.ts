import {ALabel} from "../../base";
import {Color, Vec2} from "../../math";
import {ARenderContext} from "./ARenderContext";
import {Two, TwoInstance} from "../twojs/TwoJSImport";

/** Construction parameters forwarded to the `Two` constructor. */
export interface ATwoJSContextParams {
    /** Two.js renderer type string (e.g. `Two.Types.svg`, `Two.Types.canvas`). Default: SVG. */
    type?: string;
    /** Initial canvas width in pixels. Overridden when `setContainer` is called. */
    width?: number;
    /** Initial canvas height in pixels. Overridden when `setContainer` is called. */
    height?: number;
}

/**
 * AniGraph render context wrapping a Two.js renderer instance.
 *
 * Implements {@link ARenderContext} so it can be passed to {@link ATwoJSSceneController}
 * callbacks without exposing Two.js specifics to the base framework. The live
 * `Two` instance is public for use in view code that must call Two.js APIs
 * directly (e.g. `two.add(group)`, `two.update()`).
 *
 * **Background color** is applied as a CSS `backgroundColor` style on the DOM
 * element. Two.js does not have a native clear-color concept; the element
 * background shows through wherever shapes have no fill.
 *
 * **Sizing**: `setSize` uses `renderer.setSize(w, h)` when the renderer has
 * it, and otherwise sets `two.width` / `two.height` directly.
 */
@ALabel("ATwoJSContext")
export class ATwoJSContext extends ARenderContext {
    /** The live Two.js renderer. Call `two.update()` once per frame to flush changes. */
    public two: TwoInstance;

    constructor(params?: ATwoJSContextParams) {
        super();
        this.two = new Two({
            type: params?.type ?? Two.Types.svg,
            width: params?.width ?? 800,
            height: params?.height ?? 600,
        });
    }

    /** The DOM element managed by the Two.js renderer (an `<svg>` or `<canvas>`). */
    get domElement(): HTMLElement {
        return this.two.renderer.domElement as HTMLElement;
    }

    /** Current canvas dimensions as a `Vec2(width, height)` in pixels. */
    getShape(): Vec2 {
        return new Vec2(this.two.width, this.two.height);
    }

    // getAspect() is inherited from ARenderContext.

    /**
     * Resizes the Two.js canvas. Prefers the renderer's own `setSize` method;
     * falls back to direct property assignment for renderers that lack it.
     */
    setSize(width: number, height: number): void {
        const renderer = this.two.renderer as any;
        if (renderer.setSize) {
            renderer.setSize(width, height);
        } else {
            this.two.width = width;
            this.two.height = height;
        }
    }

    /** Does nothing: Two.js redraws the whole scene on `two.update()`. */
    clear(): void {
        // Two.js clears automatically on two.update(); no explicit clear needed.
    }

    /** Applies a background color to the renderer's DOM element via CSS. */
    setClearColor(color: Color): void {
        const el = this.domElement;
        if (el) {
            el.style.backgroundColor = `rgba(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)},${color.a})`;
        }
    }

    /** Does nothing: Two.js has no auto-clear setting. */
    setAutoClear(_value: boolean): void {
        // Two.js manages clearing per frame automatically via two.update().
    }
}
