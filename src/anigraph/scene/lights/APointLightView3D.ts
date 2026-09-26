import {ALightView3D} from "./ALightView3D";
import * as THREE from "three";
import {APointLightModel3D} from "./APointLightModel3D";


/** View for {@link APointLightModel3D}: wraps a `THREE.PointLight`. */
export class APointLightView3D extends ALightView3D{

    get light():THREE.PointLight{
        return this._light as THREE.PointLight;
    }

    get model():APointLightModel3D{
        return this._model as APointLightModel3D;
    }

    setModelListeners() {
        super.setModelListeners();
    }

    /** Creates the `THREE.PointLight` from the model's values and adds it to the view's Three.js object. */
    init(): void {
        this._light = new THREE.PointLight(this.model.color.asThreeJS(), this.model.intensity, this.model.distance, this.model.decay);
        this.threejs.add(this.light);
    }

    /** Applies intensity and transform (see `ALightView3D.update`), then `decay` and `distance`. */
    update(...args: any[]): void {
        super.update();
        this.light.decay = this.model.decay;
        this.light.distance = this.model.distance;
    }

}
