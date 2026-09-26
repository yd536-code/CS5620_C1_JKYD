import {PixelDataFloat4D} from "./pixeldata";
import {ADataTexture} from "./ADataTexture";

/** A four-channel (RGBA) float data texture (Three.js `RGBAFormat`, `FloatType`). */
export class ADataTextureFloat4D extends ADataTexture<PixelDataFloat4D>{

    /**
     * Creates a `width` x `height` texture filled with `fill`: an array sets every pixel to that RGBA value, a
     * number sets every channel of every pixel. Default 0.
     */
    static CreateSolid(width:number, height:number, fill?:number|number[]){
        let imdata = new Float32Array(width*height*4);
        if(Array.isArray(fill)){
            for(let p=0;p<width*height;p++){
                imdata.set(fill, p*4)
            }
        }else if(fill !== undefined){
            imdata.fill(fill);
        }
        let newDTex = new ADataTextureFloat4D(PixelDataFloat4D.CreateBlock(width, height, imdata));
        return newDTex;
    }

    // setPixelNN(x: number, y: number, value: number) {
    //     super.setPixelNN(x, y, value);
    // }

    /**
     * Creates a texture that uses `dataArray` (length `width*height*4`) as its pixel buffer, or a new zero-filled
     * buffer if none is given.
     */
    static Create(width:number, height:number, dataArray?:Float32Array, ...args:any[]){
        dataArray = dataArray?dataArray:new Float32Array(width*height*4);
        let newDTex = new ADataTextureFloat4D(PixelDataFloat4D.CreateBlock(width, height, dataArray));
        return newDTex;
    }
}
