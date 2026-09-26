/** Name of the shader uniform that holds the texture `name` (e.g. `"diffuse"` -> `"diffuseMap"`). */
export function TextureKeyForName(name: string) {
    return name + "Map";
}
/** Name of the boolean shader uniform that says whether texture `name` is set (e.g. `"diffuseMapProvided"`). */
export function TextureProvidedKeyForName(name: string) {
    return name + "MapProvided";
}
/** Name of the shader uniform that holds texture `name`'s size in pixels (e.g. `"diffuseSize"`). */
export function TextureSizeKeyForName(name: string) {
    return name + "Size";
}

/** Turns on extra debug logging in some engine code (e.g. the SVG loader). */
export const ANIGRAPH_DEBUG_MODE = false;

/** Engine-wide default values. */
export enum AniGraphDefines {
    /** Default for `AAppState.globalScale`. */
    DefaultGlobalScale = 10.0,
    /** Default near clipping plane distance for camera projections. */
    DefaultZNear = 0.001,
    /** Default far clipping plane distance for camera projections. */
    DefaultZFar = 50,
    /** Near clipping plane used for some orthographic projections (e.g. by `ACameraElement`). */
    DefaultOrthoZNear= -5,
    /** Far clipping plane used for some orthographic projections (e.g. by `ACameraElement`). */
    DefaultOrthoZFar = 5,
}

/** Default Blinn-Phong material values, used by the diffuse and Blinn-Phong shader models for initial uniform and slider values. */
export enum BlinnPhongDefaults{
    Ambient=0.02,
    Diffuse = 0.3,
    Specular=0.01,
    SpecularExp=5.0
}
