import {AShaderModelBase, ShaderUniformDict} from "../AShaderModel";
import * as THREE from "three";
import {AGLLineMaterial} from "../threeMaterials";
import {ShaderMaterialParameters} from "three/src/materials/ShaderMaterial";

/**
 * A shader model for wide lines that builds {@link AGLLineMaterial}s from a custom line shader. Same constructor as
 * {@link AShaderModel} (the fourth argument is ignored), except lights default to off. Registered by `AssetManager.loadLineShaderMaterialModel`.
 */
export class ALineShaderModel extends AShaderModelBase<{ [name: string]: any }>{
    // materialClass:ClassInterface<AGLLineMaterial>=AGLLineMaterial;
    constructor(
        shaderName?:string,
        shaderSettings?:ShaderMaterialParameters,
        uniforms?:ShaderUniformDict,
        _sharedUniforms?:ShaderUniformDict,
        ...args:any[]
    ) {
        super(shaderName, AGLLineMaterial, ...args);
        this._shaderSettings = shaderSettings??{
            lights:false,
            transparent: true,
            side: THREE.DoubleSide,
            opacity:1.0
        };
        this.uniforms=uniforms??{};
        if(shaderName) {
            this.setShader(shaderName);
        }
    }
}




