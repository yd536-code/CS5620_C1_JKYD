import {AMaterial} from "./AMaterial";
import {ATexture} from "../ATexture";
import {ASerializable, AObjectState} from "../../base";
import {AShaderModel} from "./AShaderModel";
import type {ShaderUniformDict} from "./AShaderModel";
import * as THREE from "three";
import {Color, V2, Vec2, Vec3, Vec4} from "../../math";
import {TextureKeyForName, TextureProvidedKeyForName, TextureSizeKeyForName} from "../../defines";
import {GetAppState} from "../../appstate";
import {GUISpecs} from "../../controlpanel/GUISpecs";

/**
 * How a uniform value is saved by `AShaderMaterial.toJSON`. Numbers, booleans, strings, and `null` are saved as-is.
 * `THREE.Vector2/3/4` values are saved with a tag naming their class so they load back as the same class instead of
 * a plain `{x, y, z, w}` object. Texture uniforms (`type: 't'`) are not saved this way; they are restored from
 * `textures`.
 * @internal
 */
export type SerializedUniformValue =
    number | boolean | string | null
    | {_athreeVector:'Vector2'|'Vector3'|'Vector4', values:number[]};

/** Converts a uniform value to its saved form, or warns and returns `undefined` if the type isn't supported. */
function serializeUniformValue(value:any):SerializedUniformValue|undefined{
    if(value instanceof THREE.Vector4){
        return {_athreeVector:'Vector4', values:[value.x, value.y, value.z, value.w]};
    }
    if(value instanceof THREE.Vector3){
        return {_athreeVector:'Vector3', values:[value.x, value.y, value.z]};
    }
    if(value instanceof THREE.Vector2){
        return {_athreeVector:'Vector2', values:[value.x, value.y]};
    }
    if(typeof value === "number" || typeof value === "boolean" || typeof value === "string" || value === null){
        return value;
    }
    if(process.env.NODE_ENV !== "production"){
        console.warn(`AShaderMaterial.toJSON: don't know how to serialize a uniform value of type "${typeof value}"${value?.constructor?.name?` (${value.constructor.name})`:""} -- dropping it. Only numbers/booleans/strings/THREE.Vector2/Vector3/Vector4 are supported; texture-valued uniforms are handled separately via "textures".`);
    }
    return undefined;
}

/** Inverse of `serializeUniformValue`: turns tagged vectors back into `THREE.Vector2/3/4`. */
function deserializeUniformValue(value:any):any{
    if(value !== null && typeof value === "object" && "_athreeVector" in value){
        const v = (value as {values:number[]}).values;
        switch((value as {_athreeVector:string})._athreeVector){
            case 'Vector2': return new THREE.Vector2(v[0], v[1]);
            case 'Vector3': return new THREE.Vector3(v[0], v[1], v[2]);
            case 'Vector4': return new THREE.Vector4(v[0], v[1], v[2], v[3]);
        }
    }
    return value;
}

/**
 * A material instance built from an {@link AShaderModel}: wraps a `THREE.ShaderMaterial` and adds helpers for setting
 * uniforms and textures. Use `setUniform` to pass values to your GLSL code.
 *
 * `uniforms` holds only the uniforms set on this material (through `setUniform`, `setTexture`, or the `uniforms`
 * argument of `CreateMaterial`). Uniforms that come only from the model's default dictionary are still in the
 * Three.js material, but `getUniformValue` returns `undefined` for them and `toJSON` does not save them.
 */
@ASerializable("AShaderMaterial")
export class AShaderMaterial extends AMaterial{
    /** Uniforms set on this material. Each is also written to `threejs.uniforms`. */
    @AObjectState uniforms!:ShaderUniformDict;
    /** The wrapped `THREE.ShaderMaterial`. */
    get threejs():THREE.ShaderMaterial{
        return this._material as THREE.ShaderMaterial;
    }

    /** Returns the value of uniform `name` from `uniforms`, or `undefined` if it was never set on this material. */
    getUniformValue(name:string) {
        let uniform = this.uniforms[name];
        return uniform?.value;
    }

    // setModelColor(v:Color|THREE.Color){
    //     this.setUniformColor('modelColor', v);
    // }


    // getModelColor(){
    //     let c = this.getUniformValue('modelColor');
    //     if(c){
    //         return Color.FromThreeJS(c);
    //     }else{
    //         return Color.FromString("#77bb77");
    //     }
    // }

