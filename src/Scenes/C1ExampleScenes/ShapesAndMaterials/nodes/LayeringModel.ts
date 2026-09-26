import {
    AGroupNodeModel2D,
    AppState,
    ASerializable,
    AssetManager,
    ASVGLModel2D,
    Color,
    GetAppState,
    Polygon2D,
    SVGLAsset,
    V2
} from "../../../../anigraph";
import {PolygonModel2D} from "../../../../anigraph/starter/nodes/polygon2D";

/**
 * # SVG graphics, draw order and visibility
 *
 * A group of two children: a square drawn with a single flat color (the "basic" material), and vector Lab Cat drawn
 * from an SVG file, overlapping the square.
 * - **Draw order:** each node has a `zValue`. Nodes with a higher `zValue` are drawn on top. The **LabCatDepth**
 *   slider moves Lab Cat in front of the square (positive) or behind it (negative).
 * - **Visibility:** the **ShowLabCat** checkbox sets Lab Cat's `visible`. A hidden node isn't drawn but stays in the
 *   scene, so showing it again is instant. Hiding and showing is usually better than deleting and re-creating nodes.
 *
 * Both controls are handled by subscribing to them, since they only need to do something when they change.
 */
@ASerializable("LayeringModel")
export class LayeringModel extends AGroupNodeModel2D{
    /** Names of this node's control-panel entries. */
    static ControlKeys = {
        LabCatDepth: "LabCatDepth",
        ShowLabCat: "ShowLabCat",
    }

    /** The Lab Cat vector graphic, loaded once by `PreloadAssets`. */
    static LabCatSVG: SVGLAsset;

    /** The flat-colored square behind (or in front of) Lab Cat. */
    backdrop: PolygonModel2D;

    /** Vector Lab Cat. */
    labCat: ASVGLModel2D;

    /**
     * Adds this node's controls.
     * @param appState
     */
    static SetAppState(appState: AppState){
        appState.addSliderIfMissing(LayeringModel.ControlKeys.LabCatDepth, 0.1, -0.5, 0.5, 0.01);
        appState.addCheckboxControl(LayeringModel.ControlKeys.ShowLabCat, true);
    }

    /**
     * Loads the SVG file.
     */
    static async PreloadAssets(){
        LayeringModel.LabCatSVG = await SVGLAsset.Load("./images/svg/LabCatVectorHead.svg");
    }

    /**
     * Creates the two children and adds them to this group. Call `PreloadAssets()` first.
     */
    constructor(){
        super();

        // A square with a single flat color. CreateBasicMaterial(color) colors the whole shape one color, so the
        // square's vertices don't need colors of their own.
        this.backdrop = new PolygonModel2D(Polygon2D.Square(1.2));
        this.backdrop.setMaterial(AssetManager.CreateBasicMaterial(Color.FromString("#ffcc33")));
        this.backdrop.prsa.position = V2(-0.6, 0.4);
        this.backdrop.zValue = 0;

        // Lab Cat, drawn from the SVG file.
        this.labCat = new ASVGLModel2D(LayeringModel.LabCatSVG);
        this.labCat.prsa.position = V2(0.5, -0.5);
        this.labCat.prsa.scale = V2(2.5, 2.5);

        this.addChild(this.backdrop);
        this.addChild(this.labCat);

        this.applyControls();
        this.subscribeToAppState(LayeringModel.ControlKeys.LabCatDepth, ()=>this.applyControls());
        this.subscribeToAppState(LayeringModel.ControlKeys.ShowLabCat, ()=>this.applyControls());
    }

    /**
     * Sets Lab Cat's depth and visibility from the controls.
     */
    applyControls(){
        const appState = GetAppState();
        // zValue is part of the node's transform, so setting it redraws Lab Cat's view.
        this.labCat.zValue = appState.getState(LayeringModel.ControlKeys.LabCatDepth);
        this.labCat.visible = appState.getState(LayeringModel.ControlKeys.ShowLabCat);
    }
}
