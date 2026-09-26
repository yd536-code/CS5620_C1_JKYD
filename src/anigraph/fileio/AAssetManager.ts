import {AObject} from "../base";
import {
    AMaterialModelBase, AShaderMaterial,
    AShaderModel,
    ATexture
} from "../rendering";
import {AMaterialManager} from "../rendering/material/AMaterialManager";
import {AShaderSourceManager, ShaderManager} from "../rendering/material/ShaderManager";
import {AObject3DModelWrapper} from "../geometry";
import {Color, NodeTransform3D, TransformationInterface} from "../math";
import {AModelLoader3D} from "./AModelLoader3D";
import {ALineShaderModel} from "../rendering/material/shadermodels/ALineShaderModel";
import {ClassInterface} from "../basictypes";
import type {ALoadedModel3D} from "../scene/nodes/loaded";


/** Name under which a model asset's texture is stored in the texture dictionary: `${assetName}_${textureName}`. */
function GetTextureName(assetName:string, textureName:string){
    return `${assetName}_${textureName}`;
}


/**
 * Describes a 3D model asset to register with {@link AssetManager} (via `addModelAssetDetails` or
 * `addModelAssetDetailsDict`) before loading it with `loadModelAsset`.
 *
 * Each key in `textures` is the texture name passed to `material.setTexture`. For a texture "myTex", use the key
 * "myTex"; the sampler in your shader should then be named "myTexMap".
 */
export interface ModelDetails {
    path: string, // path to the 3D model file (.obj, .ply, .glb, or .gltf)
    textures: {[name:string]:string} | undefined, // a dictionary mapping texture names to texture file paths
    vertexColors?:boolean, // if true, createModelFromAsset turns on vertex colors in the material it is given
    modelTransform?:TransformationInterface|undefined // stored as the loaded model's sourceTransform (applied to the model before the node's own transform)
}

/**
 * Loads and stores assets (3D models, textures, shaders) by name and creates materials from them. Use the exported
 * {@link AssetManager} singleton rather than making your own instance.
 *
 * What happens when you load the same name twice depends on the asset type:
 * - textures (`loadTexture`) are cached: the file is loaded again only if the path changed or `forceReload` is true.
 * - 3D models (`load3DModel`, `loadModelAsset`) are loaded again and replace the stored model.
 * - shader material models (`loadShaderMaterialModel`) skip loading the shader source if one with that name is
 *   already loaded. (`ShaderManager.LoadShader` itself always reloads.)
 * @internal
 */
export class AAssetManager extends AObject{

    /** If true, `log` prints messages to the console. */
    static logging:boolean = false;
    /** Prints `logstring` to the console if `AAssetManager.logging` is true. */
    static log(logstring:string){
        if(this.logging){
        console.log(logstring)
    }
    }

    /** The singleton instance (same object as the exported {@link AssetManager}). */
    static AssetManager:AAssetManager;
    /** Registered model assets, keyed by asset name. */
    modelAssetsDetails:{[name:string]:ModelDetails}={};

    /** Registers a model asset under `name` so it can later be loaded with `loadModelAsset(name)`. */
    addModelAssetDetails(name:string, modelDetails:ModelDetails){
        this.modelAssetsDetails[name]=modelDetails;
    }
    /** Registers several model assets at once. Entries replace any existing ones with the same name. */
    addModelAssetDetailsDict(modelAssetsDetails:{[name:string]:ModelDetails}){
        this.modelAssetsDetails = {...this.modelAssetsDetails, ...modelAssetsDetails};
    }

    /** Loads and stores shader source code (the shared {@link ShaderManager}). */
    shaders :AShaderSourceManager;
    /** Material models, keyed by name. Materials are created from these. */
    materials:AMaterialManager;
    /** Loaded textures, keyed by name. Use `getTexture`. Filled by `loadTexture`, which caches by name. */
    _textures:{[name:string]:ATexture}={};
    /** Texture loads that have started but not finished, keyed by name (with the path each is loading from). */
    _pendingTextureLoads:{[name:string]:{path:string, promise:Promise<ATexture>}}={};
    /** Loaded 3D models, keyed by name. Use `get3DModel`. */
    _3Dmodels:{[name:string]:AObject3DModelWrapper}={};
    // DEFAULT_MATERIALS=AMaterialManager.DefaultMaterials;

