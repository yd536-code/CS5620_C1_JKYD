import {AMeshView} from "../../../scene/nodeView/AMeshView";
import {RGBATestMeshModel3D} from "./RGBATestMeshModel3D";

/**
 * View for `RGBATestMeshModel3D`. Re-sends the vertices on every update (see `AMeshView`).
 */
export class RGBATestMeshView extends AMeshView<RGBATestMeshModel3D>{
    protected get pushesVertsOnUpdate():boolean{
        return true;
    }
}
