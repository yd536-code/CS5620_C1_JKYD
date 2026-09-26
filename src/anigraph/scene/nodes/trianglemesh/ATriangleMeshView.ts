import {AMeshView} from "../../nodeView/AMeshView";
import {AMeshModel3D} from "./AMeshModel3D";

/**
 * View for `AMeshModel3D`. Re-sends the vertices on every update (see `AMeshView`).
 */
export class ATriangleMeshView extends AMeshView<AMeshModel3D>{
    protected get pushesVertsOnUpdate():boolean{
        return true;
    }
}
