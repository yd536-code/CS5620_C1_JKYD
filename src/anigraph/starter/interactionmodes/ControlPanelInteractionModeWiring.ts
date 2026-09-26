/**
 * @file Helper functions that show the current interaction mode in the control panel's "InteractionMode" dropdown
 * and let the user switch modes from it. Used by both {@link ABasicSceneController} (Three.js) and
 * {@link ATwoJSAppSceneController} (Two.js). They live here rather than in `ASceneController`, which does not depend
 * on the app state.
 */
import {GetAppState} from "../../appstate";
import type {ASceneController} from "../../scene/ASceneController";

/** The app-state key of the control panel's interaction-mode dropdown. */
export const INTERACTION_MODE_APP_STATE_KEY = "InteractionMode";

/** A controller that can switch interaction modes without updating the dropdown (needed by `wireInteractionModeAppState`). */
export interface HasSilentSetCurrentInteractionMode {
    _silentSetCurrentInteractionMode(name?: string): void;
}

/** Returns the names of `controller`'s interaction modes whose `isGUISelectable` is true. */
export function getGUISelectableInteractionModeNames(controller: ASceneController): string[] {
    const rval: string[] = [];
    for (const name in controller.interactionModes) {
        if (controller.interactionModes[name].isGUISelectable) {
            rval.push(name);
        }
    }
    return rval;
}

/**
 * Sets the control panel's dropdown to `controller`'s current interaction mode, with the GUI-selectable modes as its
 * options, and redraws the control panel. Call this after any change to the set of modes or the active mode.
 */
export function updateInteractionModeControlPanelOptions(controller: ASceneController): void {
    const appState = GetAppState();
    appState.setSelectionControl(
        INTERACTION_MODE_APP_STATE_KEY,
        controller.currentInteractionModeName,
        getGUISelectableInteractionModeNames(controller)
    );
    // setSelectionControl replaces the dropdown's spec, but not the value stored for it (in `stateValues` and in the
    // panel's store). Without this line the panel keeps showing the previous mode, reports it back when it
    // re-renders, and `wireInteractionModeAppState` switches back to it, so switching modes from code after the panel
    // is drawn (e.g. on a key press) would not stick. `syncControlPanelValue` doesn't notify listeners, so it doesn't
    // loop, and it skips the panel's store until the panel has the dropdown.
    appState.syncControlPanelValue(INTERACTION_MODE_APP_STATE_KEY, controller.currentInteractionModeName);
    appState.updateControlPanel();
}

/**
 * Subscribes `controller` to the control panel's interaction-mode dropdown, so choosing a mode there activates it.
 * Uses `_silentSetCurrentInteractionMode` (not `setCurrentInteractionMode`) so the change isn't sent back to the
 * dropdown in a loop. Call once, typically from `_beforeInitScene`.
 */
export function wireInteractionModeAppState(controller: ASceneController & HasSilentSetCurrentInteractionMode): void {
    controller.subscribeToAppState(
        INTERACTION_MODE_APP_STATE_KEY,
        (v: string) => {
            if (v !== controller.currentInteractionModeName) {
                controller._silentSetCurrentInteractionMode(v);
            }
        },
        INTERACTION_MODE_APP_STATE_KEY
    );
}

/**
 * Removes the interaction mode named `name` from `controller` (with `clearInteractionMode`) and updates the
 * dropdown.
 */
export function deleteInteractionModeAndSyncControlPanel(controller: ASceneController, name: string): void {
    controller.clearInteractionMode(name);
    updateInteractionModeControlPanelOptions(controller);
}
