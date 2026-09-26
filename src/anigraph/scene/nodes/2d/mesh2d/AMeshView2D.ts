import {AMeshView} from "../../../nodeView/AMeshView";
import {AMeshModel2D} from "./AMeshModel2D";

/**
 * View for `AMeshModel2D`. Sends vertices to the graphic only when the geometry changes (see `AMeshView`).
 */
export class AMeshView2D extends AMeshView<AMeshModel2D>{
    protected get pushesVertsOnUpdate():boolean{
        return false;
    }
}
