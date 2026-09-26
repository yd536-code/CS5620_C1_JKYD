import {AObject, ALabel} from "../../base";
import * as THREE from "three";
import {ATexture} from "../ATexture";
import type {WebGLRenderTargetOptions} from "three/src/renderers/WebGLRenderTarget";
import {RenderTargetInterface} from "../../scene";


/**
 * An offscreen render target: wraps a `THREE.WebGLRenderTarget` so a scene can be rendered into a texture
 * (`targetTexture`) instead of the screen, e.g. for multi-pass effects. Defaults to a float RGBA color buffer with
 * linear filtering (no mipmaps); call `addDepthTexture()` to also get a depth texture.
 *
 * `render` and `useAsRenderTarget` leave the renderer pointed at this target. Call
 * `renderer.setRenderTarget(null)` to draw to the screen again.
 */
@ALabel("ARenderTarget")
export class ARenderTarget extends AObject implements RenderTargetInterface{
    name!: string;
    _target: THREE.WebGLRenderTarget | null = null;
    _targetTexture!:ATexture;
    _depthTexture:ATexture|undefined;


    /** Frees the GPU render target and releases this object. Same as `dispose()`. */
    release() {
        this.dispose();
    }

    /** Makes `renderer` draw into this target. */
    useAsRenderTarget(renderer: THREE.WebGLRenderer){
        renderer.setRenderTarget(this.target);
    }

    /** Renders `scene` from `camera` into this target. */
    render(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
        this.useAsRenderTarget(renderer);
        renderer.render(scene, camera);
    }

    /** The wrapped `THREE.WebGLRenderTarget`. Setting it also wraps the new target's texture as `targetTexture`. */
    get target() {
        return this._target;
    }

    /** Width in pixels. */
    get width(){
        return this.target?.width;
    }
    /** Height in pixels. */
    get height(){
        return this.target?.height;
    }

    /** The color texture rendered into, usable as a texture in other materials. */
    get targetTexture(){
        return this._targetTexture;
    }

    /** The depth texture, if `addDepthTexture()` was called. */
    get depthTexture(){
        return this._depthTexture;
    }

    set target(target: THREE.WebGLRenderTarget | null) {
        this._target = target;
        if (this._target) {
            this._targetTexture = new ATexture(this._target.texture);
        }
    }

    /** Creates a target with a float RGBA color buffer. */
    static CreateFloatRGBATarget(width:number, height:number){
        return new ARenderTarget(width, height, {
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
        })
    }

    /** @param options Three.js render target options, which override the defaults (float RGBA, linear filtering) */
    constructor(width:number, height:number, options?:WebGLRenderTargetOptions) {
        super();
        // minFilter is LinearFilter, not a mipmap filter: a render target's texture changes every frame, and
        // regenerating mipmaps for it each time is slow.
        let defaultOptions:WebGLRenderTargetOptions = {
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
            magFilter: THREE.LinearFilter,
            minFilter: THREE.LinearFilter
        }
        let op = defaultOptions;
        if(options){
            op = {...op, ...options};
        }
        this.target = new THREE.WebGLRenderTarget(width, height, {...op});
        this.targetTexture.setMinFilter(op["minFilter"])
        this.targetTexture.setMagFilter(op["magFilter"]);
    }

    /** Adds a float depth texture to the target (available as `depthTexture`). */
    addDepthTexture(){
        if(this.target) {
            this.target.depthTexture = new THREE.DepthTexture(this.target.width, this.target.height, THREE.FloatType);
            this._depthTexture = new ATexture(this.target.depthTexture);
        }
    }

    /**
     * Reads the target's pixels back to the CPU as a `Float32Array` of RGBA values (`width*height*4`), or returns
     * `undefined` if there is no target. Assumes a float RGBA target.
     */
    GetTargetPixels(renderer: THREE.WebGLRenderer) {
        let target = this.target;
        if (target === null) {
            return;
        }
        // let pixels = new Uint8Array(target.width * target.height * 4);
        let pixels = new Float32Array(target.width * target.height * 4)
        renderer.readRenderTargetPixels(target, 0, 0, target.width, target.height, pixels);
        return pixels;
    }

    /** Frees the GPU render target and releases this object (see `AObject.release`). Safe to call more than once. */
    dispose() {
        if (this.target) {
            this.target.dispose();
        }
        super.release();
    }





}
