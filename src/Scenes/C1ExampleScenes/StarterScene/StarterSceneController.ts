import {AppSceneController2D} from "../../../anigraph/starter/App2D/AppSceneController2D";
import {ADragInteraction, AInteractionEvent, AKeyboardInteraction, Color} from "../../../anigraph";
import {StarterSceneModel} from "./StarterSceneModel";
import {StarterShapeModel, StarterShapeView} from "./nodes";

/**
 * The scene controller. It does two things:
 * 1. says which view class draws each kind of model (`initModelViewSpecs`),
 * 2. passes keyboard and mouse input on to the scene model (`initInteractions`).
 *
 * The frame loop comes from {@link AppSceneController2D}: every frame it calls the scene model's
 * `timeUpdate(t)`, then renders.
 * It doesn't decide what input means; the models do.
 */
export class StarterSceneController extends AppSceneController2D{
    /** The scene model, typed as this scene's class. */
    get model(): StarterSceneModel{
        return this._model as StarterSceneModel;
    }

    /**
     * Sets the background. Call `super.initScene()` first: it sets the background to white, which would overwrite a
     * color set before it. For an image background, load a texture and call
     * `this.view.setBackgroundTexture(AssetManager.getTexture(name))`.
     */
    async initScene(){
        await super.initScene();
        this.setClearColor(Color.FromString("#f4f1ea"));
    }

    /**
     * Pairs each model class with the view class that draws it. When a model of one of these classes is added to the
     * scene, the controller creates a view of the matching class for it. Specs match a model's exact class, so every
     * model class you write needs its own entry, even a subclass of one that already has one.
     */
    initModelViewSpecs(){
        super.initModelViewSpecs();   // keeps the built-in specs (camera, group nodes)
        this.addModelViewSpec(StarterShapeModel, StarterShapeView);
    }

    /**
     * Defines the "Main" interaction mode and makes it the current one. Each callback turns an input event into a call
     * on the scene model. `super.initInteractions()` registers the default pan/zoom mode, which stays available in
     * the control panel's interaction-mode menu.
     */
    initInteractions(){
        super.initInteractions();
        this.createNewInteractionMode(
            "Main",
            {
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
                // To handle dragging, forward the cursor to a model method in the same way, for example:
                onDragStart: (event: AInteractionEvent, interaction: ADragInteraction)=>{},
                onDragMove: (event: AInteractionEvent, interaction: ADragInteraction)=>{
                    // const cursor = this.getWorldCoordinatesOfCursorEvent(event);
                    // if(cursor){ this.model.onDrag(cursor); }
                },
                onDragEnd: (event: AInteractionEvent, interaction: ADragInteraction)=>{},
            }
        );
        this.setCurrentInteractionMode("Main");
    }
}
