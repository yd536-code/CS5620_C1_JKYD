
import * as THREE from "three";
import {AShaderMaterial, AShaderModel, AShaderModelBase} from "../material";
import {ALabel} from "../../base";
import {ATexture} from "../ATexture";


/**
 * A ready-made shader model that uses the `blinnphong` shader with a diffuse texture. The `blinnphong` shader must
 * already be loaded into `AssetManager.shaders`.
 */
@ALabel("ATexturedMaterialModel")
export class ATexturedMaterialModel extends AShaderModel{
    /** The texture's name, or its file name when loaded from a path. */
    textureName:string;
    /**
     * @param texture an {@link ATexture}, or an image file name under `./images/` (default `marble.jpg`). A texture
     * loaded from a file name is set to repeat (wrap).
     */
    constructor(texture?:string|ATexture) {
        // texture=texture??marble;
        // super("textured2D");
        super("blinnphong")
        if(texture instanceof ATexture){
            this.setTexture('diffuse', texture);
            this.textureName = texture.name;
        }else{
            let textureName = texture??'marble.jpg';
            this.textureName=textureName;
            this.setTexture('diffuse', './images/'+this.textureName);
            this.getTexture('diffuse')?.setWrapToRepeat();
        }
        // this.setTexture('normal', undefined);
    }

    /**
     * Creates a material with this model's diffuse texture and preset uniforms (`ambient` 0.2, `exposure` 1,
     * `specularExp` 20, `specular` 1, `diffuse` 2.5).
     */
    CreateMaterial(){
        let mat = super.CreateMaterial();
        mat.setUniform('ambient', 0.2);
        mat.setUniform('exposure', 1.0);
        mat.setUniform('specularExp', 20);
        mat.setUniform('specular', 1.0);
        mat.setUniform('diffuse', 2.5);
        // mat.setTexture('maintexture', './images/'+this.textureName);
        mat.setTexture('diffuse', this.getTexture('diffuse'));
        return mat;
    }

    /** Returns texture-upload controls and sliders for `specular`, `specularExp`, `diffuse`, `ambient`, and `exposure`. */
    getMaterialGUIParams(material:AShaderMaterial){
        const self = this;
        return {
            ...self.getTextureGUIParams(material),
            ...AShaderModelBase.ShaderUniformGUIControl(material, 'specular', 1.0, {
                min:0,
                max:5,
                step:0.01
            }),
            ...AShaderModelBase.ShaderUniformGUIControl(material, 'specularExp', 10, {
                min:0,
                max:100,
                step:0.01
            }),
            ...AShaderModelBase.ShaderUniformGUIControl(material, 'diffuse', 1.0, {
                min:0,
                max:5,
                step:0.01
            }),
            ...AShaderModelBase.ShaderUniformGUIControl(material, 'ambient', 1.0, {
                min:0,
                max:2,
                step:0.01
            }),
            ...AShaderModelBase.ShaderUniformGUIControl(material, 'exposure', 1, {
                min:0,
                max:20,
                step:0.01
            })
        }
    }


    /** Same as the base version, but also turns on per-vertex colors (unless `settingArgs` overrides it). */
    _CreateTHREEJS(){
        let uniforms = {uniforms:THREE.UniformsUtils.merge([
                THREE.UniformsLib['lights'],
                {...this.uniforms}
            ])};
        return new this.materialClass({
            vertexShader: this.vertexSource,
            fragmentShader: this.fragSource,
            vertexColors: true,
            ...this.settingArgs,
            ...this.defaults,
            ...uniforms,
            ...this.sharedParameters,
        });
    }

}

