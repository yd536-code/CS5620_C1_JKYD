import {AInteraction, AInteractionMode} from "../../interaction";

/**
 * Something that owns named interaction modes (sets of user interactions, such as mouse or keyboard handlers) and
 * has one current mode. Implemented by {@link AController}.
 */
export interface HasInteractions{
    /** The current interaction mode. */
    get interactionMode():AInteractionMode;
    /** Adds an interaction to the current mode. */
    addInteraction(interaction: AInteraction):void;
    /** Activates the current mode's interactions. */
    activateInteractions():void;
    /** Switches to the named mode (the default mode if no name is given). */
    setCurrentInteractionMode(name?: string):void;
    /** Defines a mode under `name`. */
    defineInteractionMode(name: string, mode?: AInteractionMode):void;
    /** Removes the mode named `name`. */
    clearInteractionMode(name: string):void;
    /** Whether a mode named `name` is defined. */
    isInteractionModeDefined(name: string):boolean;
    /** The DOM element that interactions listen to for events. */
    get eventTarget():EventTarget;
}



