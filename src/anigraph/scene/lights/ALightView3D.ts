import * as THREE from "three";
import {AGLNodeView} from "../nodeView/AGLNodeView";
import {ALightModel3D} from "./ALightModel3D";

/**
 * Base view for {@link ALightModel3D}. Subclasses create the Three.js light (`_light`) in `init()` and add it to the
 * view's Three.js object, so the light follows the node's transform.
 */
export abstract class ALightView3D extends AGLNodeView{
    /** The Three.js light, created by the subclass's `init()`. */
    _light!:THREE.Light;
    /** The Three.js light (see `_light`). */
    get light():THREE.Light{
        return this._light;
    }
    get model():ALightModel3D{
        return this._model as ALightModel3D;
    }

    /**
     * Applies the model's intensity, color, and transform. `update()` runs on any change to the model's state,
     * including an in-place edit of its `Color` (e.g. `model.color.r = 1`), so this is what keeps the color current.
     */
    update() {
        this.light.intensity = this.model.intensity;
        this.light.color = this.model.color.asThreeJS();
        this.setTransform(this.model.transform);
    }

    /**
     * Adds listeners that update the light right away when the model's `intensity` or `color` is reassigned. (Edits
     * made inside the current `Color` are handled by `update()`.)
     */
    setModelListeners() {
        super.setModelListeners();
        const self = this;
        this.subscribe(this.model.addStateKeyListener("intensity", ()=>{
            self.light.intensity = self.model.intensity;
        }), "LIGHT_INTENSITY");
        this.subscribe(this.model.addStateKeyListener("color", ()=>{
            self.light.color = self.model.color.asThreeJS();
        }), "LIGHT_COLOR");
    }
}
