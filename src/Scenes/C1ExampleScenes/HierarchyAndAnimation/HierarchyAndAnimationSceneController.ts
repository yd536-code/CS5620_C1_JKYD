import {AppSceneController2D} from "../../../anigraph/starter/App2D/AppSceneController2D";
import {ADragInteraction, AGroupNodeView, AInteractionEvent, Color} from "../../../anigraph";
import {PolygonModel2D, PolygonView2D} from "../../../anigraph/starter/nodes/polygon2D";
import {HierarchyAndAnimationSceneModel} from "./HierarchyAndAnimationSceneModel";
import {ArmLinkModel, ArmModel, OrbitGroupModel, SpikyStarModel} from "./nodes";

/**
 * The scene controller. It pairs models with views, and turns mouse input into calls on the scene model. The frame
 * loop comes from {@link AppSceneController2D}, which calls the scene model's `timeUpdate(t)` every frame. It doesn't
 * decide what input means; the models do.
 */
export class HierarchyAndAnimationSceneController extends AppSceneController2D{
    /** The scene model, typed as this scene's class. */
    get model(): HierarchyAndAnimationSceneModel{
        return this._model as HierarchyAndAnimationSceneModel;
    }

    /**
     * Sets the background. `super.initScene()` sets it to white, so call it first.
     */
    async initScene(){
        await super.initScene();
        this.setClearColor(Color.FromString("#f4f1ea"));
    }

    /**
     * Pairs each model class with the view class that draws it. Specs match a model's exact class, so every model
     * class needs its own entry, even subclasses of classes that already have one.
     */
    initModelViewSpecs(){
        super.initModelViewSpecs();
        this.addModelViewSpec(SpikyStarModel, PolygonView2D);
        this.addModelViewSpec(ArmLinkModel, PolygonView2D);
        this.addModelViewSpec(PolygonModel2D, PolygonView2D);   // the orbiting moons
        // Group nodes draw nothing; a group view just passes its transform on to its children's views.
        this.addModelViewSpec(ArmModel, AGroupNodeView);
        this.addModelViewSpec(OrbitGroupModel, AGroupNodeView);
    }

    /**
     * Defines the "Main" interaction mode and makes it the current one.
     *
     * Selection happens on the *press* (`onDragStart`, which runs on pointer-down), not on click. The browser also
     * sends a click at the end of every drag, wherever the cursor ends up, so selecting on click would change the
     * selection every time you finished dragging a link.
     */
    initInteractions(){
        super.initInteractions();
        this.createNewInteractionMode(
            "Main",
            {
                onClick: (event: AInteractionEvent)=>{
                    // Give the canvas keyboard focus, so key presses reach this mode if you add key handlers.
                    this.eventTarget.focus();
                },
                onDragStart: (event: AInteractionEvent, interaction: ADragInteraction)=>{
                    // Picking: the frontmost pickable node under the cursor, or undefined.
                    this.model.onPress(this.getNodeModelAtCursor(event));
                },
                onDragMove: (event: AInteractionEvent, interaction: ADragInteraction)=>{
                    // World coordinates of the cursor. This accounts for the camera's pan and zoom.
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
