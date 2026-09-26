import {ANodeModel3D} from "../../../scene";
import {AObjectState, ASerializable} from "../../../base";
import {ALineMaterialModel} from "../../../rendering";
import {AssetManager} from "../../../fileio";


/**
 * Red, green, and blue x, y, and z axes, useful for seeing where the origin is and which way the axes point. Drawn by
 * {@link CoordinateAxesView3D} (registered by default in {@link ASceneController3D}).
 */
@ASerializable("CoordinateAxesModel3D")
export class CoordinateAxesModel3D extends ANodeModel3D{
    /** Length of each axis, in world units. */
    @AObjectState axesScale:number;
    /** Width of the axis lines. */
    @AObjectState lineWidth!:number;

    /** @param scale length of each axis. Defaults to 1. */
    constructor(scale:number=1,...args:any[]) {
        super();
        this.lineWidth = 0.002;
        this.axesScale = scale;
        this.setMaterial(AssetManager.CreateShaderMaterial(AssetManager.DEFAULT_MATERIALS.LineMaterial));
    }

    /** Creates a new line material from the global line material model. */
    getStrokeMaterial() {
        return ALineMaterialModel.GlobalInstance.CreateMaterial();
    }

}