    /** Names of the built-in material models (e.g. `Basic`, `RGBA_SHADER`, `TEXTURED2D_SHADER`). */
    get DEFAULT_MATERIALS(){
        return AMaterialManager.DefaultMaterials;
    }
    /**
     * Loads a texture asynchronously and stores it in the texture dictionary under `name`.
     *
     * Textures are cached by name: if a texture was already loaded under `name` from the same `path`, this returns
     * right away and `getTexture(name)` keeps returning that same {@link ATexture} object. The file is loaded again
     * (and the stored texture replaced) only if:
     * - `forceReload` is true (e.g. the image file changed on disk), or
     * - `name` was last loaded from a different `path` (so reusing a name like "particle" for a new image works).
     *
     * If the file can't be found, `ATexture.LoadAsync` gives back the ERROR texture, and that is what gets cached;
     * pass `forceReload` to try again.
     *
     * Two calls for the same name and path that overlap in time share one file load.
     * @param path the path (URL) of the texture, e.g. relative to the `public/` directory
     * @param name the name to store the texture under. Defaults to the file name (with extension).
     * @param forceReload if true, always load the file again, even if it is cached
     * @returns {Promise<void>}
     */
    async loadTexture(path:string, name?:string, forceReload:boolean=false){
        if(name === undefined){
            name = path.replace(/^.*[\\/]/, '')
        }
        const key = name;
        if(!forceReload){
            // Already loaded from this path? Keep the texture we have.
            const cached = this._textures[key];
            if(cached !== undefined && cached._url === path){
                return;
            }
            // Already being loaded from this path? Wait for that load instead of starting another.
            const pending = this._pendingTextureLoads[key];
            if(pending !== undefined && pending.path === path){
                await pending.promise;
                return;
            }
        }
        AAssetManager.log(`Loading image at path ${path}`)
        const promise = ATexture.LoadAsync(path);
        const pendingLoad = {path:path, promise:promise};
        this._pendingTextureLoads[key] = pendingLoad;
        try{
            const texture = await promise;
            // Only store the result if no newer load for this name was started while we were waiting.
            if(this._pendingTextureLoads[key] === pendingLoad){
                this._textures[key] = texture;
            }
        }finally{
            if(this._pendingTextureLoads[key] === pendingLoad){
                delete this._pendingTextureLoads[key];
            }
        }
        return;
    }

    /** Returns the loaded texture with the given name, or `undefined` if none was loaded. */
    getTexture(name:string){
        return this._textures[name];
    }

    /**
     * Loads a registered 3D model asset (see {@link ModelDetails}) along with any textures listed in its details.
     * The model is stored under `name`; each texture is stored as `${name}_${textureName}`.
     * @param name - The name the asset was registered under. Throws if nothing is registered with this name.
     * @returns {Promise<void>}
     */
    async loadModelAsset(name:string){
        let modelTransform = ('modelTransform' in this.modelAssetsDetails[name])?this.modelAssetsDetails[name].modelTransform:undefined;
        await this.load3DModel(this.modelAssetsDetails[name].path, name, modelTransform);
        let texturePaths = this.modelAssetsDetails[name].textures
        if(texturePaths !== undefined){
            for(let tname in texturePaths) {
                await this.loadTexture(texturePaths[tname], GetTextureName(name, tname));
            }
        }
    }

