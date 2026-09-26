import {APointLightModel3D} from "./APointLightModel3D";
import {ASerializable} from "../../base";

/**
 * A point light that is also drawn as a small sphere, so you can see where it is. Drawn by
 * {@link AVisiblePointLightView3D}.
 */
@ASerializable("AVisiblePointLightModel3D")
export class AVisiblePointLightModel3D extends APointLightModel3D{
    /** Radius of the sphere drawn at the light. A plain field, read once when the view is created. */
    radius:number=0.01;
}
