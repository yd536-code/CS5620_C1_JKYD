import * as THREE from "three";
import {ALabel} from "../../base/aserial";
import {AObject, AObjectState} from "../../base/aobject";

/** Shader-loading constants: the URL prefix that shader paths are relative to, and the default shader name. */
export enum ShaderManagerEnums{
    SHADER_DIRECTORY_URL='shaders/',
    DEFAULT_SHADER='basic'
}


/**
 * The GLSL source for one shader program (a vertex shader and a fragment shader). Loading starts as soon as the
 * object is constructed; await `sourcesLoadedPromise` before reading `vertexSource`/`fragSource`.
 */
export class AShaderProgramSource extends AObject{
    public name: string;
    public vertexURL: string;
    public fragURL: string;
    @AObjectState vertexSource!: string;
    @AObjectState fragSource!: string;
    /** Resolves to this object once both source files have loaded. */
    public sourcesLoadedPromise:Promise<this>;

    constructor(name: string, vertexURL: string, fragURL: string) {
        super();
        this.name = name;
        this.vertexURL = vertexURL;
        this.fragURL = fragURL;
        const self = this;
        async function loadSources(){
            self.vertexSource = (await AShaderProgramSource.LoadShaderFile(vertexURL)) as string;
            self.fragSource = (await AShaderProgramSource.LoadShaderFile(fragURL)) as string;
            return self;
        };
        this.sourcesLoadedPromise = loadSources();
        // this.sourcesLoadedPromise = new Promise(function (myResolve, myReject){
        //     self.vertexSource = (ShaderProgramSource.LoadShaderFile(vertexURL)) as string;
        //     self.fragSource = (ShaderProgramSource.LoadShaderFile(fragURL)) as string;
        //     myResolve();
        // });
        // this.sourcesLoadedPromise = loadSources();
    }

    /** Fetches a text file (a shader source) and returns a promise for its contents. */
    static LoadShaderFile(sourceURL: string) {
        let shaderLoader = new THREE.FileLoader();
        let shaderSource = shaderLoader.loadAsync(
            sourceURL,
            function (xhr) {
                // console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            });
        return shaderSource;
    }
}

/** A promise that resolves to a loaded {@link AShaderProgramSource}. */
export type ShaderPromise = Promise<AShaderProgramSource>;

/**
 * Keeps track of loaded shader sources by name. The app uses one shared instance, `ShaderManager`, which is also
 * `AssetManager.shaders`.
 */
@ALabel("AShaderSourceManager")
export class AShaderSourceManager extends AObject{
    @AObjectState _shaderSources!:{[name:string]:AShaderProgramSource}
    _shaderPromises:{[name:string]:Promise<AShaderProgramSource>}={};
    constructor() {
        super();
        this._shaderSources={};
    }

    /** Returns the URL for a shader path given relative to `public/shaders/`. */
    static GetURLForShaderAtPath(path:string){
        return ShaderManagerEnums.SHADER_DIRECTORY_URL+path;
    }

    /** Returns the loading promise for the named shader, or `undefined` if `LoadShader` was never called for it. */
    getShaderPromise(name:string){
        return this._shaderPromises[name];
    }

    /**
     * Loads a shader's source files and registers them under `name`. Paths are relative to the `public/shaders/`
     * directory, so if the shader is at `public/shaders/myshader/myshader.vert.glsl` then `vertexPath` should be
     * `myshader/myshader.vert.glsl`. If only a name is given, the paths default to
     * `public/shaders/{name}/{name}.vert.glsl` and `public/shaders/{name}/{name}.frag.glsl`.
     *
     * Calling this again for the same name loads the files again and replaces the registered source; use
     * `GetShaderSource` to check first.
     * @param name the name to register the shader under
     * @param vertexPath optional vertex shader path, relative to `public/shaders/`
     * @param fragPath optional fragment shader path, relative to `public/shaders/`
     * @returns a promise that resolves to the loaded {@link AShaderProgramSource}
     */
    LoadShader(name:string, vertexPath?:string, fragPath?:string):ShaderPromise{
        let vPath = vertexPath??`${name}/${name}.vert.glsl`
        let fPath = fragPath??`${name}/${name}.frag.glsl`
        const self=this;
        let newSource =
            new AShaderProgramSource(
                name,
                AShaderSourceManager.GetURLForShaderAtPath(vPath),
                AShaderSourceManager.GetURLForShaderAtPath(fPath)
            );
        self._shaderSources[name]=newSource;
        self._shaderPromises[name]=newSource.sourcesLoadedPromise;
        return this._shaderPromises[name];
    }

    /**
     * Returns the registered source for `name`, or `undefined` if it was never loaded. The source may still be
     * loading; await its `sourcesLoadedPromise` before using it.
     */
    GetShaderSource(name:string){
        return this._shaderSources[name];
    }
}


/** The shared shader source manager (the same object as `AssetManager.shaders`). */
export const ShaderManager = new AShaderSourceManager();