    /**
     * Creates a node model from a loaded 3D model asset and assigns it `material`.
     *
     * Textures are set on the material first: if the asset was registered with `textures`, each one is set under
     * its key; otherwise a texture loaded under the asset's own name is used as `diffuse`, or else the textures
     * embedded in the model file are used (its color map as `diffuse`, its normal map as `normal`). If the asset was registered with `vertexColors: true`, the material is
     * set to use vertex colors.
     * @param assetName - The name of the asset. Throws if it hasn't been loaded (e.g. in `PreloadAssets`).
     * @param modelClass - The node model class to create. Should inherit from {@link ALoadedModel3D}.
     * @param material - The material to use. Note that this material object is modified (textures are set on it).
     * @param args - any other args for `modelClass.Create`
     * @returns {ALoadedModel3D}
     */
    createModelFromAsset(
        assetName:string,
        modelClass:ClassInterface<ALoadedModel3D>,
        material:AShaderMaterial,
        ...args:any[]){
        const self = this;

        /**
         * If we haven't loaded an asset with the given name, throw an error.
         */
        if(!this.get3DModel(assetName)){
            throw new Error(`You need to load ${assetName} assets in PreloadAssets!`)
        }

        /**
         * Get an Object3D wrapper for the loaded asset.
         * @type {AObject3DModelWrapper}
         */
        let object3D = this.get3DModel(assetName);
        /**
         * Sets textures when the asset wasn't registered with a `textures` dictionary: a texture loaded under the
         * asset's own name becomes `diffuse`; otherwise the textures embedded in the model file are used. The file's
         * color map (`getTextures().color`) becomes `diffuse` and its normal map becomes `normal`. Textures the
         * file doesn't have are left alone rather than set to `undefined`.
         */
        function checkObjTextures(){
            if (self.getTexture(assetName)) {
                material.setTexture('diffuse', self.getTexture(assetName));
            } else {
                let textures:{[name:string]:ATexture|undefined} = object3D.getTextures();
                if (textures['color']) {
                    material.setTexture('diffuse', textures['color']);
                }
                if (textures['normal']) {
                    material.setTexture('normal', textures['normal']);
                }
            }
        }

        if(assetName in this.modelAssetsDetails){
            let texturePaths = this.modelAssetsDetails[assetName].textures
            if(texturePaths !== undefined){
                for(let tname in texturePaths) {
                    material.setTexture(tname, self.getTexture(GetTextureName(assetName, tname)));
                }
            }else{
                checkObjTextures();
            }
            if("vertexColors" in this.modelAssetsDetails[assetName] && this.modelAssetsDetails[assetName]["vertexColors"]){
                material.usesVertexColors = true;
            }
        }else {
            checkObjTextures();
        }

        // @ts-ignore
        const loadedmodel:ALoadedModel3D = modelClass.Create(object3D, ...args);
        loadedmodel.setMaterial(material);
        return loadedmodel;
    }



    /**
     * Loads a 3D model file with {@link AModelLoader3D.LoadFromPath} and stores it. Unlike `loadModelAsset`, this
     * does not need a registered {@link ModelDetails} and does not load textures.
     * @param path path (URL) of the model file (.obj, .ply, .glb, or .gltf)
     * @param name the name to store the model under. Defaults to the file name (with extension).
     * @param transform stored as the model's `sourceTransform`. Defaults to the identity.
     */
    async load3DModel(path:string, name?:string, transform?:TransformationInterface){
        /**
         * Load the model file into an AObject3DModelWrapper instance
         */
        if(name === undefined){
            name = path.replace(/^.*[\\/]/, '')
        }
        this._3Dmodels[name] = await AModelLoader3D.LoadFromPath(path)
        this._3Dmodels[name].sourceTransform = transform??new NodeTransform3D();
        return;
    }

    /** Returns the loaded 3D model with the given name, or `undefined` if none was loaded. */
    get3DModel(name:string){
        return this._3Dmodels[name];
    }



    /**
     * Loads the shader source (unless a source with this name is already loaded) and registers a new
     * {@link AShaderModel} for it under `name`.
     * Paths are relative to the `public/shaders/` directory,
     * so if the shader is at path `public/shaders/myshader/myshader.vert.glsl` then
     * vertexPath should be `myshader/myshader.vert.glsl`. If only a name is provided,
     * then the vertex and fragment paths will be set to
     * `public/shaders/{name}/{name}.{type}.glsl`, where {type} is `vert` for the vertex
     * shader and `frag` for the fragment shader.
     * @param name the name of the shader and of the resulting material model
     * @param vertexPath optional vertex shader path
     * @param fragPath optional fragment shader path
     * @returns {Promise<void>}
     */
    async loadShaderMaterialModel(name:string, vertexPath?:string, fragPath?:string){
        let shaderSource = this.shaders.GetShaderSource(name);
        if(shaderSource === undefined){
            await this.shaders.LoadShader(name, vertexPath, fragPath);
        }
        return this.setMaterialModel(
            name,
            new AShaderModel(name)
        )
    }

