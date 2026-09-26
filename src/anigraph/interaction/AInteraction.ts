/**
 * @file Base classes for user interactions: {@link AInteraction} (a switchable set of DOM event listeners) and
 * {@link AInteractionEvent} (a wrapped DOM event with cursor-position helpers).
 */
import {V2, Vec2} from "../math/linalg/2D/Vec2";
import {ACallbackSwitch} from "../base/aevents/ACallbackSwitch";
import {HasInteractions} from "../base/amvc/HasInteractions";

/** DOM event names used by the pointer interactions. */
export const enum PointerEvents{
    POINTER_UP = 'pointerup',
    POINTER_DOWN='pointerdown',
    POINTER_MOVE = 'pointermove',
    POINTER_CLICK = 'click',
    POINTER_WHEEL='wheel',
    POINTER_OVER='pointerover',
    POINTER_RIGHT_CLICK='contextmenu'
}

/** Event names used by {@link ADOMPointerMoveInteraction}. */
export const enum DOMPointerEvents{
    POINTER_MOVE = 'pointermove',
}


// interface ReceivesOnOffInteractionsInterface{
//     on(eventType:string, callback:(...args:any[])=>any):any;
//     off(eventType:string, callback:(...args:any[])=>any):any;
//     once(eventType:string, callback:(...args:any[])=>any):any;
// }

/**
 * An object with DOM-style `addEventListener`/`removeEventListener`. Use {@link AReceivesInteractionsInterface}.
 * @internal
 */
export interface ReceivesEventListenerInteractionsInterface{
    addEventListener(eventType:string, callback:(event:any)=>any, ...args:any[]):any;
    removeEventListener(eventType:string, callback:(event:any)=>any, ...args:any[]):any;
}

/** Anything an interaction can attach listeners to: an object with DOM-style `addEventListener`/`removeEventListener` (e.g. an `HTMLElement` or `document`). */
export type AReceivesInteractionsInterface =ReceivesEventListenerInteractionsInterface;
    // ReceivesEventListenerInteractionsInterface|ReceivesOnOffInteractionsInterface;

/** One event listener owned by an interaction; `addListener`/`removeListener` attach and detach it from the element. */
export interface AInteractionEventListener{
    eventType: string;
    addListener: () => void;
    removeListener: () => void;
}

/** The DOM event fields interactions read (mouse position and key info). */
export interface InteractionEventInterface extends Event{
    clientX?:number;
    clientY?:number;
    key?:string;
    code?:string;
}


/**
 * An event passed to interaction callbacks. Wraps the underlying DOM event (`DOMEvent`) and adds cursor
 * positions in several coordinate systems:
 * - `cursorPosition` / `positionInContext`: pixels relative to the owner's event target, origin top-left, y down.
 * - `cursorPositionCenterOrigin`: pixels, origin at the element's center, y up.
 * - `ndcCursor`: normalized device coordinates, each in [-1, 1] across the element, y up.
 */
export abstract class AInteractionEvent{
    /** The interaction that produced this event. */
    public interaction!:AInteraction;
    abstract _event:InteractionEventInterface;
    abstract get DOMEvent():Event;
    abstract preventDefault():void;
    abstract elementIsTarget(event:AReceivesInteractionsInterface):boolean;
    abstract get eventIsOnTarget():boolean;
    abstract get positionInContext():Vec2|null;
    abstract get cursorPosition():Vec2|null;
    abstract get cursorPositionCenterOrigin():Vec2|null;
    abstract get ndcCursor():Vec2|null;
    // abstract get targetModel():AModelInterface;
    abstract get shiftKey():boolean;
    abstract get altKey():boolean;
    abstract get ctrlKey():boolean;
    abstract get onFirstIntersection():boolean;
    abstract get key():string;