    /** Returns the vec4 uniform `name` as a {@link Color}. */
    getUniformColorValue(name:string){
        let v4 = this.getUniformValue(name);
        return Color.FromTHREEVector4(v4);
    }


    /** This material's textures by name (e.g. `diffuse`). Set them with `setTexture`. */
    public textures:{[name:string]:ATexture|undefined}={};
    /** The shader model this material was created from. */
    get model():AShaderModel{
        return this._model as AShaderModel;
    }

    constructor(...args:any[]) {
        super(...args);
        this.uniforms = {};
    }

    /**
     * Returns a new material with the same model, a clone of the `THREE.ShaderMaterial`, and the same uniform values
     * and textures. Changing a uniform on the copy does not change the original.
     *
     * The {@link ATexture} objects in `textures` are shared, not copied, and texture uniforms (`type: 't'`) in the
     * copy's Three.js material point at the same `THREE.Texture` as the original's. That way a texture that changes
     * later (for example, a data texture after `setTextureNeedsUpdate()`) shows up in both materials.
     */
    static Clone(material:AMaterial){
        const clone = super.Clone(material) as AShaderMaterial;
        const source = material as AShaderMaterial;
        // Three.js deep-copies the uniforms when it clones the material (`clone.threejs.uniforms`). Copy our
        // dictionary from those copies, the way `setUniform` writes each uniform to both places.
        const threeUniforms:{[name:string]:any} = clone.threejs.uniforms;
        const sourceThreeUniforms:{[name:string]:any} = source.threejs?.uniforms ?? {};
        clone.uniforms = {};
        for(const name in source.uniforms){
            const original:{value:any, type?:string} = source.uniforms[name];
            let copy = threeUniforms[name];
            if(copy === undefined){
                copy = {...original};
                threeUniforms[name] = copy;
            }
            if(original.type === 't' && sourceThreeUniforms[name] !== undefined){
                // Share the original THREE.Texture instead of Three.js's copy of it.
                copy.value = sourceThreeUniforms[name].value;
            }
            clone.uniforms[name] = copy;
        }
        clone.textures = {...source.textures};
        return clone;
    }


    /** Sets the model, creates the `THREE.ShaderMaterial`, and copies the model's default textures into `textures`. */
    setModel(model: AShaderModel) {
        super.setModel(model);
        this.loadTexturesFromShaderModel(model);
    }


    /**
     * Copies the texture references from `model` (default: this material's model) into `textures`. Does not set
     * any uniforms.
     */
    loadTexturesFromShaderModel(model?:AShaderModel){
        let shader = model??this.model;
        for(let t in shader.textures){
            this.textures[t]=shader.textures[t];
        }
    }

    //##################//--Uniforms--\\##################
    //<editor-fold desc="Uniforms">
    /**
     * Replaces `uniforms` with the given dictionary. Does not update the Three.js material; use `setUniforms` for
     * that.
     */
    setUniformsDict(uniforms:ShaderUniformDict){
        this.uniforms = uniforms;
    }

    /** Calls `setUniform` for each `{value, type}` entry in `uniforms`. */
    setUniforms(uniforms:ShaderUniformDict){
        if(!this.uniforms){
            this.uniforms = {};
        }
        for (let u in uniforms){
            // @ts-ignore
            this.setUniform(u, uniforms[u].value, uniforms[u].type);
        }
    }

    /** Same as `setTexture("diffuse", texture)`. */
    setDiffuseTexture(texture?:ATexture|string):void{
        return this.setTexture("diffuse", texture);
    }

    /**
     * Sets the texture `name` and the uniforms your shader reads it from:
     * `{name}Map` (the `sampler2D`), `{name}MapProvided` (a bool), and `{name}Size` (a vec2 of width and height).
     * For example, `setTexture("diffuse", tex)` sets `diffuseMap`, `diffuseMapProvided`, and `diffuseSize`.
     * Passing `undefined` removes the texture (`{name}MapProvided` becomes false).
     * @param texture an {@link ATexture}, or a path to an image file to load
     */
    setTexture(name:string, texture?:ATexture|string){
        if(texture) {
            if (texture instanceof ATexture) {
                this.textures[name] = texture;
            } else {
                this.textures[name] = new ATexture(texture);
            }
            let tex = this.getTexture(name);
            this.setUniform(TextureKeyForName(name), tex?.threejs, 't');
            this.setUniform(TextureProvidedKeyForName(name), !!tex, 'bool');
            this.setUniform(TextureSizeKeyForName(name), tex?new Vec2(tex.width, tex.height):V2());
        }else if(texture===undefined){
            this.textures[name] = texture;
            this.setUniform(TextureKeyForName(name), null, 't');
            this.setUniform(TextureProvidedKeyForName(name), false, 'bool');
            this.setUniform(TextureSizeKeyForName(name), new Vec2(0,0));
        }
    }

