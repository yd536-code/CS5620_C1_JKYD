/**
 * Names of the built-in material models (also available as `AssetManager.DEFAULT_MATERIALS`). The first few name
 * Three.js material types; the `*_SHADER`, `SIMPLE`, and `BLINNPHONG` values are shader names under
 * `public/shaders/`. Only `Basic`, `Standard`, `LineBasicMaterial`, and `LineMaterial` are registered automatically
 * by `AMaterialManager`; shader-based ones must be loaded first (e.g. with `AssetManager.loadShaderMaterialModel`).
 */
export enum DefaultMaterials{
    Basic="MeshBasicMaterial",
    Standard="MeshStandardMaterial",
    Normal="MeshNormalMaterial",
    Depth="MeshDepthMaterial",
    Phong="MeshPhongMaterial",
    LineBasicMaterial="LineBasicMaterial",
    LineMaterial="LineMaterial",
    RGBA_SHADER="rgba",
    TEXTURED_SHADER="textured",
    TEXTURED2D_SHADER="textured2D",
    INSTANCED_TEXTURE2D_SHADER="instancedTexture2D",
    PARTICLE_TEXTURE_2D_SHADER="particleTexture2D",
    LINE_SHADER="line",
    SIMPLE="simple",
    BLINNPHONG="blinnphong"
}
