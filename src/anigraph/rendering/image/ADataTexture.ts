import * as THREE from "three";
import {PixelData} from "./pixeldata";
import {ATexture} from "../ATexture";
import {Color} from "../../math";


/**
 * A texture whose pixels live in a CPU-side {@link PixelData} buffer that your code can read and write. Wraps a
 * `THREE.DataTexture` that shares that buffer.
 *
 * After editing pixels (e.g. with `setPixelNN`), call `setTextureNeedsUpdate()` so the new data is uploaded to the
 * GPU. The pixel setters deliberately do not do this for you: uploading the whole texture after every single pixel
 * would be slow, so you make all your edits first and then flag one upload.
 *
 * @typeParam T the pixel buffer type (e.g. {@link PixelDataFloat1D} or {@link PixelDataFloat4D})
 */
export class ADataTexture<T extends PixelData<any>> extends ATexture{
    static _support_checked:boolean=false;
    /** Result of `CheckWebGLSupport` (truthy if float textures with linear filtering are supported). */
    static _TextureFloatSupport:any;
    /** The CPU-side pixel buffer. */
    pixelData!:T;
    /** Width in pixels. */
    get width(){
        return this.pixelData.width;
    }
    /** Height in pixels. */
    get height(){
        return this.pixelData.height;
    }
    /** Number of channels per pixel. */
    get nChannels(){
        return this.pixelData.nChannels;
    }


    /** The wrapped `THREE.DataTexture`. */
    set threejs(value:THREE.DataTexture){this._threejs = value;}
    get threejs(){return this._threejs as THREE.DataTexture;}


    /**
     * Marks the texture so Three.js re-uploads the pixel data before the next render.
     * @param v If false, does nothing. (Three.js has no way to cancel an upload that was already flagged.)
     */
    setTextureNeedsUpdate(v:boolean=true){
        if(v){
            this.threejs.needsUpdate=true;
        }
    }

    /**
     * Checks once whether the renderer supports float textures with linear filtering, storing the result in
     * `ADataTexture._TextureFloatSupport`.
     */
    static CheckWebGLSupport(renderer:THREE.WebGLRenderer){
        if(!ADataTexture._support_checked) {
            const gl = renderer.getContext();
            ADataTexture._TextureFloatSupport = gl.getExtension('OES_texture_float') &&
                gl.getExtension('OES_texture_float_linear');
            ADataTexture._support_checked = true;
        }
    }

    /** Same as `setPixelData(data)`. */
    init(data:T, ...args:any[]){
        this.setPixelData(data);
    }

    /**
     * Sets the pixel buffer and flags it for upload. Can be called more than once:
     * - The first call creates the `THREE.DataTexture` for the buffer.
     * - Later calls with data of the same width, height, and format keep the same `THREE.DataTexture` (so materials
     *   that already use it see the new pixels) and just point it at the new buffer.
     * - Later calls with a different size or format dispose the old `THREE.DataTexture` and create a new one, copying
     *   the old one's wrap and filter settings. Materials that used the old one need `setTexture` again.
     */
    setPixelData(data:T){
        const old = this._threejs as THREE.DataTexture|undefined;
        this.pixelData=data;
        if(old){
            const image = old.image as any;
            if(image && image.width === data.width && image.height === data.height &&
                old.format === data._threeformat && old.type === data._threetype){
                image.data = data.data;
                this.setTextureNeedsUpdate();
                return;
            }
            // A different size or format needs a new texture on the GPU.
            (this as any)._threejs = undefined;
            old.dispose();
            this._CreateThreeJSTexture();
            this.threejs.wrapS = old.wrapS;
            this.threejs.wrapT = old.wrapT;
            this.threejs.minFilter = old.minFilter;
            this.threejs.magFilter = old.magFilter;
            return;
        }
        this._CreateThreeJSTexture();
    }

    /** @param data optional pixel buffer; if given, the Three.js texture is created right away */
    constructor(data?:T, ...args:any[]) {
        super();
        if(data){
            this.setPixelData(data);
        }
    }

    /** Creates the `THREE.DataTexture` from `pixelData`. Throws if one already exists (`setPixelData` handles that). */
    _CreateThreeJSTexture(){
        if(this.threejs){
            throw new Error("Tried to create data texture but already have one!")
        }
        this._setTHREETexture(this.pixelData.GetTHREEDataTexture());
        this.setTextureNeedsUpdate();
    }

    /**
     * Sets the pixel nearest to `(x, y)` (coordinates are rounded). A {@link Color} is written as `[r, g, b, a]`.
     * Call `setTextureNeedsUpdate()` afterward to upload the change.
     */
    setPixelNN(x: number, y: number, value: ArrayLike<number> & ArrayLike<bigint> | number | Color) {
        if (value instanceof Color) {
            this.pixelData.setPixelNN(x, y, [value.r, value.g, value.b, value.a]);
        } else {
            // @ts-ignore
            this.pixelData.setPixelNN(x, y, value);
            // this.setTextureNeedsUpdate();
        }
    }

    /** Returns the pixel nearest to `(x, y)` (see {@link PixelData.getPixelNN}). */
    getPixelNN(x:number,y:number){
        return this.pixelData.getPixelNN(x,y);
    }
}







