import {ASceneController2D} from "../../../anigraph/starter/Scene2D/ASceneController2D";
import {
    AGroupNodeView,
    AMeshModel2D,
    AMeshView,
    AMeshView2D,
    AssetManager, ASVGLModel2D, ASVGLView,
    Color,
    GetAppState
} from "../../../anigraph";
import {PolygonModel2D, PolygonView2D} from "../../../anigraph/starter/nodes/polygon2D";
import {TutorialSceneModel} from "./TutorialSceneModel";
import {TutShapeModel, TutGroupModel, TutPivotModel, TutFactories, TutLineModel, TutLineView} from "./nodes";

/**
 * The tutorial scene's controller. It says which view class draws each kind of node model, turns user input into
 * calls on the scene model, and runs the frame loop. The frame loop comes from {@link ASceneController2D}: every
 * frame it calls the scene model's `timeUpdate(t)`, then renders, so there's no frame-loop code here.
 */
export class TutorialSceneController extends ASceneController2D{
    /** The scene model, typed as this scene's class. */
    get model(): TutorialSceneModel{
        return this._model as TutorialSceneModel;
    }

    /**
     * Sets the background. Call `super.initScene()` first: it sets the background to white, which would overwrite a
     * color set before it. Step 6.1 of the tutorial adds an image background.
     */
    async initScene(){
        await super.initScene();
        this.setClearColor(Color.FromString("#f4f1ea"));    // initialized background color
        this.subscribe(GetAppState().addStateValueListener("Background", ()=>this.applyBackground()),
            "BackgroundSubscription");
    }
    applyBackground() {
        if (GetAppState().getState("Background") === TutorialSceneModel.BackgroundOptions.Image) {
            this.view.setBackgroundTexture(AssetManager.getTexture(
                TutorialSceneModel.BackgroundTextureName));
        } else {
            this.getThreeJSScene().background = null;
            this.setClearColor(Color.FromString("#f4f1ea"));
        }
    }

    /**
     * Pairs each model class with the view class that draws it (`this.addModelViewSpec(ModelClass, ViewClass)`).
     * Step 1.2 of the tutorial adds the first spec here.
     */
    initModelViewSpecs(){
        super.initModelViewSpecs();   // keeps specs a parent class adds; camera and group-node specs are built in
        this.addModelViewSpec(TutShapeModel, PolygonView2D);
        this.addModelViewSpec(TutGroupModel, AGroupNodeView);
        this.addModelViewSpec(PolygonModel2D, PolygonView2D);  // plain squares
        this.addModelViewSpec(TutPivotModel, PolygonView2D);   // pivot square
        this.addModelViewSpec(AMeshModel2D, AMeshView2D);
        this.addModelViewSpec(ASVGLModel2D, ASVGLView);
        this.addModelViewSpec(TutLineModel, TutLineView)
    }

    /**
     * Defines interaction modes: named sets of input handlers. `super.initInteractions()` registers the default
     * Pan/Zoom mode (drag to pan, scroll to zoom), which is the current mode until step 8.1 of the tutorial adds one.
     */
    initInteractions(){
        super.initInteractions();
    }
}
