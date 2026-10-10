import {
    AGroupNodeModel2D,
    ASerializable,
    AssetManager,
    ASVGLModel2D,
    GetAppState,
    SVGLAsset,
    V2
} from "../../../anigraph";

/**
 * # SVG graphics of LabCat
 */
@ASerializable("LabCat")
export class LabCat extends AGroupNodeModel2D{
    static ControlKeys = {
        LabCatDepth: "LabCatDepth",
        ShowLabCat: "ShowLabCat",
    }

    static LabCatSVG: SVGLAsset; // The Lab Cat vector graphic, loaded once by `PreloadAssets`
    labCat: ASVGLModel2D;   //Vector Lab Cat

    static async PreloadAssets(){
        LabCat.LabCatSVG = await SVGLAsset.Load("./images/svg/LabCatVectorHead.svg");
    }

    constructor(){
        super();
        // Lab Cat, drawn from the SVG file.
        this.labCat = new ASVGLModel2D(LabCat.LabCatSVG);
        this.labCat.prsa.position = V2(0, 0);
        this.labCat.prsa.scale = 5;
        this.labCat.zValue = -0.5;
        this.labCat.visible = true;

        this.addChild(this.labCat);
    }

    applyControls(){
        const appState = GetAppState();
        // zValue is part of the node's transform, so setting it redraws Lab Cat's view.
        this.labCat.zValue = appState.getState(LabCat.ControlKeys.LabCatDepth);
        this.labCat.visible = appState.getState(LabCat.ControlKeys.ShowLabCat);
    }
}
