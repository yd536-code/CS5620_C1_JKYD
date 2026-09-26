import {ADragInteractionBase} from "./ADragInteraction";
import {CallbackType} from "../basictypes";
import {AInteractionEvent} from "./AInteraction";


/**
 * A click that only counts if the pointer barely moves: `clickCallback` fires on pointer-up only if the cursor
 * never moved more than `dragAllowance` pixels from where it went down. Useful for telling clicks apart from drags.
 */
export class AStaticClickInteraction extends ADragInteractionBase{
    /** How far (in pixels) the cursor may move between pointer-down and pointer-up and still count as a click. */
    public dragAllowance=10;//allowance in pixels
    /**
     * Creates a static-click interaction on `element`.
     * @param element the DOM element to listen on
     * @param clickCallback called with the pointer-up event when the gesture counts as a click
     * @param handle optional name for the interaction
     */
    static Create(element:any,
                  clickCallback:CallbackType,
                  handle?:string){
        const interaction = new this(element, undefined, handle);
        interaction.setDragStartCallback((interaction:AStaticClickInteraction, event:AInteractionEvent)=>{
            interaction.setInteractionState('noDrag', true);
            interaction.setInteractionState('dragStartCursor', event.cursorPosition);
        });
        interaction.setDragMoveCallback((interaction:AStaticClickInteraction, event:any)=>{
            if(event.cursorPosition.minus(interaction.getInteractionState('dragStartCursor')).L2()>interaction.dragAllowance) {
                interaction.setInteractionState('noDrag', false);
            }
        });
        interaction.setDragEndCallback((interaction:AStaticClickInteraction, event:any)=>{
            if(interaction.getInteractionState('noDrag')){
                clickCallback(event);
            }
        });
        interaction.bindMethods();
        return interaction;
    }

}
