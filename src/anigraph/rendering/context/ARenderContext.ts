import {AObject} from "../../base";
import {Color} from "../../math";
import {Vec2} from "../../math";

/**
 * Backend-independent base for a render context: the object that wraps a drawing backend ({@link AGLContext} for
 * Three.js, {@link ATwoJSContext} for Two.js) and its DOM element.
 */
export abstract class ARenderContext extends AObject {
    /** The DOM element the backend draws into (`<canvas>` or `<svg>`). */
    abstract get domElement(): HTMLElement;
    /** Returns the drawing surface size as `Vec2(width, height)` in pixels. */
    abstract getShape(): Vec2;
    /** Resizes the drawing surface. */
    abstract setSize(width: number, height: number): void;
    /** Clears the drawing surface. */
    abstract clear(): void;
    /** Sets the background (clear) color. */
    abstract setClearColor(color: Color): void;
    /** Sets whether the backend clears automatically each frame. */
    abstract setAutoClear(value: boolean): void;
    /** Redirects rendering to an offscreen target. Does nothing by default; {@link AGLContext} overrides it. */
    setRenderTarget(_target: any): void { /* no-op by default */ }

    /** Returns the aspect ratio `getShape().x / getShape().y` (width over height). */
    getAspect(): number {
        const shape = this.getShape();
        return shape.x / shape.y;
    }
}
