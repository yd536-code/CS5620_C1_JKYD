import * as THREE from "three";
import {ALabel} from "../../base";
import {AMaterialModelBase} from "./AMaterialModel";
import {Color} from "../../math";
import {AMaterial} from "./AMaterial";
import {DefaultMaterials} from "./MaterialConstants";
import {LineMaterialParameters} from "./threeMaterials";
import {LineMaterial} from "three/examples/jsm/lines/LineMaterial";

/**
 * Built-in model for wide, screen-space lines, registered as `DefaultMaterials.LineMaterial`. Builds Three.js's
 * `LineMaterial` (from `three/examples/jsm/lines`), with per-vertex colors and a default `linewidth` of 0.005.
 *
 * It uses Three.js's `LineMaterial` rather than AniGraph's `AGLLineMaterial` because `LineMaterial` works as
 * soon as it is created, while `AGLLineMaterial` needs the `line` shader files to finish loading first.
 * `CreateMaterial` returns a plain {@link AMaterial}, so the control-panel params use `getValue`/`setValue`.
 */
@ALabel("ALineMaterialModel")
export class  ALineMaterialModel extends AMaterialModelBase<LineMaterialParameters>{
    /** A shared instance, created when this module loads. */
    static GlobalInstance:ALineMaterialModel;
    constructor() {
        super(
            DefaultMaterials.LineMaterial,
            LineMaterial,
            {},
            {
                // color: undefined,
                transparent: true,
                opacity: 1,
                side: THREE.DoubleSide,
                depthWrite: true,
                depthTest:true,
                linewidth: 0.005,
                vertexColors:true
            });
    }


    /** The shared `color` parameter. Setting it only affects materials created afterward. */
    get color(){
        return Color.FromThreeJS(this.sharedParameters['color']);
    }
    set color(c:Color){
        this.sharedParameters['color'] = c.asThreeJS();
    }
    /**
     * Returns opacity and line-width sliders for `material`. Both edit the material's parameters with
     * `setValue` (`LineMaterial.linewidth` updates its shader uniform for you).
     */
    getMaterialGUIParams(material:AMaterial){
        return {
            ...AMaterialModelBase.MaterialGUIControl(material, 'opacity', 1, {
                min:0,
                max:1,
                step:0.01
            }),
            ...AMaterialModelBase.MaterialGUIControl(material, 'linewidth', 1.0, {
                min:0,
                max:5,
                step:0.01
            })
        }
    }
}

ALineMaterialModel.GlobalInstance = new ALineMaterialModel();
