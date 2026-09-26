/**
 * @file Defines {@link AGLContext}, the Three.js (WebGL) render context.
 * @author Abe Davis
 */
import {ALabel} from "../../base";
import * as THREE from "three";
import * as WebGLRenderer from "three/src/renderers/WebGLRenderer";
import {Vector2, Vector4} from "three";
import {Color, Vec2, Vec4} from "../../math";
import {ARenderContext} from "./ARenderContext";

const _DEFAULT_WEBGLRENDERER_PARAMS = {
  alpha: true,
  preserveDrawingBuffer: true,
};

/**
 * Render context for Three.js scenes: a thin wrapper around a `THREE.WebGLRenderer` with convenience methods for
 * viewports, scissoring, and clearing. The renderer is created with the device pixel ratio and with object sorting
 * turned off (`sortObjects = false`), so objects draw in scene order.
 */
@ALabel("AGLContext")
export class AGLContext extends ARenderContext {
    /** The wrapped Three.js renderer. */
    public renderer!: THREE.WebGLRenderer;
    /** Default `WebGLRenderer` parameters (`alpha` and `preserveDrawingBuffer` on). Merged under any constructor params. */
    static DEFAULT_SETTINGS = _DEFAULT_WEBGLRENDERER_PARAMS;
    /**
     * @param contextParams Extra `WebGLRenderer` parameters; they override {@link AGLContext.DEFAULT_SETTINGS}.
     */
    constructor(contextParams?: WebGLRenderer.WebGLRendererParameters) {
        super();
        // this.container=container;
        this.renderer = new THREE.WebGLRenderer(
            {
                ...AGLContext.DEFAULT_SETTINGS,
                ...(contextParams ?? {})
            }
        );
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.sortObjects = false;
    }

    /** Returns the renderer's current viewport as `[x, y, width, height]`. */
    getViewport(){
        let rviewport = new Vector4();
        this.renderer.getViewport(rviewport);
        return [rviewport.x, rviewport.y, rviewport.z, rviewport.w]
    }

    /**
     * Sets the renderer's viewport. Accepts four numbers, a `Vec4(x, y, w, h)`, or an array `[x, y, w, h]`.
     * @param x The x coordinate, or the whole viewport as a `Vec4` or array (then `y`, `w`, `h` are ignored).
     */
    setViewport(x:number|Vec4|number[],y?:number,w?:number,h?:number):void{
        let tvp:Vector4;
        if(x instanceof Vec4){
            tvp = x.asThreeJS();
        }else if(Array.isArray(x)){
            tvp = new Vector4(x[0],x[1],x[2],x[3])
        }else{
            tvp = new Vector4(x,y,w,h);
        }
        this.renderer.setViewport(tvp);
    }


    /** Returns the renderer's size (width, height) as a `Vec2`. */
    getShape(){
        let rsize = new Vector2();
        this.renderer.getSize(rsize);
        return new Vec2(rsize.x, rsize.y);
    }

    // getAspect() is inherited from ARenderContext.

    /** The renderer's `<canvas>` element. */
    get domElement(): HTMLElement {
        return this.renderer.domElement as HTMLElement;
    }

    /** Resizes the renderer's canvas. */
    setSize(width: number, height: number): void {
        this.renderer.setSize(width, height);
    }

    /** Clears the color, depth, and stencil buffers. */
    clear(): void {
        this.renderer.clear();
    }

    /**
     * Clears only the chosen buffers. For example, a HUD pass drawn over an already-rendered 3D pass clears depth
     * only, so it draws on top without erasing the 3D image. `stencil` defaults to `true`, matching `clear()`.
     *
     * Gotcha: this clears the whole canvas, not just the current viewport, unless a scissor rectangle is set and
     * scissor testing is on (`setScissor` / `setScissorTest`). With several viewports on one canvas, set the
     * scissor to match the viewport, or a later pass will erase an earlier pass's pixels.
     */
    clearBuffers(color: boolean, depth: boolean, stencil: boolean = true): void {
        this.renderer.clear(color, depth, stencil);
    }

    /**
     * Sets the scissor rectangle (in pixels). When scissor testing is on, clearing and drawing are limited to this
     * rectangle, so multiple viewports on one canvas (split-screen, a mini-map inset) don't clear each other's
     * pixels. Pair with `setViewport` and `setScissorTest(true)`.
     */
    setScissor(x: number, y: number, w: number, h: number): void {
        this.renderer.setScissor(x, y, w, h);
    }

    /** Turns scissor testing on or off (see `setScissor`). */
    setScissorTest(value: boolean): void {
        this.renderer.setScissorTest(value);
    }

    /** Sets the color used when the color buffer is cleared. */
    setClearColor(color: Color): void {
        this.renderer.setClearColor(color.asThreeJS());
    }

    /** Sets whether the renderer clears automatically before each `render` call. */
    setAutoClear(value: boolean): void {
        this.renderer.autoClear = value;
    }

    /** Renders into `target` instead of the canvas; pass `null` to render to the canvas again. */
    setRenderTarget(target: THREE.WebGLRenderTarget | null): void {
        this.renderer.setRenderTarget(target);
    }

}