    /**
     * Same as `loadShaderMaterialModel`, but registers an {@link ALineShaderModel} (for line rendering) instead of
     * an {@link AShaderModel}. Paths follow the same rules.
     * @param name the name of the shader and of the resulting material model
     * @param vertexPath optional vertex shader path, relative to `public/shaders/`
     * @param fragPath optional fragment shader path, relative to `public/shaders/`
     * @returns {Promise<void>}
     */
    async loadLineShaderMaterialModel(name:string, vertexPath?:string, fragPath?:string){
        let shaderSource = this.shaders.GetShaderSource(name);
        if(shaderSource === undefined){
            await this.shaders.LoadShader(name, vertexPath, fragPath);
        }
        return this.setMaterialModel(
            name,
            new ALineShaderModel(name)
        )
    }

    /**
     * Registers a material model under `name`. `m` can be a material model instance, or a shader model class,
     * in which case `m.CreateModel(name, ...args)` is awaited to make the instance.
     */
    async addShaderMaterialModel(name:string, m:AMaterialModelBase<any>|typeof AShaderModel, ...args:any[]){
        if(m instanceof AMaterialModelBase<any>){
            return this.setMaterialModel(name, m);
        }else{
            let model = await (m as typeof AShaderModel).CreateModel(name, ...args);
            return this.setMaterialModel(name, model);
        }
    }

    /** Registers material model `m` under `name`. For shader models, waits until the shader source has loaded. */
    async setMaterialModel(name:string, m:AMaterialModelBase<any>){
        return this.materials.setMaterialModel(name, m);
    }

    /** Returns the material model registered under `name`, typed as an {@link AShaderModel}. */
    getShaderMaterialModel(name:string){
        return this.materials.getShaderMaterialModel(name);
    }

    /**
     * Creates a material from the built-in 2D textured shader model with `alpha` set to 1.
     * @param texture optional texture to use as the diffuse texture
     */
    Create2DTextureMaterial(texture?:ATexture):AShaderMaterial{
        let material = this.CreateShaderMaterial(AssetManager.DEFAULT_MATERIALS.TEXTURED2D_SHADER);
        if(texture !== undefined){
            material.setDiffuseTexture(texture);
        }
        material.setUniform("alpha", 1.0);
        return material;
    }


    /** Creates a material from the built-in 2D RGBA shader model (`DEFAULT_MATERIALS.RGBA_SHADER`). */
    Create2DRGBAMaterial():AShaderMaterial{
        return this.CreateMaterial(AssetManager.DEFAULT_MATERIALS.RGBA_SHADER) as AShaderMaterial;
    }

    /**
     * Creates a new material from the material model registered under `modelName`.
     * @param args passed to the material model's `CreateMaterial`
     */
    CreateMaterial(modelName:string, ...args:any[]){
        return this.materials.getMaterialModel(modelName).CreateMaterial(...args);
    }

    /** Creates a material from the built-in `Basic` material model, optionally with the given color. */
    CreateBasicMaterial(color?:Color){
        let basic = this.materials.getMaterialModel(AssetManager.DEFAULT_MATERIALS.Basic).CreateMaterial();
        if(color) {
            basic.setValue("color", color.asThreeJS());
        }
        return basic;
    }

    /** Same as `CreateMaterial`, but typed as an {@link AShaderMaterial}. */
    CreateShaderMaterial(modelName:string, ...args:any[]):AShaderMaterial{
        return this.materials.getMaterialModel(modelName).CreateMaterial(...args) as AShaderMaterial;
    }

    constructor() {
        super();
        this.shaders = ShaderManager;
        this.materials = new AMaterialManager();
    }

    /**
     * Registers a new {@link AShaderModel} under `name` for a shader whose loading was already started with
     * `shaders.LoadShader(name, ...)`. Waits for that load to finish first.
     */
    async setLoadedShaderModel(name:string){
        await this.shaders.getShaderPromise(name);
        return this.setMaterialModel(
            name,
            new AShaderModel(name)
        )
    }
}

/** The global asset manager. Load models, textures, and shaders with it, and create materials from it. */
let AssetManager = new AAssetManager();
AAssetManager.AssetManager = AssetManager;
export {AssetManager};


