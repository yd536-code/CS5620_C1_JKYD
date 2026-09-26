import {ANodeModel3D} from "../nodeModel/ANodeModel3D";
import {AObjectState} from "../../base/aobject/AObject";
import {ASerializable} from "../../base/aserial/ASerializable"
import {Color} from "../../math";


/**
 * Base class for 3D light nodes. A light is a node, so its transform places it in the scene; its view
 * ({@link ALightView3D}) wraps a Three.js light.
 */
@ASerializable("ALightModel3D")
export abstract class ALightModel3D extends ANodeModel3D{
    /** The light's intensity. Defaults to 1. */
    @AObjectState intensity:number;
    /**
     * The light's color. Defaults to `#cccccc`. The view follows both a new `Color` assigned here and edits made
     * inside the current one (e.g. `light.color.r = 1`).
     */
    @AObjectState color:Color;
    /**
     * @param color The light's color. Defaults to `#cccccc`.
     * @param intensity The light's intensity. Defaults to 1.
     */
    constructor(color?:Color, intensity?:number) {
        super();
        this.color = color??Color.FromString("#cccccc");
        this.intensity = intensity??1;
    }

    /** Returns a control spec with an `intensity` slider (0 to 50). */
    getModelGUIControlSpec() {
        let self = this;
        return {
            intensity: {
                value: self.intensity,
                onChange: (v: any) => {
                    self.intensity = v;
                },
                min: 0,
                max: 50,
                step: 0.1
            },
        }
    }

}


