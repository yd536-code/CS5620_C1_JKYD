import {AppSceneController2D} from "../../../anigraph/starter/App2D/AppSceneController2D";
import {ADragInteraction, AInteractionEvent, Color} from "../../../anigraph";
import {PolygonView2D} from "../../../anigraph/starter/nodes/polygon2D";
import {MouseInputSceneModel} from "./MouseInputSceneModel";
import {ShapeModel} from "./nodes";

/**
 * The scene controller. It defines two interaction modes of its own, and forwards input to the scene model:
 * - **Edit**: hovering highlights a shape, dragging moves it, shift-dragging rotates it, and right-clicking deletes
 *   it.
 * - **Create**: clicking adds a shape; right-clicking still deletes one.
 *
 * Only one mode is active at a time, and only the active mode's callbacks run. Pick a mode in the control panel's
 * InteractionMode menu (which also lists the default Pan/Zoom mode).
 */
export class MouseInputSceneController extends AppSceneController2D{
    /** The names of this scene's interaction modes. */
    static Modes = {
        Edit: "Edit",
        Create: "Create",
    }

    /** The scene model, typed as this scene's class. */
    get model(): MouseInputSceneModel{
        return this._model as MouseInputSceneModel;
    }

    /**
     * Sets the background. Call `super.initScene()` first: it sets the background to white.
     */
    async initScene(){
        await super.initScene();
        this.setClearColor(Color.FromString("#f4f1ea"));
    }

    /**
     * Pairs each model class with its view.
     */
    initModelViewSpecs(){
        super.initModelViewSpecs();
        this.addModelViewSpec(ShapeModel, PolygonView2D);
    }

    /**
     * Creates the two modes and starts in Edit.
     */
    initInteractions(){
        super.initInteractions();
        this.createEditMode();
        this.createCreateMode();
        this.setCurrentInteractionMode(MouseInputSceneController.Modes.Edit);
    }

    /**
     * The Edit mode: hover, drag, shift-drag and right-click.
     */
    createEditMode(){
        this.createNewInteractionMode(
            MouseInputSceneController.Modes.Edit,
            {
                onMouseMove: (event: AInteractionEvent)=>{
                    // Runs whenever the cursor moves over the canvas. Picking works here just as it does for clicks.
                    this.model.onHover(this.getNodeModelAtCursor(event));
                },
                onDragStart: (event: AInteractionEvent, interaction: ADragInteraction)=>{
                    const cursor = this.getWorldCoordinatesOfCursorEvent(event);
                    if(cursor){
                        this.model.onDragStart(this.getNodeModelAtCursor(event), cursor);
                    }
                },
                onDragMove: (event: AInteractionEvent, interaction: ADragInteraction)=>{
                    const cursor = this.getWorldCoordinatesOfCursorEvent(event);
                    if(cursor){
                        // The controller only reports whether shift is held; the scene model decides what it means.
                        this.model.onDrag(cursor, event.shiftKey);
                    }
                },
                onDragEnd: (event: AInteractionEvent, interaction: ADragInteraction)=>{
                    this.model.onDragEnd();
                },
                onRightClick: (event: AInteractionEvent)=>{
                    // Right clicks don't open the browser's menu over the canvas; AniGraph prevents that.
                    this.model.onRightClick(this.getNodeModelAtCursor(event));
                },
            }
        );
    }

    /**
     * The Create mode: click to add a shape, right-click to delete one.
     */
    createCreateMode(){
        this.createNewInteractionMode(
            MouseInputSceneController.Modes.Create,
            {
                onClick: (event: AInteractionEvent)=>{
                    const cursor = this.getWorldCoordinatesOfCursorEvent(event);
                    if(cursor){
                        this.model.onCreateClick(cursor);
                    }
                },
                onRightClick: (event: AInteractionEvent)=>{
                    this.model.onRightClick(this.getNodeModelAtCursor(event));
                },
            }
        );
    }
}
