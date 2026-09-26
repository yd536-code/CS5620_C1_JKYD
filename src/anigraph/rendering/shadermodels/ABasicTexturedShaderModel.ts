import {ATexture} from "../ATexture";
import {ABlinnPhongShaderModel} from "./ABlinnPhongShaderModel";

/** A Blinn-Phong shader model whose `CreateMaterial` takes a diffuse texture to set on the new material. */
export class ABasicTexturedShaderModel extends ABlinnPhongShaderModel{
    /**
     * Creates a material and, if given, sets `diffuseTexture` as its `diffuse` texture.
     * @param diffuseTexture the `diffuse` texture (optional)
     * @param uniforms uniform values to set on the new material, keyed by name (see `AShaderModelBase.CreateMaterial`)
     * @param args passed on to the parent `CreateMaterial` after `uniforms`
     */
    CreateMaterial(diffuseTexture?:ATexture, uniforms:{[name:string]:any}={}, ...args:any[]){
        let mat = super.CreateMaterial(uniforms, ...args);
        if(diffuseTexture !== undefined) {
            mat.setTexture('diffuse', diffuseTexture);
        }
        return mat;
    }
}



