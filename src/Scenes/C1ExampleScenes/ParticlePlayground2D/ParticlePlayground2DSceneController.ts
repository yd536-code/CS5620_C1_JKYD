import {ASceneController2D} from "../../../anigraph/starter/Scene2D/ASceneController2D";
import {
    AGroupNodeView,
    AInteractionEvent,
    AKeyboardInteraction,
    ASVGLModel2D,
    ASVGLView,
    Color
} from "../../../anigraph";
import {ParticlePlayground2DSceneModel} from "./ParticlePlayground2DSceneModel";
import {LabCatParticlePlaygroundModel, PlaygroundParticleSystemModel, PlaygroundParticleSystemView} from "./nodes";

/**
 * The scene controller. It is deliberately thin. It does two things:
 * 1. says which view class draws each kind of model (`initModelViewSpecs`),
 * 2. passes keyboard input on to the scene model (`initInteractions`).
 *
 * The frame loop comes from {@link ASceneController2D}: every frame it calls the scene model's
 * `timeUpdate(t)`, then renders.
 * It doesn't know what any key does; the models decide that.
 */
export class ParticlePlayground2DSceneController extends ASceneController2D{
    get model(): ParticlePlayground2DSceneModel{
        return this._model as ParticlePlayground2DSceneModel;
    }

    async initScene(){
        await super.initScene();
        // A black background makes the glowing particles easier to see.
        this.setClearColor(Color.Black());
    }

    /**
     * Pairs each model class with the view class that draws it. When a model of one of these classes is added to the
     * scene, the controller creates a view of the matching class for it.
     *
     * A spec doesn't apply to a subclass that has its own `@ASerializable` label. That is why the playground needs its
     * own entry even though it is a group node: the default entry for `AGroupNodeModel2D` doesn't apply to a labeled
     * subclass like `LabCatParticlePlaygroundModel`.
     */
    initModelViewSpecs(){
        super.initModelViewSpecs();
        // The playground draws nothing itself; a group view just passes its transform on to its children's views.
        this.addModelViewSpec(LabCatParticlePlaygroundModel, AGroupNodeView);
        this.addModelViewSpec(PlaygroundParticleSystemModel, PlaygroundParticleSystemView);
        this.addModelViewSpec(ASVGLModel2D, ASVGLView);
    }

    /**
     * Defines the "Main" interaction mode, which sends every key press and release to the scene model.
     * The pan/zoom mode registered by `super.initInteractions()` is still available in the interaction-mode menu.
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
                    // Clicking the canvas gives it keyboard focus. Without focus, key presses never reach this mode.
                    this.eventTarget.focus();
                },
            }
        );
        this.setCurrentInteractionMode("Main");
    }
}
