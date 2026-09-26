import {SeededRandom, Vec2, Vec3} from "../../../math";
import {ANodeModel3D} from "../../../scene";
import {AObjectState, ASerializable} from "../../../base";
import type {TransformationInterface} from "../../../math";
import {AShaderMaterial, AShaderModel, CreatesShaderModels} from "../../../rendering";
import {PlaneGeometryParameters} from "../../../rendering/graphicelements/APlaneGraphic3D";
import {ATerrainShaderModel} from "../../../rendering/shadermodels/ATerrainShaderModel";
import {ATexture} from "../../../rendering/ATexture";
import {ADataTextureFloat1D} from "../../../rendering/image";


/**
 * Base class for a terrain: a subdivided plane of `width` x `height` world units with `widthSegments` x
 * `heightSegments` quads, drawn by {@link ATerrainView3D}. Subclasses set the textures and implement
 * `getTerrainHeightAtPoint`. Call `await ATerrainModel3D.LoadShader()` (e.g. in `PreloadAssets`) to load the terrain
 * shader.
 */
@ASerializable("ATerrainModel3D")
export abstract class ATerrainModel3D extends ANodeModel3D implements PlaneGeometryParameters{
    /** The shared terrain shader model, set by `LoadShader`. */
    static ShaderModel:ATerrainShaderModel;

    /** Loads the "terrain" shader into `ShaderModel`. */
    static async LoadShader(...args:any[]){
        this.ShaderModel = await ATerrainShaderModel.CreateModel("terrain")
    }

    width:number=1;
    height:number=1;
    widthSegments:number=128;
    heightSegments:number=128;
    /** Color texture for the terrain surface. */
    diffuseMap!:ATexture;
    /** Height values stored in a one-channel float texture. */
    heightMap!:ADataTextureFloat1D;

    get material():AShaderMaterial{
        return this._material as AShaderMaterial;
    }



    constructor(
        width?:number,
        height?:number,
        widthSegments?:number,
        heightSegments?:number,
        transform?:TransformationInterface) {
        super();
        if(width!==undefined){this.width=width};
        if(height!==undefined){this.height=height;}
        if(widthSegments!==undefined){this.widthSegments=widthSegments;}
        if(heightSegments!==undefined){this.heightSegments=heightSegments;}
        if(transform){
            this.setTransform(transform);
        }
    }

    /** Returns the terrain height at the point `xy` (e.g. to keep a character on the ground). */
    abstract getTerrainHeightAtPoint(xy:Vec2):number;
}