    /** The `diffuse` texture. Setting it calls `setTexture("diffuse", value)`. */
    set diffuseTexture(value:ATexture|undefined){this.setTexture("diffuse", value);}

    get diffuseTexture(){return this.getTexture("diffuse");}




    /** Returns the texture named `name`, if any. */
    getTexture(name:string){
        return this.textures[name];
    }

    /**
     * Sets uniform `name` on this material, in both `uniforms` and the live Three.js material. AniGraph `Vec2`,
     * `Vec3`, `Vec4`, and {@link Color} (as a vec4 with alpha) are converted to Three.js vectors, and a boolean with
     * no `type` is tagged `'bool'`. Does not signal an event.
     * @param type optional uniform type tag (e.g. `'float'`, `'vec4'`, `'t'`)
     */
    setUniform(name:string, value:any, type?:string) {
        if(value instanceof Vec3){
            this.setUniform(name, value.asThreeJS(), 'vec3');
            return;
        }
        if(value instanceof Vec4){
            this.setUniform(name, value.asThreeJS(), 'vec4');
            return;
        }
        if(value instanceof Vec2){
            this.setUniform(name, new THREE.Vector2(value.x, value.y), 'vec2');
            return;
        }

        if(value instanceof Color){
            this.setUniform(name, value.Vec4, 'vec4');
            return;
        }

        if(typeof value == "boolean" && type===undefined){
            this.setUniform(name, value, 'bool');
            return;
        }

        // if(Array.isArray(value) && !isNaN(value[0]) && !type){
        //     type = 'fv';
        // }

        let uval: { [name: string]: any } = {value:value};
        if (type !== undefined) {
            uval['type'] = type;
        }
        // @ts-ignore
        this.uniforms[name] = uval;
        if(this.threejs){
            // @ts-ignore
            this.threejs.uniforms[name] = uval;
        }
    }

    /** Sets a vec2 uniform. */
    setUniform2fv(name:string, value:Vec2){
        this.setUniform(name, new THREE.Vector2(value.x, value.y), 'vec2');
    }

    /** Sets a vec3 uniform. */
    setUniform3fv(name:string, value:Vec3) {
        this.setUniform(name, value.asThreeJS(), 'vec3');
    }

    /** Sets a vec4 uniform. */
    setUniform4fv(name:string, value:Vec4) {
        this.setUniform(name, value.asThreeJS(), 'vec4');
    }



    /**
     * Sets a vec4 color uniform (r, g, b, a).
     * @param value An AniGraph {@link Color}, whose alpha is used unless `alpha` is given. A `THREE.Color` has no
     * alpha: with `alpha` it becomes a vec4 `(r, g, b, alpha)`; without it, it is stored as is, with a warning.
     * @param alpha Optional alpha that replaces the color's own alpha.
     */
    setUniformColor(name:string, value:Color|THREE.Color, alpha?:number){
        if(value instanceof THREE.Color){
            if(alpha === undefined){
                console.warn("Ambiguous when setting uniform color with three.color: do you want a vec3 or vec4? Setting with AniGraph Color is safer...");
                this.setUniform(name, value, 'vec4');
            }else{
                this.setUniform(name, new THREE.Vector4(value.r, value.g, value.b, alpha), 'vec4');
            }
        }else{
            const v4 = value.Vec4.asThreeJS();
            if(alpha !== undefined){
                v4.w = alpha;
            }
            this.setUniform(name, v4, 'vec4');
        }
    }


    /**
     * Returns a color control spec that sets the color uniform `uniformName`. The control starts at the uniform's
     * current value, or `defaultValue` (default green) if it isn't set.
     */
    CreateUniformColorControl(uniformName:string, defaultValue?:Color){
        const self = this;
        defaultValue=defaultValue??Color.Green();
        return GUISpecs.ColorControl(
            (c:Color)=>{
                self.setUniformColor(uniformName, c);
            },
            this.getUniformValue(uniformName)??defaultValue
        )
    }

