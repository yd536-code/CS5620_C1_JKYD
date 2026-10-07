import {ASceneController2D} from "../../anigraph/starter/Scene2D";
import {ADragInteraction, AInteractionEvent, AKeyboardInteraction, ANodeModel2D, Color} from "../../anigraph";
import {ProjectSceneModel} from "./ProjectSceneModel";
import {SeaModel, SeaView, BoatModel, BoatView, SeaBodyFill} from "./nodes";
import {SeaBodyView} from "./nodes/SeaBodyView";

/**
 * The scene controller. It does two things:
 * 1. says which view class draws each kind of model (`initModelViewSpecs`),
 * 2. passes keyboard and mouse input on to the scene model (`initInteractions`).
 *
 * The frame loop comes from {@link ASceneController2D}: every frame it calls the scene model's
 * `timeUpdate(t)`, then renders.
 * It doesn't decide what input means; the models do.
 */
export class ProjectSceneController extends ASceneController2D{
    /** The scene model, typed as this scene's class. */
    get model(): ProjectSceneModel{
        return this._model as ProjectSceneModel;
    }

    /**
     * Sets the background. Call `super.initScene()` first: it sets the background to white, which would overwrite a
     * color set before it. For an image background, load a texture and call
     * `this.view.setBackgroundTexture(AssetManager.getTexture(name))`.
     */
    async initScene(){
        await super.initScene();
        this.setClearColor(Color.FromString("#dcf4ee"));
    }

    /**
     * Pairs each model class with the view class that draws it. When a model of one of these classes is added to the
     * scene, the controller creates a view of the matching class for it. A spec doesn't apply to a subclass that has
     * its own `@ASerializable` label, and every model class you write should have one, so every model class you write
     * needs its own entry, even a subclass of one that already has one.
     */
    initModelViewSpecs(){
        super.initModelViewSpecs();   // keeps specs a parent class adds; camera and group-node specs are built in
        this.addModelViewSpec(SeaModel, SeaView);
        this.addModelViewSpec(BoatModel, BoatView);
        this.addModelViewSpec(SeaBodyFill, SeaBodyView);
    }

    /**
     * Defines the "Main" interaction mode and makes it the current one. Each callback turns an input event into a call
     * on the scene model. `super.initInteractions()` registers the default pan/zoom mode, which stays available in
     * the control panel's interaction-mode menu.
     */
    initInteractions(){
        super.initInteractions();
        this.createNewInteractionMode("Main", {
                onKeyDown: (event: AInteractionEvent, interaction: AKeyboardInteraction)=>{
                    this.model.onKeyDown(event.key);
                },
                onKeyUp: (event: AInteractionEvent, interaction: AKeyboardInteraction)=>{
                    this.model.onKeyUp(event.key);
                },
                onClick: (event: AInteractionEvent)=>{
                    // Clicking gives the canvas keyboard focus. Without focus, key presses never reach this mode.
                    this.eventTarget.focus();
                    // World coordinates of the click. This accounts for the camera's pan and zoom.
                    const cursor = this.getWorldCoordinatesOfCursorEvent(event);
                    if(cursor){
                        this.model.onClick(cursor);
                    }
                },
                // To handle dragging, forward the cursor to a model method in the same way, for example (first add an
                // `onDrag(worldPoint: Vec2)` method to the scene model, like its `onClick`):
                onDragStart: (event: AInteractionEvent, interaction: ADragInteraction)=>{},
                onDragMove: (event: AInteractionEvent, interaction: ADragInteraction)=>{
                    // const cursor = this.getWorldCoordinatesOfCursorEvent(event);
                    // if(cursor){ this.model.onDrag(cursor); }
                },
                onDragEnd: (event: AInteractionEvent, interaction: ADragInteraction)=>{},
            }
        );
        this.setCurrentInteractionMode("Main");
        this.createNewInteractionMode("MovingGameplay", {
                onKeyDown: (event: AInteractionEvent, interaction: AKeyboardInteraction)=>{
                    this.model.onKeyDown(event.key);
                },
                onKeyUp: (event: AInteractionEvent, interaction: AKeyboardInteraction)=>{
                    this.model.onKeyUp(event.key);
                },
                onClick: (event: AInteractionEvent)=>{
                    // Clicking gives the canvas keyboard focus. Without focus, key presses never reach this mode.
                    this.eventTarget.focus();
                    // World coordinates of the click. This accounts for the camera's pan and zoom.
                    const cursor = this.getWorldCoordinatesOfCursorEvent(event);
                    if(cursor){
                        this.model.onClick(cursor);
                    }
                },
                // To handle dragging, forward the cursor to a model method in the same way, for example (first add an
                // `onDrag(worldPoint: Vec2)` method to the scene model, like its `onClick`):
                onDragStart: (event: AInteractionEvent, interaction: ADragInteraction)=>{},
                onDragMove: (event: AInteractionEvent, interaction: ADragInteraction)=>{
                    // const cursor = this.getWorldCoordinatesOfCursorEvent(event);
                    // if(cursor){ this.model.onDrag(cursor); }
                },
                onDragEnd: (event: AInteractionEvent, interaction: ADragInteraction)=>{},
            }
        );
        this.setCurrentInteractionMode("MovingGameplay");
    }
}
