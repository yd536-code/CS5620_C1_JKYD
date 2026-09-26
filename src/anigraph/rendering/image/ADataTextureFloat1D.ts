import {PixelDataFloat1D} from "./pixeldata";
import {ADataTexture} from "./ADataTexture";

/** A single-channel float data texture (Three.js `RedFormat`, `FloatType`). */
export class ADataTextureFloat1D extends ADataTexture<PixelDataFloat1D>{
    /** Creates a `width` x `height` texture with every pixel set to `fill` (default 0). */
    static CreateSolid(width:number, height:number, fill?:number){
        let imdata = new Float32Array(width*height);
        if(fill !== undefined){
            imdata.fill(fill);
        }
        let newDTex = new ADataTextureFloat1D(PixelDataFloat1D.CreateBlock(width, height, imdata));
        return newDTex;
    }

    /** Sets the pixel nearest to `(x, y)`. Call `setTextureNeedsUpdate()` afterward to upload the change. */
    setPixelNN(x: number, y: number, value: number) {
        // @ts-ignore
        this.pixelData.setPixelNN(x,y,[value]);
    }

    /**
     * Creates a texture that uses `dataArray` (length `width*height`) as its pixel buffer, or a new zero-filled
     * buffer if none is given.
     */
    static Create(width:number, height:number, dataArray?:Float32Array, ...args:any[]){
        dataArray = dataArray?dataArray:new Float32Array(width*height);
        let newDTex = new ADataTextureFloat1D(PixelDataFloat1D.CreateBlock(width, height, dataArray));
        return newDTex;
    }
}