    /** Sets uniform `uniformName` to `initialValue` and returns a slider control spec that updates it. */
    CreateUniformSliderControl(uniformName:string, initialValue:any, min:number, max:number, step?:number){
        const self = this;
        this.setUniform(uniformName, initialValue);
        return GUISpecs.SliderControl(
            (v:number)=>{
                self.setUniform(uniformName, v);
            },
            initialValue,
            min, max, step
        )
    }

    /**
     * Keeps a uniform in sync with an app-state value (e.g. a control-panel slider): applies the current value now
     * and again whenever it changes.
     * @param uniformName the uniform to set
     * @param stateName the app-state key to follow (default: `uniformName`)
     * @param onChange custom handler instead of setting the uniform directly, e.g.
     * `(value)=>{self.setUniform(uniformName, value*10.0)}`
     */
    attachUniformToAppState(uniformName:string, stateName?:string, onChange?:(value:any)=>void){
        let appState = GetAppState();
        let name = uniformName;
        stateName = stateName??uniformName;
        const self=this;

        onChange = onChange?onChange:(value:any) =>{
            self.setUniform(name, value);
        }

        onChange(appState.getState(stateName));
        self.subscribe(appState.addStateValueListener(stateName, (value:any)=>{
            if(onChange) {
                onChange(value);
            }
        }), `${stateName}_update`);
    }




    //</editor-fold>
    //##################\\--Uniforms--//##################

    /**
     * Serializes the material as `{modelName, uniforms, textures}`: the model reference from {@link AMaterial.toJSON}
     * plus this material's own uniforms and textures. Only uniforms in `uniforms` are saved (not model defaults),
     * and values of unsupported types are dropped with a warning.
     *
     * `textures` holds the live {@link ATexture} objects; the serializer handles them like any other nested
     * serializable object, so a texture shared by several materials is saved once. Texture uniforms (`type: 't'`)
     * are skipped, because a `THREE.Texture` isn't JSON-safe; `fromJSON` restores them by calling `setTexture`.
     */
    toJSON(){
        const base = super.toJSON();
        const textures:{[name:string]:ATexture} = {};
        for(const name in this.textures){
            const tex = this.textures[name];
            if(tex){
                textures[name] = tex;
            }
        }
        const uniforms:{[name:string]:{value:SerializedUniformValue, type?:string}} = {};
        for(const key in this.uniforms){
            // THREE's IUniform<any> doesn't declare "type", but this codebase's own setUniform() always stores one (see its own @ts-ignore) -- annotate it explicitly here rather than repeating that suppression.
            const u:{value:any, type?:string}|undefined = this.uniforms[key];
            if(!u || u.type === 't'){
                continue;
            }
            const serialized = serializeUniformValue(u.value);
            if(serialized === undefined){
                continue;
            }
            uniforms[key] = {value:serialized, type:u.type};
        }
        return {...base, uniforms, textures};
    }

    /** Rebuilds a material from `toJSON` output: creates it from the named model, then restores textures and uniforms. */
    static fromJSON(data:{modelName?:string, uniforms?:{[name:string]:{value:any, type?:string}}, textures?:{[name:string]:ATexture}}){
        const material = AMaterial.fromJSON(data) as AShaderMaterial;
        for(const name in data.textures ?? {}){
            material.setTexture(name, data.textures![name]);
        }
        for(const key in data.uniforms ?? {}){
            const u = data.uniforms![key];
            material.setUniform(key, deserializeUniformValue(u.value), u.type);
        }
        return material;
    }

    // initMaterial(parameters?:MaterialParameters){
    //     let params = {uniforms:this.uniforms};
    //     if(parameters!==undefined){
    //         params = {...params, ...parameters};
    //     }
    //     // this._shaderSource.sourcesLoadedPromise;
    //     this._material = new THREE.ShaderMaterial({
    //             vertexShader:this.model.vertexSource,
    //             fragmentShader:this.model.fragSource,
    //             transparent: true,
    //             lights:true,
    //             ...parameters
    //         }
    //     )
    // }

    // async initMaterialAsync(parameters?:MaterialParameters){
    //     const self = this;
    //     this.model.sourcesLoadedPromise.then(()=>{self.initMaterial();});
    // }

}