    /**
     * Returns the cursor in a viewport's own NDC: re-normalizes the canvas-wide `ndcCursor` into `viewport`'s
     * `[-1, 1]` range. `viewport` is a normalized rectangle `[x, y, w, h]` (each in `[0, 1]`, origin bottom-left --
     * the same convention as `THREE.WebGLRenderer.setViewport` and {@link ARenderPass.viewport}).
     * Returns `null` if there is no cursor position or the cursor is outside `viewport`;
     * {@link ARenderPass.localNDCCursor} wraps this and uses `null` to mean "this pass wasn't clicked".
     * It takes a plain rectangle rather than an `ARenderPass` so this module doesn't depend on `scene/`.
     */
    ndcCursorForViewport(viewport:[number,number,number,number]):Vec2|null{
        const ndc = this.ndcCursor;
        if(!ndc) return null;
        const [vx, vy, vw, vh] = viewport;
        if(vw<=0 || vh<=0) return null;
        // Canvas-global ndc (x, y in [-1, 1], y-up, origin at canvas center) -> viewport-fraction coordinates
        // (u, v in [0, 1], bottom-left origin, y-up), the same space `viewport` is expressed in.
        const u = (ndc.x+1)*0.5;
        const v = (ndc.y+1)*0.5;
        if(u<vx || u>vx+vw || v<vy || v>vy+vh) return null;
        const localU = (u-vx)/vw;
        const localV = (v-vy)/vh;
        return new Vec2(localU*2-1, localV*2-1);
    }
}

/**
 * A fake {@link AInteractionEvent} with a fixed cursor position and modifier keys, for tests. Its
 * `ndcCursor` and `cursorPositionCenterOrigin` just return the given position (with a warning).
 */
export class AMockInteractionEvent extends AInteractionEvent{
    public _cursorPosition:Vec2;
    _shiftKey:boolean;
    _altKey:boolean;
    _ctrlKey:boolean;
    _key:string;
    /** Returns a stand-in element whose `addEventListener`/`removeEventListener` do nothing. */
    static GetMockElement(){
        return {
            addEventListener:(eventType:string, callback:(event:any)=>any, ...args:any[])=>{return;},
            removeEventListener:(eventType:string, callback:(event:any)=>any, ...args:any[])=>{}
        }
    }
    get onFirstIntersection(){return true;}
    public _event!:InteractionEventInterface;
    constructor(interaction:AInteraction, cursorPosition:Vec2, shiftKey:boolean=false, altKey:boolean=false, ctrlKey:boolean=false, event?:InteractionEventInterface){
        super();
        this._event = (event as InteractionEventInterface);
        if(!this._event){
            this._event = new PointerEvent(PointerEvents.POINTER_MOVE);
            //new Event();
        }
        this._key = '';
        this.interaction=interaction;
        this._cursorPosition = cursorPosition;
        this._shiftKey = shiftKey;
        this._altKey = altKey;
        this._ctrlKey=ctrlKey;
    }
    get key(){return this._key;}
    get DOMEvent(){return this._event;}
    preventDefault(){}
    elementIsTarget(event:AReceivesInteractionsInterface){return true;};
    get eventIsOnTarget(){return true;}
    get positionInContext() {return this._cursorPosition;};
    get cursorPosition(){return this._cursorPosition;};
    get cursorPositionCenterOrigin(){
        console.warn("Cursor position center origin not implemented in mock events")
        return this._cursorPosition;
    }
    get ndcCursor(){
        console.warn("NDC Cursor position not implemented in mock events")
        return this._cursorPosition;
    }

    // get targetModel(){
    //     return (this.interaction.owner as ASceneNodeController<any>).sceneController.model;
    // }
    get shiftKey(){return this._shiftKey};
    get altKey(){return this._altKey;};
    get ctrlKey(){return this._ctrlKey;}
}


/**
 * The {@link AInteractionEvent} used for real DOM events. Positions are measured relative to the owner's
 * `eventTarget` (from `interaction.owner`), so the interaction must have an owner (i.e. be added to an
 * interaction mode) before reading them. `positionInContext`, `cursorPositionCenterOrigin` and `ndcCursor`
 * return `null` if the target isn't a DOM `Element`. Any `Element` works, including an `<svg>` (which is an
 * `Element` but not an `HTMLElement`).
 */
export class ADOMInteractionEvent extends AInteractionEvent{
    public _event:InteractionEventInterface;
    constructor(event:InteractionEventInterface, interaction:AInteraction){
        super();
        this._event = event;
        this.interaction=interaction;
    }
    get onFirstIntersection(){return true;}
    get DOMEvent() {
        return this._event;
    }
    get shiftKey(){
        return (this._event as PointerEvent).shiftKey;
    }
    get altKey(){
        return (this._event as PointerEvent).altKey;
    }
    get ctrlKey(){
        return (this._event as PointerEvent).ctrlKey;
    }

