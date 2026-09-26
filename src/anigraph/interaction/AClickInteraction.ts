import {
    AInteraction,
    AInteractionEvent,
    AInteractionEventListener,
    AReceivesInteractionsInterface,
    PointerEvents
} from "./AInteraction";
import {CallbackType} from "../basictypes";


/** An object with an `onClick` handler. */
export interface HasClickInteraction{
    onClick(event:AInteractionEvent):void;
}

/** Calls a callback on each DOM `click` event on its element. */
export class AClickInteraction extends AInteraction{
    /**
     * Creates a click interaction on `element`.
     * @param element the DOM element to listen on
     * @param clickCallback called with the wrapped click event
     * @param handle optional name for the interaction
     */
    static Create(element:any, clickCallback?:CallbackType, handle?:string, ...args:any[]){
        const interaction = new this(element, clickCallback, handle);
        interaction.bindMethods();
        // if(clickCallback!==undefined){
        //     interaction.addEventListener("click", clickCallback);
        // }else {
        //     interaction.addEventListener("click", interaction.clickCallback);
        // }
        return interaction;
    }

    constructor(element:AReceivesInteractionsInterface, eventListeners?:AInteractionEventListener[], handle?:string);
    constructor(element:AReceivesInteractionsInterface, callback?:CallbackType, handle?:string);
    constructor(element:AReceivesInteractionsInterface, ...args:any[]){
        let eventListeners = undefined;
        let callback = undefined;
        let handle = (args.length>1 && typeof args[1] === 'string')?args[1]:undefined;
        if(args.length>0){
            if(Array.isArray(args[0])){
                eventListeners=args[0];
            }else{
                callback=args[0];
            }
        }

        super(element, eventListeners, handle);
        if(callback){
            this.clickCallback = callback;
            this.addEventListener(PointerEvents.POINTER_CLICK, callback);
        }
    }

    /** The click callback; the default just warns. */
    clickCallback(event:AInteractionEvent){
        console.warn(`No click callback specified for event ${event}`);
    }

    bindMethods() {
        super.bindMethods();
        this.clickCallback = this.clickCallback.bind(this);
    }
}

/** An object with an `onRightClick` handler. */
export interface HasRightClickInteraction{
    onRightClick(event:AInteractionEvent):void;
}

/** Calls a callback on each right click (DOM `contextmenu` event) and prevents the browser's context menu. */
export class ARightClickInteraction extends AInteraction{
    /**
     * Creates a right-click interaction on `element`.
     * @param element the DOM element to listen on
     * @param clickCallback called with the wrapped `contextmenu` event
     * @param handle optional name for the interaction
     */
    static Create(element:any, clickCallback?:CallbackType, handle?:string, ...args:any[]){
        const interaction = new this(element, clickCallback, handle);
        interaction.bindMethods();
        return interaction;
    }

    constructor(element:AReceivesInteractionsInterface, eventListeners?:AInteractionEventListener[], handle?:string);
    constructor(element:AReceivesInteractionsInterface, callback?:CallbackType, handle?:string);
    constructor(element:AReceivesInteractionsInterface, ...args:any[]){
        let eventListeners = undefined;
        let callback = undefined;
        let handle = (args.length>1 && typeof args[1] === 'string')?args[1]:undefined;
        if(args.length>0){
            if(Array.isArray(args[0])){
                eventListeners=args[0];
            }else{
                callback=args[0];
            }
        }

        super(element, eventListeners, handle);
        if(callback){
            this.clickCallback = callback;
            this.addEventListener(PointerEvents.POINTER_RIGHT_CLICK, callback, true);
        }
    }

    /** The right-click callback; the default just warns. */
    clickCallback(event:AInteractionEvent){
        console.warn(`No right click callback specified for event ${event}`);
    }

    bindMethods() {
        super.bindMethods();
        this.clickCallback = this.clickCallback.bind(this);
    }
}
