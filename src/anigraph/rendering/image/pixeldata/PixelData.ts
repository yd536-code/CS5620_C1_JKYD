import * as THREE from "three";

/**
 * A CPU-side image buffer: a flat typed array holding a `width` x `height` image with `nChannels` values per pixel,
 * stored row by row (pixel `(x, y)` starts at index `(y*width + x)*nChannels`). Used by {@link ADataTexture}.
 * @typeParam T the typed-array type of `data`
 */
export class PixelData<T extends ArrayBufferView>{
    /** The pixel values. */
    data!:T;
    width!:number;
    height!:number;
    /** Number of values per pixel. */
    get nChannels(){return this._nChannels;}
    _nChannels:number=1;

    /** The Three.js texture format to upload `data` as. */
    get _threeformat(){
        return THREE.LuminanceFormat;
    }
    /** The Three.js data type to upload `data` as. */
    get _threetype(){
        return THREE.UnsignedByteType;
    }


    // abstract getPixel(x:number,y:number):number[];
    constructor(width?:number, height?:number, nChannels?:number, data?:T, ...args:any[]) {
        if(width){this.width = width};
        if(height){this.height = height};
        if(data){this.data =data;}
        if(nChannels){this._nChannels=nChannels};
    }

    /** Returns a copy of the `nChannels` values of the pixel nearest to `(x, y)` (coordinates are rounded). */
    getPixelNN(x:number,y:number){
        let hi = Math.round(y);
        let wi = Math.round(x);
        // @ts-ignore
        return this.data.slice((hi*(this.width)+wi)*this.nChannels, (hi*(this.width)+wi+1)*this.nChannels);
        // let rval:number[]=[];
        // return this.data[(hi*(this.width)+wi)*this.nChannels];
    }

    /** Writes `value` (one value per channel) into the pixel nearest to `(x, y)`. */
    setPixelNN(x:number,y:number, value:ArrayLike<number>|number){
        let hi = Math.round(y);
        let wi = Math.round(x);
        // @ts-ignore
        this.data.set(value, (hi*(this.width)+wi)*this.nChannels)
        // this.data[(hi*(this.width)+wi)*this.nChannels]=value;
    }

    /**
     * `new this(width, height, data, ...args)` -- written for subclasses whose constructor is `(width, height, data)`
     * with a fixed channel count (`PixelDataFloat1D`/`4D`). Called on `PixelData` itself, `data` would land in the
     * `nChannels` slot of its `(width, height, nChannels, data)` constructor; nothing does that today.
     */
    static CreateBlock(width:number, height:number, data:any, ...args:any[]){
        return new this(width, height, data, ...args);
    }

    /** Creates a new `THREE.DataTexture` that uses `data` (not a copy) with this class's format and type. */
    GetTHREEDataTexture(...args:any[]){
        return new THREE.DataTexture(this.data, this.width, this.height, this._threeformat, this._threetype, ...args);
    }

    // static CreateBlock<T>(width:number, height:number, nChannels:number, data:T, ...args:any[]){
    //     return new this(width, height, nChannels, data, ...args);
    // }
}



