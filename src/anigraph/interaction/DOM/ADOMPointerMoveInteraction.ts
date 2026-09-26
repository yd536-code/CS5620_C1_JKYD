import {
    AInteraction,
    AInteractionEvent,
    AReceivesInteractionsInterface, DOMPointerEvents,
} from "../AInteraction";
import {CallbackType} from "../../basictypes";


/** Callback for pointer-move events. */
export type ADOMPointerMoveInteractionCallback = (event:AInteractionEvent, interaction?:ADOMPointerMoveInteraction)=>any;

/** Calls a callback on every `pointermove` event on its element (whether or not a button is pressed). */
export class ADOMPointerMoveInteraction extends AInteraction{
    /** A dictionary for arbitrary pointer-related state. */
    public pointerState:{[name:string]:any}={};
    /** Empties `pointerState`. */
    clearPointerState(){
        this.pointerState={};
    }
    /** Sets `pointerState[name]`. */
    setPointerState(name:string, value:any){
        this.pointerState[name]=value;
    }
    /** Returns `pointerState[name]`. */
    getPointerState(name:string){
        return this.pointerState[name];
    }



    /**
     * Creates a pointer-move interaction on `element`.
     * @param element the DOM element to listen on
     * @param moveCallback called as `(event, interaction)` on each pointer move
     * @param handle optional name for the interaction
     */
    static Create(element:any, moveCallback:ADOMPointerMoveInteractionCallback, handle?:string, ...args:any[]){
        const interaction = new this(element, moveCallback, handle);
        interaction.bindMethods();
        return interaction;
    }

    constructor(element:AReceivesInteractionsInterface, callback:CallbackType, handle?:string){
        super(element, undefined, handle);
        const self = this;
        this.moveCallback = callback??this.moveCallback;

        this.addDOMEventListener(DOMPointerEvents.POINTER_MOVE, (event:AInteractionEvent)=>{
            self.moveCallback(event, self);
        });
    }

    /** The move callback; the default just warns. */
    moveCallback(event:AInteractionEvent, interaction?:ADOMPointerMoveInteraction){
        console.warn(`No move callback specified for event ${event}`);
    }

    bindMethods() {
        super.bindMethods();
        // this.moveCallback = this.moveCallback.bind(this);
    }
}
