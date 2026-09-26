import {AppSceneController2D} from "../../../anigraph/starter/App2D/AppSceneController2D";
import {ADragInteraction, AInteractionEvent, Color} from "../../../anigraph";
import {CopiesViewSceneModel} from "./CopiesViewSceneModel";
import {RowOfCopiesModel, RowOfCopiesView} from "./nodes";

/**
 * The scene controller. It pairs the model with its view and passes drags on to the scene model, in world
 * coordinates. The frame loop comes from {@link AppSceneController2D}, which calls the scene model's `timeUpdate(t)`
 * every frame.
 */
export class CopiesViewSceneController extends AppSceneController2D{
    /** The scene model, typed as this scene's class. */
    get model(): CopiesViewSceneModel{
        return this._model as CopiesViewSceneModel;
    }

    /**
     * Sets the background. Call `super.initScene()` first: it sets the background to white.
     */
    async initScene(){
        await super.initScene();
        this.setClearColor(Color.FromString("#f4f1ea"));
    }

    /**
     * Pairs each model class with the view class that draws it.
     */
    initModelViewSpecs(){
        super.initModelViewSpecs();   // keeps the built-in specs (camera, group nodes)
        this.addModelViewSpec(RowOfCopiesModel, RowOfCopiesView);
    }

    /**
     * Defines the "Main" interaction mode, which forwards drags to the scene model, and makes it the current one.
     * The default pan/zoom mode stays available in the control panel's interaction-mode menu.
     */
    initInteractions(){
        super.initInteractions();
        this.createNewInteractionMode(
            "Main",
            {
                onDragStart: (event: AInteractionEvent, interaction: ADragInteraction)=>{
                    // World coordinates of the cursor. This accounts for the camera's pan and zoom.
                    const cursor = this.getWorldCoordinatesOfCursorEvent(event);
                    if(cursor){
                        this.model.onDragStart(cursor);
                    }
                },
                onDragMove: (event: AInteractionEvent, interaction: ADragInteraction)=>{
                    const cursor = this.getWorldCoordinatesOfCursorEvent(event);
                    if(cursor){
                        this.model.onDrag(cursor);
                    }
                },
            }
        );
        this.setCurrentInteractionMode("Main");
    }
}
