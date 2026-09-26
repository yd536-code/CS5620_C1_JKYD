import * as THREE from "three";
import {ShaderMaterialParameters} from "three/src/materials/ShaderMaterial";
import {AShaderProgramSource, ShaderManager} from "../ShaderManager";
import {MaterialParameters, Vector2} from "three/src/Three";
import {AssetManager} from "../../../fileio/AAssetManager";

// import {
//     ShaderLib,
//     ShaderMaterial,
//     UniformsLib,
//     UniformsUtils,
//     Vector2
// } from 'three';


/** Parameters for Three.js-style line materials (`LineMaterial` and {@link AGLLineMaterial}). */
export interface LineMaterialParameters extends MaterialParameters {
    alphaToCoverage?: boolean | undefined;
    color?: number | undefined;
    dashed?: boolean | undefined;
    dashScale?: number | undefined;
    dashSize?: number | undefined;
    dashOffset?: number | undefined;
    gapSize?: number | undefined;
    linewidth?: number | undefined;
    resolution?: Vector2 | undefined;
    wireframe?: boolean | undefined;
    worldUnits?: boolean | undefined;
}

// Registers the line uniforms and, once the `line` shader has loaded, a `line` entry in THREE.ShaderLib.
// @ts-ignore
THREE.UniformsLib.line = {
    worldUnits: { value: 1 },
    linewidth: { value: 1 },
    resolution: { value: new THREE.Vector2( 1, 1 ) },
    dashOffset: { value: 0 },
    dashScale: { value: 1 },
    dashSize: { value: 1 },
    gapSize: { value: 1 } // todo FIX - maybe change to totalSize

};

AssetManager.shaders.LoadShader('line', 'line/line.vert.glsl', 'line/line.frag.glsl').then((programSounrce:AShaderProgramSource)=>{
    // AssetManager.shaders.GetShaderSource('line').sourcesLoadedPromise.then();
    programSounrce.sourcesLoadedPromise.then((loadedProgrameSource)=> {
        THREE.ShaderLib['line'] = {
            uniforms: THREE.UniformsUtils.merge([
                THREE.UniformsLib.common,
                THREE.UniformsLib.fog,
                // @ts-ignore
                THREE.UniformsLib.line
            ]),

            vertexShader: programSounrce.vertexSource,
            fragmentShader: programSounrce.fragSource
        };
    });
});


let ShaderLibLineDict = {
    uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.common,
        THREE.UniformsLib.fog,
        {
            worldUnits: {value: 1},
            linewidth: {value: 1},
            resolution: {value: new THREE.Vector2(1, 1)},
            dashOffset: {value: 0},
            dashScale: {value: 1},
            dashSize: {value: 1},
            gapSize: {value: 1} // todo FIX - maybe change to totalSize
        }
    ])
}


/**
 * A `THREE.ShaderMaterial` for wide lines, modeled on Three.js's `LineMaterial`. It starts with the standard line
 * uniforms (`linewidth`, `resolution`, dash settings, ...) and exposes them as properties (`linewidth`, `dashed`,
 * `dashScale`, `resolution`, `opacity`, `worldUnits`, ...). The vertex/fragment shaders come from the `parameters`
 * (see {@link ALineShaderModel}).
 */
export class AGLLineMaterial extends THREE.ShaderMaterial {
    isLineMaterial:boolean=true;
    static DEFAULT_LINE_WIDTH=0.01;

    /** The line color (the `diffuse` uniform). */
    get color(){
        return this.uniforms.diffuse.value;
    }

    set color(value:THREE.Color){
        this.uniforms.diffuse.value = value;
    }

    constructor(parameters:ShaderMaterialParameters) {
        // @ts-ignore
        super({type: 'LineMaterial',
            uniforms: THREE.UniformsUtils.clone(ShaderLibLineDict.uniforms),
            clipping: true, // required for clipping support,
            vertexColors: true,
                ...parameters
        });

        const self = this;
        function initUniform(name:string, value:any, type?:string){
            if(self.uniforms[name] === undefined) {
                let uval: { [name: string]: any } = {value: value};
                if (type !== undefined) {
                    uval['type'] = type;
                }
                // @ts-ignore
                self.uniforms[name] = uval;
            }
        }

        initUniform('diffuse', new THREE.Color(0,1,0));
        initUniform('opacity', 1);
        initUniform('linewidth', AGLLineMaterial.DEFAULT_LINE_WIDTH);
        // initUniform('dashScale', AGLLineMaterial.DEFAULT_LINE_WIDTH);


        Object.defineProperties(this, {
            // color: {
            //     enumerable: true,
            //     get: function () {
            //         return this.uniforms.diffuse.value;
            //     },
            //     set: function (value) {
            //         this.uniforms.diffuse.value = value;
            //     }
            // },
            worldUnits: {
                enumerable: true,
                get: function () {
                    return 'WORLD_UNITS' in this.defines;
                },
                set: function (value) {
                    if (value === true) {
                        this.defines.WORLD_UNITS = '';
                    } else {
                        delete this.defines.WORLD_UNITS;
                    }
                }
            },
            linewidth: {
                enumerable: true,
                get: function () {
                    return this.uniforms.linewidth.value;
                },
                set: function (value) {
                    this.uniforms.linewidth.value = value;
                }
            },
            dashed: {
                enumerable: true,
                get: function () {
                    return Boolean('USE_DASH' in this.defines);
                },
                set(value) {
                    if (Boolean(value) !== Boolean('USE_DASH' in this.defines)) {
                        this.needsUpdate = true;
                    }
                    if (value === true) {
                        this.defines.USE_DASH = '';
                    } else {
                        delete this.defines.USE_DASH;
                    }
                }
            },
            dashScale: {
                enumerable: true,
                get: function () {
                    return this.uniforms.dashScale.value;
                },
                set: function (value) {
                    this.uniforms.dashScale.value = value;
                }
            },
            dashSize: {
                enumerable: true,
                get: function () {
                    return this.uniforms.dashSize.value;
                },
                set: function (value) {
                    this.uniforms.dashSize.value = value;
                }
            },
            dashOffset: {
                enumerable: true,
                get: function () {
                    return this.uniforms.dashOffset.value;
                },
                set: function (value) {
                    this.uniforms.dashOffset.value = value;
                }
            },
            gapSize: {
                enumerable: true,
                get: function () {
                    return this.uniforms.gapSize.value;
                },
                set: function (value) {
                    this.uniforms.gapSize.value = value;
                }
            },
            opacity: {
                enumerable: true,
                get: function () {
                    return this.uniforms.opacity.value;
                },
                set: function (value) {
                    this.uniforms.opacity.value = value;
                }
            },
            resolution: {
                enumerable: true,
                get: function () {
                    return this.uniforms.resolution.value;
                },
                set: function (value) {
                    this.uniforms.resolution.value.copy(value);
                }
            },
            alphaToCoverage: {
                enumerable: true,
                get: function () {
                    return Boolean('USE_ALPHA_TO_COVERAGE' in this.defines);
                },
                set: function (value) {
                    if (Boolean(value) !== Boolean('USE_ALPHA_TO_COVERAGE' in this.defines)) {
                        this.needsUpdate = true;
                    }
                    if (value === true) {
                        this.defines.USE_ALPHA_TO_COVERAGE = '';
                        this.extensions.derivatives = true;
                    } else {
                        delete this.defines.USE_ALPHA_TO_COVERAGE;
                        this.extensions.derivatives = false;
                    }
                }
            }
        });
        this.setValues(parameters);
    }
}

