import {ATwoJSSceneController} from "../../scene/ATwoJSSceneController";
import {ATwoJSAppSceneModel} from "./ATwoJSAppSceneModel";
import {ATwoJSContextParams} from "../../rendering/context/ATwoJSContext";
import {ATwoJSGroupNodeView} from "../../rendering/twojs/ATwoJSGroupNodeView";
import {AGroupNodeModel2D} from "../../scene/nodeModel";
import {Color} from "../../math";
import {AInteractionMode} from "../../interaction";
import {
    deleteInteractionModeAndSyncControlPanel,
    updateInteractionModeControlPanelOptions,
    wireInteractionModeAppState
} from "../interactionmodes/ControlPanelInteractionModeWiring";
import {ATwoJSDebugInteractionMode} from "./interactionmodes/ATwoJSDebugInteractionMode";

/**
 * Base class for the scene controller of a Two.js 2D scene.
 *
 * Sets a white background in `initScene`, registers a default view for group nodes, and keeps the control panel's
 * "InteractionMode" dropdown in sync with the controller's interaction modes. Each frame it calls
 * `model.timeUpdate()`. Subclasses should override:
 * - `initModelViewSpecs()` — call `super.initModelViewSpecs()` to keep the
 *   defaults, then `addModelViewSpec(ModelClass, ViewClass)` for each node
 *   type in the scene.
 * - `initInteractions()` — define interaction modes (see
 *   `createNewInteractionMode`).
 */
export abstract class ATwoJSAppSceneController extends ATwoJSSceneController {
    constructor(model: ATwoJSAppSceneModel, twoContextParams?: ATwoJSContextParams) {
        super(model, twoContextParams);
    }

    get model(): ATwoJSAppSceneModel {
        return this._model as ATwoJSAppSceneModel;
    }

    /** The keys currently held down, according to the active interaction mode's keyboard interaction. */
    getKeysDownState() {
        return this.interactionMode.getKeyDownState();
    }

    // getWorldCoordinatesOfCursorEvent is inherited from ASceneController, but it uses the camera's orthographic
    // projection, which Two.js does not draw with. Use `event.cursorPosition` (canvas pixels) instead.

    /** Sets a white background, then runs the base setup (which calls `initInteractions()`). */
    async initScene(): Promise<void> {
        this.setClearColor(Color.White());
        await super.initScene();
    }

    //###############################################//--Defining Interaction Modes--\\###############################################
    //<editor-fold desc="Defining Interaction Modes">
    /**
     * Sets the current interaction mode without updating the control-panel dropdown. Used when the change came from
     * the dropdown itself (see `wireInteractionModeAppState`), to avoid a feedback loop.
     */
    _silentSetCurrentInteractionMode(name?: string) {
        super.setCurrentInteractionMode(name);
    }

    /** Sets the current interaction mode and updates the control-panel dropdown to match. */
    setCurrentInteractionMode(name?: string) {
        this._silentSetCurrentInteractionMode(name);
        this._updateInteractionModeOptions();
    }

    /** Registers an interaction mode under `name` and updates the control-panel dropdown. */
    defineInteractionMode(name: string, mode?: AInteractionMode) {
        super.defineInteractionMode(name, mode);
        this._updateInteractionModeOptions();
    }

    /** Removes the interaction mode named `name` and updates the control-panel dropdown. */
    deleteInteractionMode(name: string) {
        deleteInteractionModeAndSyncControlPanel(this, name);
    }

    /** Updates the control-panel dropdown to show the current and available interaction modes. */
    _updateInteractionModeOptions() {
        updateInteractionModeControlPanelOptions(this);
    }

    /** Makes choosing a mode in the control-panel dropdown switch the current interaction mode. Called from
     * `_beforeInitScene`. */
    addInteractionModeAppState() {
        wireInteractionModeAppState(this);
    }

    _beforeInitScene(...args: any[]) {
        super._beforeInitScene(...args);
        this.addInteractionModeAppState();
    }

    /** Registers {@link ATwoJSDebugInteractionMode} (drag to pan, wheel to zoom) and makes it the current mode. */
    addDebugInteractionMode() {
        const debugInteractionMode = new ATwoJSDebugInteractionMode(this);
        this.defineInteractionMode(ATwoJSDebugInteractionMode.NameInGUI, debugInteractionMode);
        this.setCurrentInteractionMode(ATwoJSDebugInteractionMode.NameInGUI);
    }

    /** Makes {@link ATwoJSDebugInteractionMode} the current mode, registering it first if needed. */
    switchToDebugInteractionMode() {
        if (!this.isInteractionModeDefined(ATwoJSDebugInteractionMode.NameInGUI)) {
            this.addDebugInteractionMode();
        } else {
            this.setCurrentInteractionMode(ATwoJSDebugInteractionMode.NameInGUI);
        }
    }
    //</editor-fold>

    /** Default interaction setup: no modes are registered. Call `addDebugInteractionMode()` or define your own. */
    initInteractions(): void {
        this.setCurrentInteractionMode();
        // Subclasses can call addDebugInteractionMode() or define their own modes here.
    }

    /** Registers the default view for group nodes. Overrides should call `super.initModelViewSpecs()` first. */
    initModelViewSpecs(): void {
        // Group nodes render no geometry but propagate transforms to children.
        this.addModelViewSpec(AGroupNodeModel2D, ATwoJSGroupNodeView);

        // The camera model (an ACameraModel2D) deliberately gets no view spec: node models with no registered view
        // are skipped, and the Two.js scene view applies the camera's position/zoom to the whole drawing itself.
    }
}
