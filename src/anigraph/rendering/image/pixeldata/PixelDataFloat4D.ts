import * as THREE from "three";
import {PixelData} from "./PixelData";

/** A four-channel (RGBA) `Float32Array` pixel buffer, uploaded as `THREE.RGBAFormat` / `THREE.FloatType`. */
export class PixelDataFloat4D extends PixelData<Float32Array>{

    get _threeformat(){
        return THREE.RGBAFormat;
    }
    get _threetype(){
        return THREE.FloatType;
    }


    get nChannels(){return 4;}
    constructor(width?:number, height?:number, data?:Float32Array, ...args:any[]) {
        super(width, height, 4, data);
    }
}
