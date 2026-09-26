import {ALightModel3D} from "./ALightModel3D";
import {AObjectState, ASerializable} from "../../base";
import {Color} from "../../math";

import type {TransformationInterface} from "../../math";
import {GetAppState} from "../../appstate";

/**
 * A point light: light that shines in all directions from the node's position. Drawn by {@link APointLightView3D}.
 * `distance` and `decay` mean the same as for a Three.js `PointLight`
 * (https://threejs.org/docs/#api/en/lights/PointLight).
 */
@ASerializable("APointLightModel3D")
export class APointLightModel3D extends ALightModel3D{

    /**
     * The range of the light: the distance at which its intensity reaches 0 (0 means no limit).
     */
    @AObjectState distance!:number;
    /**
     * How fast the light dims with distance.
     */
    @AObjectState decay!:number;

    /**
     * @param transform The light's transform, applied with `setTransform` (so a `Mat4` is decomposed into the
     * node's `NodeTransform3D` when possible). Defaults to identity.
     * @param color Defaults to `#cccccc`.
     * @param intensity Defaults to 1.
     * @param distance Defaults to 5 times the app state's `globalScale`.
     * @param decay Defaults to 1.
     */
    constructor(transform?:TransformationInterface, color?:Color, intensity?:number, distance?:number, decay?:number) {
        let appState = GetAppState();
        super(color, intensity);
        if(transform) {
            this.setTransform(transform);
        }
        this.distance = distance??appState.globalScale*5;
        this.decay = decay??1;
        // this.decay = decay??2;
    }


}

