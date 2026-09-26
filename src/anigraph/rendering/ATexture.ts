import * as THREE from "three";
import {AObject, AObjectState} from "../base";
import {ASerializable} from "../base";
import type {GenericDict} from "../basictypes";

const ERROR_TEXTURE_PATH="./images/ERROR.png";

// // http://stackoverflow.com/a/14855016/2207790
// var loadTextureHTTP = function (url, callback) {
//     require('request')({
//         method: 'GET', url: url, encoding: null
//     }, function(error, response, body) {
//         if(error) throw error;
//
//         var image = new Image;
//         image.src = body;
//
//         var texture = new THREE.Texture(image);
//         texture.needsUpdate = true;
//
//         if (callback) callback(texture);
//     });
// };

/**
 * A texture: wraps a `THREE.Texture` along with its name, source URL, and a small dictionary of extra data
 * (`_texdata`). Load one with `await ATexture.LoadAsync(path)` or `new ATexture(path)`. Textures created from a URL
 * can be saved and restored (`fromJSON` reloads from the URL).
 */
@ASerializable("ATexture")
export class ATexture extends AObject{
    @AObjectState name!:string;
    /** The path/URL the texture was loaded from, if any. */
    @AObjectState _url!:string;
    /** Extra data about the texture (e.g. `url`, `width`, `height`). */
    @AObjectState _texdata:GenericDict;
    public _threejs!:THREE.Texture;
    /** The wrapped `THREE.Texture`. */
    set threejs(value:THREE.Texture){this._threejs = value;}
    get threejs(){return this._threejs;}

    /**
     * Texture width in pixels: `_texdata.width` if set, otherwise the image's width.
     * Returns 0 while the image is still loading (a texture loaded with `loadFromURL` or `fromJSON` gets its image
     * later, asynchronously).
     */
    get width():number{
        let w = this.getTexData('width');
        if(w!==undefined){
            return w;
        }else{
            return this.threejs.image?.width??0;
        }
    }
    /** Texture height in pixels; see `width`. */
    get height():number{
        let h = this.getTexData('height');
        if(h!==undefined){
            return h;
        }else{
            return this.threejs.image?.height??0;
        }
    }

    /**
     * Restores a texture from saved data. The saved state fields alone can't recreate the `THREE.Texture`, so this
     * reloads it from `_url` with `loadFromURL`, which returns right away and fills in the image once it loads.
     *
     * Gotcha: a texture with no `_url` (e.g. one made directly from an in-memory `THREE.Texture`) can't be reloaded.
     * It comes back with no Three.js texture, and a warning is printed outside production builds.
     */
    static fromJSON(data:{name?:string, _url?:string, _texdata?:GenericDict}){
        const tex = new ATexture();
        if(data._url){
            tex.loadFromURL(data._url);
        }else if(process.env.NODE_ENV !== "production"){
            console.warn(`ATexture.fromJSON: no "_url" in saved data${data.name?` for texture "${data.name}"`:""} -- this texture was never loaded from a path, so it can't be reconstructed. Reviving with no threejs texture.`);
        }
        if(data.name){
            tex.name = data.name;
        }
        if(data._texdata){
            tex._texdata = data._texdata;
        }
        return tex;
    }

    /**
     * Loads a texture and waits for it to finish. If loading fails, warns and loads the error texture
     * (`./images/ERROR.png`) instead. Either way, `_url` records the requested path.
     * @param texturePath Path or URL of the image.
     * @param name Optional texture name.
     */
    static async LoadAsync(texturePath:string, name?:string){
        let threetexture:THREE.Texture;
        try {
            threetexture = await new THREE.TextureLoader().loadAsync(texturePath,
                function (xhr) {
                    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                });
        }catch(error){
            console.warn(`Could not load texture "${name}" at path: ${texturePath}\nusing default/error texture!`)
            threetexture = await new THREE.TextureLoader().loadAsync(ERROR_TEXTURE_PATH,
                function (xhr) {
                    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                });
        }
        const tex = new this(threetexture, name);
        // The constructor's THREE.Texture branch doesn't set _url, so record it
        // here; otherwise fromJSON would have nothing to reload from. This is
        // the requested path, not ERROR_TEXTURE_PATH, even on the fallback
        // branch, so a saved file still points at the real (missing) asset.
        tex._url = texturePath;
        tex.setTexData('url', texturePath);
        return tex;
    }

    /**
     * @param texture A `THREE.Texture` to wrap, or a path/URL to load (loading finishes later, asynchronously).
     * If given, wrapping is set to repeat.
     * @param name Texture name; defaults to the Three.js texture's name.
     */
    constructor(texture?:string|THREE.Texture, name?:string, ...args:any[]) {
        super();
        this._texdata = {};
        if(texture) {
            if (texture instanceof THREE.Texture) {
                this._setTHREETexture(texture);
            } else {
                this.loadFromURL(texture as string);
            }
            this.setWrapToRepeat();
        }
        if(name){
            this.name=name;
        }else{
            if(this.threejs instanceof THREE.Texture){
                this.name = this.threejs.name;
            }
        }

    }

    /** Sets the wrapped `THREE.Texture` (does not set `_url`). */
    _setTHREETexture(tex:THREE.Texture){
        this.threejs=tex;
    }
    /** Stores a value in `_texdata`. */
    setTexData(key:string, value:any){
        this._texdata[key]=value;
    }
    /** Reads a value from `_texdata`. */
    getTexData(key:string){
        return this._texdata[key];
    }

    /** Starts loading the texture from `url` and records the URL. Returns before the image has loaded. */
    loadFromURL(url:string){
        this._url = url;
        this.threejs = new THREE.TextureLoader().load(this._url);
        this.setTexData('url', url);
    }

    /**
     * Sets both wrap modes to repeat (tiling).
     * @param repeats How many times to tile: one number for both directions, or `[u, v]`.
     */
    setWrapToRepeat(repeats?:number|number[]){
        this.threejs.wrapS=THREE.RepeatWrapping;
        this.threejs.wrapT=THREE.RepeatWrapping;
        if(repeats!==undefined) {
            if (Array.isArray(repeats)) {
                this.threejs.repeat.set(repeats[0], repeats[1]);
            } else {
                this.threejs.repeat.set(repeats, repeats);
            }
        }
    }
    /** Sets both wrap modes to clamp to the edge. */
    setWrapToClamp(){
        this.threejs.wrapS=THREE.ClampToEdgeWrapping;
        this.threejs.wrapT=THREE.ClampToEdgeWrapping;
    }


    /** Sets the minification filter (does nothing if `mode` is not given). */
    setMinFilter(mode?:THREE.TextureFilter){
        if(mode){this.threejs.minFilter=mode;}
    }
    /** Sets the magnification filter (does nothing if `mode` is not given). */
    setMagFilter(mode?:THREE.TextureFilter){
        if(mode){this.threejs.magFilter=mode;}
    }
}
