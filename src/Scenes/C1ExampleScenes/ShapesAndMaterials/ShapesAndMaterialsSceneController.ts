import {AppSceneController2D} from "../../../anigraph/starter/App2D/AppSceneController2D";
import {
    A2DMeshView,
    AGroupNodeView,
    AInteractionEvent,
    AMeshModel2D,
    AssetManager,
    ASVGLModel2D,
    ASVGLView,
    Color,
    GetAppState
} from "../../../anigraph";
import {PolygonModel2D, PolygonView2D} from "../../../anigraph/starter/nodes/polygon2D";
import {ShapesAndMaterialsSceneModel} from "./ShapesAndMaterialsSceneModel";
import {
    ExhibitModel,
    FlipbookModel,
    LayeringModel,
    MarkedShapeModel,
    MarkedShapeView,
    WaveLineModel,
    WaveLineView
} from "./nodes";

/**
 * The scene controller. It pairs every model class with its view, turns clicks into "this node was picked", and sets
 * the background. The background is a rendering setting, so it is one of the few things a controller decides itself.
 */
export class ShapesAndMaterialsSceneController extends AppSceneController2D{
    /** The scene model, typed as this scene's class. */
    get model(): ShapesAndMaterialsSceneModel{
        return this._model as ShapesAndMaterialsSceneModel;
    }

    /**
     * Sets the background from the Background dropdown now, and again whenever it changes. Call
     * `super.initScene()` first: it sets the background to white.
     */
    async initScene(){
        await super.initScene();
        this.applyBackground();
        this.subscribe(
            GetAppState().addStateValueListener(ShapesAndMaterialsSceneModel.ControlKeys.Background, ()=>{
                this.applyBackground();
            }),
            "BackgroundSubscription"
        );
    }

    /**
     * Shows either a plain color or the space image behind the scene, according to the Background dropdown.
     */
    applyBackground(){
        const choice = GetAppState().getState(ShapesAndMaterialsSceneModel.ControlKeys.Background);
        if(choice === ShapesAndMaterialsSceneModel.BackgroundOptions.Space){
            // An image background. The texture was loaded by the scene model's PreloadAssets.
            this.view.setBackgroundTexture(AssetManager.getTexture(ShapesAndMaterialsSceneModel.SpaceTextureName));
        }else{
            // Remove any image, so the clear color shows.
            this.getThreeJSScene().background = null;
            this.setClearColor(Color.FromString("#3b3f4c"));
        }
    }

    /**
     * Pairs each model class with the view that draws it. Specs match the model's exact class, so every class that
     * appears in the scene is listed, including the plain engine classes.
     */
    initModelViewSpecs(){
        super.initModelViewSpecs();
        this.addModelViewSpec(ExhibitModel, AGroupNodeView);
        this.addModelViewSpec(LayeringModel, AGroupNodeView);
        this.addModelViewSpec(PolygonModel2D, PolygonView2D);
        this.addModelViewSpec(AMeshModel2D, A2DMeshView);
        this.addModelViewSpec(FlipbookModel, A2DMeshView);
        this.addModelViewSpec(ASVGLModel2D, ASVGLView);
        this.addModelViewSpec(WaveLineModel, WaveLineView);
        this.addModelViewSpec(MarkedShapeModel, MarkedShapeView);
    }

    /**
     * Defines the "Main" interaction mode: a click picks the node under the cursor and hands it to the scene model.
     * The default pan/zoom mode stays available in the control panel's interaction-mode menu.
     */
    initInteractions(){
        super.initInteractions();
        this.createNewInteractionMode(
            "Main",
            {
                onClick: (event: AInteractionEvent)=>{
                    this.eventTarget.focus();
                    // The frontmost node model under the cursor, or undefined if the click hit nothing.
                    this.model.onPick(this.getNodeModelAtCursor(event));
                },
            }
        );
        this.setCurrentInteractionMode("Main");
    }
}
