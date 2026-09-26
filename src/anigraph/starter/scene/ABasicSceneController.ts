import {AInteractionMode} from "../../interaction";
import {RenderTargetInterface} from "../../scene/ASceneController";
import {AGLSceneController} from "../../scene/AGLSceneController";
import {ADebugInteractionMode} from "../interactionmodes";
import {
    deleteInteractionModeAndSyncControlPanel,
    updateInteractionModeControlPanelOptions,
    wireInteractionModeAppState
} from "../interactionmodes/ControlPanelInteractionModeWiring";
import {AGLContext, ARenderContext} from "../../rendering";
import {ALoadedModel3D} from "../../scene/nodes/loaded/ALoadedModel3D";
import {ALoadedView3D} from "../../scene/nodes/loaded/ALoadedView3D";
import {RGBATestMeshModel3D, RGBATestMeshView} from "../nodes";
import {AGroupNodeModel2D, AGroupNodeModel3D, ANodeModel3D, ANodeView} from "../../scene";
import {APointLightModel3D, APointLightView3D} from "../../scene/lights";
import {ARenderTarget} from "../../rendering/target/ARenderTarget";

/**
 * Shared base for the starter scene controllers ({@link AppSceneController2D}, {@link AppSceneController3D}).
 * On top of {@link AGLSceneController} it:
 * - keeps the control panel's "InteractionMode" dropdown in sync with the controller's interaction modes,
 * - adds {@link ADebugInteractionMode} (3D fly/orbit camera) as the default interaction mode,
 * - runs a default frame loop: `model.timeUpdate()`, then the controller's `timeUpdate()`, then `renderPasses`.
 */
export abstract class ABasicSceneController extends AGLSceneController {
    //#############################//--Render Targets--\\#############################
    //<editor-fold desc="Render Targets">

    //</editor-fold>


    //###############################################//--Defining Interaction Modes--\\###############################################
    //<editor-fold desc="Defining Interaction Modes">
    /**
     * Sets the current interaction mode without updating the control-panel dropdown. Used when the change came from
     * the dropdown itself (see `wireInteractionModeAppState`), to avoid a feedback loop.
     */
    _silentSetCurrentInteractionMode(name?:string){
        super.setCurrentInteractionMode(name);
    }

    /** Sets the current interaction mode and updates the control-panel dropdown to match. */
    setCurrentInteractionMode(name?: string) {
        this._silentSetCurrentInteractionMode(name)
        this._updateInteractionModeOptions();
    }


    /**
     * Registers model-view specs: which view class to create for each model class when a model is added to the scene.
     * Does nothing here; subclasses call `addModelViewSpec(ModelClass, ViewClass)`. The scene view
     * ({@link AGLSceneView}) already registers views for cameras (2D and 3D), group nodes (2D and 3D), point lights,
     * and loaded models; {@link AppSceneController3D} adds a few more 3D defaults.
     */
    initModelViewSpecs() {
        // This line tells the controller that whenever a _modelclass_ is added to the model hierarchy, we should create and add a corresponding _viewclass_ and connect it to the new model this.addModelViewSpec(_modelclass_, _viewclass_);
    }

    /** Registers {@link ADebugInteractionMode} (3D fly/orbit camera controls) and makes it the current mode. */
    addDebugInteractionMode(){
        let debugInteractionMode = new ADebugInteractionMode(this);
        this.defineInteractionMode(ADebugInteractionMode.NameInGUI, debugInteractionMode);
        this.setCurrentInteractionMode(ADebugInteractionMode.NameInGUI);
    }

    /** Makes {@link ADebugInteractionMode} the current mode, registering it first if needed. */
    switchToDebugInteractionMode(){
        if(!this._interactions.modeIsDefined(ADebugInteractionMode.NameInGUI)){
            this.addDebugInteractionMode();
        }else{
            this.setCurrentInteractionMode(ADebugInteractionMode.NameInGUI);
        }

    }

    /** Makes choosing a mode in the control-panel dropdown switch the current interaction mode (see
     * `wireInteractionModeAppState`). Called from `_beforeInitScene`. */
    addInteractionModeAppState(){
        wireInteractionModeAppState(this);
    }

    _beforeInitScene(...args:any[]){
        super._beforeInitScene(...args)
        this.addInteractionModeAppState();
    }

    /** Default interaction setup: registers {@link ADebugInteractionMode} and makes it current. */
    initInteractions(){
        this.setCurrentInteractionMode();
        this.addDebugInteractionMode();
    }

    /** Registers an interaction mode under `name` and updates the control-panel dropdown. */
    defineInteractionMode(name: string, mode?: AInteractionMode) {
        super.defineInteractionMode(name, mode);
        this._updateInteractionModeOptions();
    }

    /** Removes the interaction mode named `name` and updates the control-panel dropdown. */
    deleteInteractionMode(name: string){
        deleteInteractionModeAndSyncControlPanel(this, name);
    }

    /** Updates the control-panel dropdown to show the current and available interaction modes. */
    _updateInteractionModeOptions(){
        updateInteractionModeControlPanelOptions(this);
    }

    /**
     * Updates the current interaction mode with the controller's time. The controller's clock is separate from the
     * model's, so pausing the model doesn't break interactions.
     */
    timeUpdate(){
        /**
         *Interactions use our controller's clock, which is separate from our model's clock because we don't want pausing the model's clock to break all of our interactions!
         */
        this.interactionMode.timeUpdate(this.time);
    }

    /** Runs once per frame. The default calls `_basicAnimationFrameCallback`. */
    onAnimationFrameCallback(context: ARenderContext) {
        this._basicAnimationFrameCallback(context as AGLContext);
    }

    /**
     * The default frame: calls `model.timeUpdate(model.clock.currentTime)`, then this controller's `timeUpdate()`,
     * then draws every render pass with `renderPasses(context)`. `currentTime` is read once here, so every node
     * updated this frame sees the same time.
     */
    _basicAnimationFrameCallback(context: AGLContext){
        this.model.timeUpdate(this.model.clock.currentTime);
        this.timeUpdate();

        // Render through the pass list. A single-pass scene (the common case) just clears and renders once.
        this.renderPasses(context);
    }

}
