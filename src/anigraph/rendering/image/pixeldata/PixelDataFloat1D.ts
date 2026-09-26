import * as THREE from "three";
import {PixelData} from "./PixelData";

/** A single-channel `Float32Array` pixel buffer, uploaded as `THREE.RedFormat` / `THREE.FloatType`. */
export class PixelDataFloat1D extends PixelData<Float32Array>{

    get _threeformat(){
        return THREE.RedFormat;
    }
    get _threetype(){
        return THREE.FloatType;
    }

    /** Returns the value of the pixel nearest to `(x, y)` as a number. */
    getPixelNN(x:number,y:number){
        let hi = Math.round(y);
        let wi = Math.round(x);
        // @ts-ignore
        // return this.data.slice((hi*(this.width)+wi)*this.nChannels, (hi*(this.width)+wi+1)*this.nChannels);
        // let rval:number[]=[];
        return this.data[(hi*(this.width)+wi)*this.nChannels];
        // return this.data[(hi*(this.width)+wi)*this.nChannels];
    }

    /** Sets the pixel nearest to `(x, y)`. */
    setPixelNN(x:number,y:number, value:number){
        let hi = Math.round(y);
        let wi = Math.round(x);
        // this.data.set([value], (hi*(this.width)+wi)*this.nChannels)
        this.data[(hi*(this.width)+wi)*this.nChannels]=value;
        // this.data[(xi*(this.width)+yi)*this.nChannels]=value;
    }

    get nChannels(){return 1;}
    constructor(width?:number, height?:number, data?:Float32Array, ...args:any[]) {
        super(width, height, 1, data);
    }
}
