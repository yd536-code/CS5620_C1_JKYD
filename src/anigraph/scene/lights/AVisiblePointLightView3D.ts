import {APointLightView3D} from "./APointLightView3D";
import ASphereGraphic3D from "../../rendering/graphicelements/ASphereGraphic3D";
import {AVisiblePointLightModel3D} from "./AVisiblePointLightModel3D";

/** View for {@link AVisiblePointLightModel3D}: a point light plus a sphere in the light's color. */
export class AVisiblePointLightView3D extends APointLightView3D{

    get model():AVisiblePointLightModel3D{
        return this._model as AVisiblePointLightModel3D;
    }

    /** Creates the point light and a sphere of the model's `radius` and `color`. */
    init() {
        super.init();
        let sphere = new ASphereGraphic3D(this.model.radius,this.model.color)
        this.registerAndAddGraphic(sphere);
        this.setTransform(this.model.transform);
    }
}
