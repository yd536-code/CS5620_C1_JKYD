import {ATexture} from "../ATexture";
import {ABasicTexturedShaderModel} from "./ABasicTexturedShaderModel";


/**
 * A textured Blinn-Phong shader model for terrain: materials get a diffuse texture, an optional height-map texture,
 * and a `texCoordScale` uniform (how many times the texture repeats).
 */
export class ATerrainShaderModel extends ABasicTexturedShaderModel{
    /**
     * Creates a terrain material.
     * @param diffuseTexture set as the `diffuse` texture
     * @param heightTexture if given, set as the `height` texture
     * @param texCoordScale value of the `texCoordScale` uniform (default 10)
     * @param uniforms more uniform values to set on the new material, keyed by name
     * @param args passed on to the parent `CreateMaterial` after `uniforms`
     */
    CreateMaterial(
        diffuseTexture:ATexture,
        heightTexture?:ATexture,
        texCoordScale:number=10.0,
        uniforms:{[name:string]:any}={},
        ...args:any[]){
        // The texture is set just below (even when undefined, which marks it as not provided).
        let mat = super.CreateMaterial(undefined, uniforms, ...args);
        mat.setTexture('diffuse', diffuseTexture);
        mat.setUniform("texCoordScale", texCoordScale)
        if(heightTexture){
            mat.setTexture('height', heightTexture)
        }
        return mat;
    }
}
