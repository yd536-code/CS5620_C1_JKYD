import {
    AInteraction,
    AInteractionEvent,
    AReceivesInteractionsInterface,
    PointerEvents
} from "./AInteraction";
import {CallbackType} from "../basictypes";


/** Callback for mouse-wheel events. */
export type AWheelInteractionCallback = (event:AInteractionEvent, interaction?:AWheelInteraction)=>any;

/** Calls a callback on each DOM `wheel` event on its element. Always prevents the default action (page scrolling). */
export class AWheelInteraction extends AInteraction{
    /**
     * Creates a wheel interaction on `element`.
     * @param element the DOM element to listen on
     * @param moveCallback called as `(event, interaction)` for each wheel event
     * @param handle optional name for the interaction
     */
    static Create(element:any, moveCallback:AWheelInteractionCallback, handle?:string, ...args:any[]){
        const interaction = new this(element, moveCallback, handle);
        interaction.bindMethods();
        return interaction;
    }
    constructor(element:AReceivesInteractionsInterface, callback:AWheelInteractionCallback, handle?:string){
        super(element, undefined, handle);
        const self = this;
        this.wheelCallback = callback??this.wheelCallback;
        this.addDOMEventListener(PointerEvents.POINTER_WHEEL, (event:AInteractionEvent)=>{
            event.preventDefault();
            self.wheelCallback(event, self);
        });
    }

    /** The wheel callback; the default logs the event. */
    wheelCallback(event:AInteractionEvent, interaction:AWheelInteraction){
        console.log(event);
    }

    bindMethods() {
        super.bindMethods();
    }
}
