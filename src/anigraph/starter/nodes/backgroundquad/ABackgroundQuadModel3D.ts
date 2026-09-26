import {
    VertexArray3D
} from "../../../geometry";
import {V2, V3, V4} from "../../../math";
import {AGroupCallbackSwitch, ASerializable} from "../../../base";
import {ACameraModel3D, AMeshModel3D} from "../../../scene";

const CAMERA_MODEL_LISTENER_HANDLE = "CAMERA_MODEL_LISTENER_HANDLE";

/**
 * A textured quad that fills the camera's view, just in front of the far plane, for use as a background image.
 * Whenever the camera's pose or projection changes, the quad's corners are recomputed (by un-projecting the corners
 * of NDC) so it keeps covering the view. Uvs run from (0,0) at the bottom left to (1,1) at the top right.
 */
@ASerializable("ABackgroundQuadModel3D")
export class ABackgroundQuadModel3D extends AMeshModel3D{
    cameraModel!:ACameraModel3D;
    _cameraModelListenerSwitch!:AGroupCallbackSwitch;

    constructor(cameraModel?:ACameraModel3D) {
        let verts = VertexArray3D.CreateForRendering(false, true);
        verts.addVertex(V3(-1,-1,0),undefined, V2(0,0))
        verts.addVertex(V3(1,-1,0),undefined, V2(1,0))
        verts.addVertex(V3(1,1,0),undefined, V2(1,1))
        verts.addVertex(V3(-1,1,0),undefined, V2(0,1))
        verts.addTriangleIndices(0,1,2);
        verts.addTriangleIndices(2,3,0);
        super(verts);
        if(cameraModel){
            this.setCameraModel(cameraModel);
        }
    }

    /** Makes the quad follow `cameraModel` (replacing any previous camera) and updates it right away. */
    setCameraModel(cameraModel:ACameraModel3D){
        this.cameraModel = cameraModel;
        const self = this;
        if(this._cameraModelListenerSwitch){
            this._cameraModelListenerSwitch.deactivate()
        }
        this._cameraModelListenerSwitch = cameraModel.addCameraChangeListener(
            ()=>{
                self.onCameraUpdate();
            },
            CAMERA_MODEL_LISTENER_HANDLE
        )
        this.onCameraUpdate();
    }



    /** Recomputes the quad's vertices from the camera's current projection and view matrices. */
    onCameraUpdate():void{
        let epsilon = 0.1;
        let PVinv = this.cameraModel.camera.PV.getInverse();
        // let zval = 1-epsilon;
        // let zval = -1+epsilon;
        let zval = 1-epsilon;
        let corners = [
            PVinv.times(V4(-1,-1,zval,1)).Point3D,
            PVinv.times(V4(1,-1,zval,1)).Point3D,
            PVinv.times(V4(1,1,zval,1)).Point3D,
            PVinv.times(V4(-1,1,zval, 1)).Point3D,
        ]
        // this.verts.position.updateElements(corners);

        let verts = VertexArray3D.CreateForRendering(false, true);
        verts.addVertex(corners[0], undefined, V2(0,0));
        verts.addVertex(corners[1], undefined, V2(1,0));
        verts.addVertex(corners[2], undefined, V2(1,1));
        verts.addVertex(corners[3], undefined, V2(0,1));
        verts.addTriangleIndices(0,1,2);
        verts.addTriangleIndices(2,3,0);
        this.setVerts(verts);

    }


    /** Creates a background quad that follows `cameraModel`. */
    static CreateForCameraModel(cameraModel:ACameraModel3D, ...args:any[]){
        return new this(cameraModel);
    }
}

