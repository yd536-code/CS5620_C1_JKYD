import {ATexture} from "../../index";
import {ALabel, AShaderMaterial, AShaderModelBase, GetAppState} from "../../index";
import { ABlinnPhongShaderModel} from "../../rendering/shadermodels";

/** A Blinn-Phong shader model whose `CreateMaterial` can also set the material's diffuse texture. */
@ALabel("StandardTexturedShaderModel")
export class StandardTexturedShaderModel extends ABlinnPhongShaderModel{
    /**
     * Creates a material from this shader model and, if `diffuseTexture` is given, sets it as the material's
     * `diffuse` texture.
     * @param diffuseTexture optional diffuse texture
     * @param args passed to the base `CreateMaterial`
     */
    CreateMaterial(diffuseTexture?:ATexture, ...args:any[]){
        let mat = super.CreateMaterial(...args);
        if(diffuseTexture !== undefined) {
            mat.setTexture('diffuse', diffuseTexture);
        }
        return mat;
    }
}