    preventDefault(){
        this._event.preventDefault();
    }
    /** Whether `element` is the DOM event's `target`. */
    elementIsTarget(element:AReceivesInteractionsInterface){
        return this._event.target===element;
    }
    get positionInContext(){
        const contextElement = this.interaction.owner.eventTarget;
        if(contextElement instanceof Element) {
            const svgrect = contextElement.getBoundingClientRect();
            // @ts-ignore
            return new Vec2(this._event.clientX-svgrect.left, this._event.clientY-svgrect.top);
        }
        else return null;

    }
    get cursorPosition(){
        return this.positionInContext;
    }

    get cursorPositionCenterOrigin(){
        const contextElement = this.interaction.owner.eventTarget;
        if(contextElement instanceof Element) {
            const contextRect = contextElement.getBoundingClientRect();
            let midpoint = V2(contextRect.right - contextRect.left, contextRect.bottom - contextRect.top).times(0.5);
            // @ts-ignore
            return new Vec2(this._event.clientX - contextRect.left - midpoint.x, contextRect.top - this._event.clientY + midpoint.y
            );
        }else{
            return null;
        }
    }

    get ndcCursor(){
        const contextElement = this.interaction.owner.eventTarget;
        if(contextElement instanceof Element) {
            const contextRect = contextElement.getBoundingClientRect();
            let contextw = contextRect.right - contextRect.left;
            let contexth = contextRect.bottom - contextRect.top;
            let midpoint = V2(contextw*0.5, contexth*0.5);
            // @ts-ignore
            let cunnormalized = new Vec2(this._event.clientX - contextRect.left - midpoint.x, contextRect.top - this._event.clientY + midpoint.y
            );
            return new Vec2(cunnormalized.x/contextw, cunnormalized.y/contexth).times(2);
        }else{
            return null;
        }
    }
    // get targetModel(){
    //     return (this.interaction.owner as ASceneNodeController<any>).sceneController.model;
    // }
    /** Whether the event's `target` is the element the listener is attached to (`currentTarget`). */
    get eventIsOnTarget(){
        return this._event.target===this._event.currentTarget;
    }

    get key(){
        return (this.DOMEvent as KeyboardEvent).key;
    }
}


/**
 * Base class for interactions: a named, switchable set of event listeners on one `element` (usually the
 * render canvas, or `document` for keyboard input). Listeners are attached on `activate()` and detached on
 * `deactivate()`; each DOM event is wrapped in an {@link ADOMInteractionEvent} before your callback sees it.
 *
 * Subclasses such as {@link AClickInteraction}, {@link ADragInteraction}, {@link AWheelInteraction}, and
 * {@link AKeyboardInteraction} provide a static `Create(...)` factory. Interactions are normally added to an
 * {@link AInteractionMode}, which activates and deactivates them together.
 */
export class AInteraction extends ACallbackSwitch {
    /** A dictionary for storing arbitrary per-interaction state (e.g. where a drag started). */
    public interactionState:{[name:string]:any}={};
    setInteractionState(name:string, value:any){
        this.interactionState[name]=value;
    }
    getInteractionState(name:string){
        return this.interactionState[name];
    }
    clearInteractionState(){
        this.interactionState={};
    }
    protected _eventListeners:AInteractionEventListener[];

    /** Whatever holds this interaction (usually a scene controller); set by {@link AInteractionMode.addInteraction}. */
    public owner!: HasInteractions;
    /** The object listeners are attached to -- usually a DOM element such as the render canvas, or `document` for keyboard input. */
    // public element: AReceivesInteractionsInterface;
    public element:AReceivesInteractionsInterface;

    /** Used by drag interactions: when true, a pointer-down only starts a drag if `event.onFirstIntersection` is true (always true for DOM events). */
    public onlyOnFirstIntersection:boolean=true;

    /** Override to filter events; return true to skip the callback. Returns false by default. */
    _shouldIgnoreEvent(event:Event|AInteractionEvent){
            return false;
    }

    // static Create(element:any, clickCallback?:CallbackType, handle?:string, ...args:any[]);

    /** Returns the browser `window`. */
    getWindowElement(){
        return window;
    }

    /**
     * The event listeners belonging to this interaction. Often just one, but e.g. a drag uses separate
     * pointer-down, pointer-move, and pointer-up listeners.
     */
    get eventListeners(){return this._eventListeners;};

