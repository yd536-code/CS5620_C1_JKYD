import {ANodeModel, AGLNodeView} from "../../../scene";
import {ThreeJSObjectFromParsedSVGL} from "../SvgLToThreeJsObject";
import {ATriangleMeshGraphic} from "../../../rendering";
import {ASVGLModel3D} from "./ASVGLModel3D";
import {ASVGLGraphic} from "./ASVGLGraphic";
import {Object3D} from "three";
import * as THREE from "three";

/**
 * View for {@link ASVGLModel3D}. Displays the model's SVG asset with an {@link ASVGLGraphic}.
 */
export class ASVGLView extends AGLNodeView{
    protected _model!:ASVGLModel3D;
    /** The graphic that displays the model's SVG asset. */
    svgGraphic!:ASVGLGraphic;
    get model():ASVGLModel3D{
        return this._model;
    }


    /** Creates a view for `model`. */
    static Create(model:ASVGLModel3D){
        let view = new this();
        view.setModel(model);
        return view;
    }

    /** Creates the {@link ASVGLGraphic} from the model's asset and adds it to the view. */
    init(){
        this.svgGraphic = ASVGLGraphic.Create(this.model.svgAsset);
        this.registerAndAddGraphic(this.svgGraphic);
        this.svgGraphic.visible = this.model.visible;
    }

    /** Copies the model's transform to the view. Also runs on transform updates (via `onTransformUpdate`). */
    update(): void {
        this.setTransform(this.model.transform);
        // this.svgGraphic.setTransform(this.model.transform); // This was for A2 behavior only
    }
}
