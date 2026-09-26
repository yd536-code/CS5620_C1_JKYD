import {AppSceneController2D} from "../../../anigraph/starter/App2D/AppSceneController2D";
import {AGroupNodeView, AInteractionEvent, Color} from "../../../anigraph";
import {PolygonModel2D, PolygonView2D} from "../../../anigraph/starter/nodes/polygon2D";
import {AttachAndDetachSceneModel} from "./AttachAndDetachSceneModel";
import {MoonModel, OrbitModel} from "./nodes";

/**
 * The scene controller: view specs, a background color, and clicks, which it turns into "this node was picked".
 */
export class AttachAndDetachSceneController extends AppSceneController2D{
    /** The scene model, typed as this scene's class. */
    get model(): AttachAndDetachSceneModel{
        return this._model as AttachAndDetachSceneModel;
    }

    /**
     * Sets the background. Call `super.initScene()` first: it sets the background to white.
     */
    async initScene(){
        await super.initScene();
        this.setClearColor(Color.FromString("#1d2330"));
    }

    /**
     * Pairs each model class with its view. The planet is a plain `PolygonModel2D`.
     */
    initModelViewSpecs(){
        super.initModelViewSpecs();
        this.addModelViewSpec(OrbitModel, AGroupNodeView);
        this.addModelViewSpec(MoonModel, PolygonView2D);
        this.addModelViewSpec(PolygonModel2D, PolygonView2D);
    }

    /**
     * Defines the "Main" interaction mode: a click picks the node under the cursor and hands it to the scene model.
     */
    initInteractions(){
        super.initInteractions();
        this.createNewInteractionMode(
            "Main",
            {
                onClick: (event: AInteractionEvent)=>{
                    this.model.onPick(this.getNodeModelAtCursor(event));
                },
            }
        );
        this.setCurrentInteractionMode("Main");
    }
}
