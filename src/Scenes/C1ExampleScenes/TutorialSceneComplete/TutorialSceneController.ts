import {ASceneController2D} from "../../../anigraph/starter/Scene2D/ASceneController2D";
import {
    ADragInteraction,
    AGroupNodeView,
    AInteractionEvent,
    AKeyboardInteraction,
    AMeshModel2D,
    AMeshView2D,
    AssetManager,
    ASVGLModel2D,
    ASVGLView,
    Color,
    GetAppState
} from "../../../anigraph";
import {PolygonModel2D, PolygonView2D} from "../../../anigraph/starter/nodes/polygon2D";
import {TutorialSceneModel} from "./TutorialSceneModel";
import {
    TutDotsModel,
    TutDotsView,
    TutFlipbookModel,
    TutGroupModel,
    TutLineModel,
    TutLineView,
    TutMovableModel,
    TutNoiseModel,
    TutParticleSystemModel,
    TutParticleSystemView,
    TutPivotModel,
    TutShapeModel
} from "./nodes";

/**
 * The tutorial scene's controller, with every step of the C1 tutorial done. It sets the background, says which view
 * draws each model class, and defines two interaction modes that turn input into calls on the scene model. It never
 * decides what input means; the models do. The frame loop comes from {@link ASceneController2D}.
 */
export class TutorialSceneController extends ASceneController2D{
    /** The names of this scene's interaction modes. */
    static Modes = {
        Main: "Main",
        Drag: "Drag",
    }

    /** The scene model, typed as this scene's class. */
    get model(): TutorialSceneModel{
        return this._model as TutorialSceneModel;
    }

    /**
     * Sets the background (step 6.1), after `super.initScene()`, which sets it to white. The Background dropdown
     * belongs to the scene model; the controller applies it, since the background is a rendering setting.
     */
    async initScene(){
        await super.initScene();
        this.applyBackground();
        this.subscribe(
            GetAppState().addStateValueListener(TutorialSceneModel.ControlKeys.Background, ()=>this.applyBackground()),
            "BackgroundSubscription"
        );
    }

    /** Step 6.1: shows the background image or a plain color, depending on the dropdown. */
    applyBackground(){
        const choice = GetAppState().getState(TutorialSceneModel.ControlKeys.Background);
        if(choice === TutorialSceneModel.BackgroundOptions.Image){
            this.view.setBackgroundTexture(AssetManager.getTexture(TutorialSceneModel.BackgroundTextureName));
        }else{
            this.getThreeJSScene().background = null;   // remove the image, so the clear color shows
            this.setClearColor(Color.FromString("#f4f1ea"));
        }
    }

    /**
     * Pairs each model class with the view class that draws it. A spec doesn't apply to a subclass that has its own
     * `@ASerializable` label, so every labeled class gets its own line, even a subclass of one that has a line.
     */
    initModelViewSpecs(){
        super.initModelViewSpecs();   // keeps specs a parent class adds; camera and group-node specs are built in
        this.addModelViewSpec(TutShapeModel, PolygonView2D);          // step 1.2
        this.addModelViewSpec(TutGroupModel, AGroupNodeView);         // step 2.2
        this.addModelViewSpec(PolygonModel2D, PolygonView2D);         // step 2.2 (the plain squares)
        this.addModelViewSpec(TutPivotModel, PolygonView2D);          // step 4.1
        this.addModelViewSpec(AMeshModel2D, AMeshView2D);             // step 6.2 (and the textured quad, 6.4)
        this.addModelViewSpec(TutFlipbookModel, AMeshView2D);         // step 6.5
        this.addModelViewSpec(ASVGLModel2D, ASVGLView);               // step 6.6
        this.addModelViewSpec(TutLineModel, TutLineView);             // step 6.7
        this.addModelViewSpec(TutDotsModel, TutDotsView);             // step 6.8
        this.addModelViewSpec(TutMovableModel, PolygonView2D);        // step 8.1
        this.addModelViewSpec(TutNoiseModel, PolygonView2D);          // step 10.1
        this.addModelViewSpec(TutParticleSystemModel, TutParticleSystemView);  // step 11.1
    }

    /**
     * Defines the "Main" (step 8.1) and "Drag" (step 8.4) interaction modes, and makes Main current. Making a mode
     * current replaces Pan/Zoom, which `super.initInteractions()` registers; all three stay in the control panel's
     * interaction-mode menu (step 8.5).
     */
    initInteractions(){
        super.initInteractions();
        this.createNewInteractionMode(
            TutorialSceneController.Modes.Main,
            {
                onKeyDown: (event: AInteractionEvent, interaction: AKeyboardInteraction)=>{
                    this.model.onKeyDown(event.key);
                },
                onKeyUp: (event: AInteractionEvent, interaction: AKeyboardInteraction)=>{
                    this.model.onKeyUp(event.key);
                },
                onClick: (event: AInteractionEvent)=>{
                    // Clicking gives the canvas keyboard focus. Without focus, key presses never arrive.
                    this.eventTarget.focus();
                    // Step 8.3: the frontmost node model under the cursor, or undefined if the click hit nothing.
                    this.model.onPick(this.getNodeModelAtCursor(event));
                },
            }
        );
        this.createNewInteractionMode(
            TutorialSceneController.Modes.Drag,
            {
                onDragStart: (event: AInteractionEvent, interaction: ADragInteraction)=>{
                    this.model.onDragStart(this.getNodeModelAtCursor(event));
                },
                onDragMove: (event: AInteractionEvent, interaction: ADragInteraction)=>{
                    // World coordinates of the cursor. This accounts for the camera's pan and zoom.
                    const cursor = this.getWorldCoordinatesOfCursorEvent(event);
                    if(cursor){
                        this.model.onDrag(cursor);
                    }
                },
                onDragEnd: (event: AInteractionEvent, interaction: ADragInteraction)=>{
                    this.model.onDragEnd();
                },
            }
        );
        this.setCurrentInteractionMode(TutorialSceneController.Modes.Main);
    }
}