    /**
     * @param element the object to attach listeners to (see `element`)
     * @param eventListeners optional initial listeners
     * @param handle optional name for the interaction; a random uuid if omitted
     */
    constructor(element:AReceivesInteractionsInterface, eventListeners?:AInteractionEventListener[], handle?:string){
        super(handle);
        this.element = element;
        this._eventListeners = eventListeners?eventListeners:[];
    }

    /** Binds callback methods to this instance; subclasses override. Called by the `Create` factories. */
    bindMethods(){

    }

    /**
     * Creates a listener for `eventType` on `element` and adds it to `eventListeners` (it is attached when the
     * interaction is activated). The callback receives an {@link ADOMInteractionEvent}; events for which
     * `_shouldIgnoreEvent` returns true are skipped.
     * @param eventType the DOM event name
     * @param callback called with the wrapped event
     * @param args if `args[0]` is truthy, the DOM event's default action is prevented (e.g. suppressing the
     * context menu for right clicks)
     * @returns the created listener
     */
    addEventListener(eventType:string, callback:(...args:any[])=>any, ...args:any[]){
        const interaction = this;
        // const modcallbackmock = function(event:AInteractionEvent){
        //     callback(event);
        // }
        const modcallback = function(event:Event){
            if(args[0]) {
                event.preventDefault();
            }
            if(!interaction._shouldIgnoreEvent(event)) {
                callback(new ADOMInteractionEvent(event, interaction));
            }
        }
        function addListener(this:AInteractionEventListener){
            interaction.element.addEventListener(eventType, modcallback);
        }

        function removeListener(this:AInteractionEventListener){
            interaction.element.removeEventListener(eventType, modcallback);
        }
        const eventListener = {eventType:eventType, addListener: addListener, removeListener: removeListener};
        eventListener.addListener = eventListener.addListener.bind(eventListener);
        eventListener.removeListener = eventListener.removeListener.bind(eventListener)
        this.eventListeners.push(eventListener);
        return eventListener;
    }

    /**
     * Like `addEventListener`, but passes `options.once`/`options.capture` through to the DOM, and does not
     * call `_shouldIgnoreEvent` or prevent default. A boolean `options` is treated as no options.
     * @returns the created listener
     */
    addDOMEventListener(eventType: string, callback: (...args: any[]) => any, options?: boolean | AddEventListenerOptions){
        const interaction = this;
        // @ts-ignore
        const once:boolean = ((options!==undefined) && ((typeof options)!=="boolean"))?options.once:false;
        // @ts-ignore
        const capture:boolean = ((options!==undefined) && ((typeof options)!=="boolean"))?options.capture:false;

        let modcallback = function(event:InteractionEventInterface){
            // if(!interaction._shouldIgnoreEvent(event)) {
                callback(new ADOMInteractionEvent(event, interaction));
            // }
        }
        function addListener(){
            // this.active = true;
            // @ts-ignore
            interaction.element.addEventListener(eventType, modcallback, {once:once, capture:capture});
        }
        function removeListener(){
            // this.active=false;
            // @ts-ignore
            interaction.element.removeEventListener(eventType, modcallback, {once:once, capture:capture});
        }
        const eventListener = {eventType:eventType, addListener: addListener, removeListener: removeListener};
        eventListener.addListener = eventListener.addListener.bind(eventListener);
        eventListener.removeListener = eventListener.removeListener.bind(eventListener)
        this.eventListeners.push(eventListener);
        return eventListener;
    };


    /** Attaches all of this interaction's listeners (detaching them first, so they are never attached twice). */
    activate() {
        // if(!this.isActive) {
        this.deactivate();
        for (let eventListener of this.eventListeners) {
            eventListener.addListener();
        }
        this.active = true;
        // }
    }

    _deactivateEventListeners() {
        for (let eventListener of this.eventListeners) {
            eventListener.removeListener();
        }
    }

    /** Detaches and forgets all listeners. */
    clearEventListeners() {
        this._deactivateEventListeners();
        this._eventListeners = [];
    }

    /** Detaches all listeners (they are kept and can be re-attached with `activate()`). */
    deactivate() {
        // if(this.isActive){
        this._deactivateEventListeners();
        this.active = false;
        // }
    }

    /** Deactivates the interaction and discards its listeners. */
    dispose() {
        this.deactivate();
        this._eventListeners = [];
        // super.dispose();
    }
}
