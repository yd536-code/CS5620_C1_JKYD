import {AInteraction, AInteractionEvent, AInteractionEventListener, PointerEvents,} from "./AInteraction";
import {CallbackType} from "../basictypes";
import {Vec2} from "../math/linalg/2D/Vec2";


/** Callback for drag start/move/end: receives the wrapped event and the drag interaction. */
export type ADragInteractionCallback = (event:AInteractionEvent, interaction:ADragInteraction)=>any;
// export type ADragSelectionCallback = (interaction:ADragInteraction, currentModelData:GenericDict, event?:any)=>any;

/** An object that provides drag start/move/end callbacks. */
export interface HasDragInteraction{
    dragStartCallback(event:AInteractionEvent, interaction?:ADragInteraction):void;
    dragMoveCallback(event:AInteractionEvent, interaction?:ADragInteraction):void
    dragEndCallback(event:AInteractionEvent, interaction?:ADragInteraction):void
}

/**
 * Base class for pointer-drag interactions. On pointer-down it calls the start callback and attaches
 * pointer-move and (one-time) pointer-up listeners; pointer-move calls the move callback, and pointer-up calls
 * the end callback and stops listening for moves. All three pointer events have their default action prevented.
 * See {@link ADragInteraction} for the usual factory.
 */
export class ADragInteractionBase extends AInteraction{
    public _dragCallbacks:{[name:string]:CallbackType}={};
    public _dragSetCallback!:CallbackType|null;
    public _mouseDownEventListener!:AInteractionEventListener;
    public _mouseMoveEventListener!:AInteractionEventListener;
    public _mouseUpEventListener!:AInteractionEventListener;
    // public dragStartPosition!:Vec2;
    /** The pointer-down event that started the current (or most recent) drag. */
    public dragStartEvent!:AInteractionEvent;
    /** True between pointer-down and pointer-up. */
    public isDragging:boolean=false;

    /** A cursor position stored in `interactionState` under `"CURSOR_START_POSITION"`. Not set automatically -- your callbacks can set and read it. */
    get cursorStartPosition():Vec2{
        return this.getInteractionState("CURSOR_START_POSITION") as Vec2
    }
    set cursorStartPosition(value:Vec2|undefined){
        this.setInteractionState("CURSOR_START_POSITION", value);
    }

    /** The `ndcCursor` at drag start; set automatically by the wrapped start callback (see `setDragStartCallback`). */
    get _cursorStartNDCPosition(){
        return this.getInteractionState("_CURSOR_START_NDC_POSITION")
    }
    set _cursorStartNDCPosition(value:Vec2|null){
        this.setInteractionState("_CURSOR_START_NDC_POSITION", value);
    }


    /** Removes all listeners and clears `interactionState`. */
    dispose(){
        this._removeDragListeners();
        this.clearInteractionState();
        super.dispose();
    }

    /** Rebuilds the drag listeners and attaches the pointer-down listener (move/up are attached when a drag starts). */
    activate(){
        this._removeDragListeners();
        this._addDragListeners();
        this._mouseDownEventListener.addListener();
        this.active = true;
    }

    /** Clears `interactionState` and detaches listeners. */
    deactivate(){
        this.clearInteractionState();
        super.deactivate();
    }

    /**
     * Sets the drag-start callback. It is wrapped so that `_cursorStartNDCPosition` is recorded before
     * `dragStartCallback(event, interaction)` runs; omit it to only record the start position. If the interaction
     * is active, its listeners are rebuilt.
     */
    setDragStartCallback(dragStartCallback?:CallbackType){
        if(this._dragCallbacks===undefined){
            this._dragCallbacks = {};
        }

        this._dragCallbacks['start'] = (event:AInteractionEvent, interaction:ADragInteraction, ...args:any[])=>{
            interaction._cursorStartNDCPosition = event.ndcCursor;
            return dragStartCallback ? dragStartCallback(event, interaction, ...args) : undefined;
        };
        if(this.active){this._updateDragListeners();}
    }

    /** Returns the (wrapped) drag-start callback. */
    getDragStartCallback(){return this._dragCallbacks['start'];}
    /** Calls the drag-start callback with `(event, this)`. */
    callDragStartCallback(event:any){
        return this._dragCallbacks['start'](event, this)
    }

    /** Sets the drag-move callback, called as `(event, interaction)`; omit it to use a no-op. If the interaction is active, its listeners are rebuilt. */
    setDragMoveCallback(dragMoveCallback?:CallbackType){
        if(this._dragCallbacks===undefined){
            this._dragCallbacks = {};
        }
        this._dragCallbacks['move'] = dragMoveCallback ?? ((event:Event)=>{});
        if(this.active){this._updateDragListeners();}
    }
    /** Returns the drag-move callback. */
    getDragMoveCallback(){return this._dragCallbacks['move'];}
    /** Calls the drag-move callback with `(event, this)`. */
    callDragMoveCallback(event:any){
        return this._dragCallbacks['move'](event, this)
    }

    /** Sets the drag-end callback, called as `(event, interaction)`; omit it to use a no-op. If the interaction is active, its listeners are rebuilt. */
    setDragEndCallback(dragEndCallback?:CallbackType){
        if(this._dragCallbacks===undefined){
            this._dragCallbacks = {};
        }
        if(dragEndCallback) {
            this._dragCallbacks['end'] = dragEndCallback;
        }else{
            this._dragCallbacks['end'] = (event:Event)=>{};
        }
        if(this.active){this._updateDragListeners();}
    }
    /** Returns the drag-end callback. */
    getDragEndCallback(){return this._dragCallbacks['end'];}
    /** Calls the drag-end callback with `(event, this)`. */
    callDragEndCallback(event:any){
        return this._dragCallbacks['end'](event, this)
    }

    /** Removes and re-creates the drag listeners (used after a callback changes). */
    _updateDragListeners(){
        this._removeDragListeners();
        this._addDragListeners();
    }
    _removeDragListeners(){
        this.clearEventListeners();
    }
    /** Creates the pointer-down, pointer-move, and pointer-up listeners. Only pointer-down is attached here. */
    _addDragListeners(){
        if(this._dragSetCallback===undefined){
            this._dragSetCallback=null;
        }
        if(this._dragSetCallback!==null){
            this._removeDragListeners();
        }
        const interaction = this;
        const self = this;

        function dragmovingcallback(event:AInteractionEvent) {
            event.preventDefault();
            interaction.callDragMoveCallback(event);
        }
        // if(this.element instanceof THREE.Object3D) {
        //     self._mouseMoveEventListener = self.addSceneEventListener(PointerEvents.POINTER_MOVE, dragmovingcallback);
        // }else{
            // element is a DOM element...
        self._mouseMoveEventListener =self.addDOMEventListener(PointerEvents.POINTER_MOVE, dragmovingcallback);
        // }

        function dragendcallback(event:AInteractionEvent) {
            event.preventDefault();
            interaction.callDragEndCallback(event);
            self._mouseMoveEventListener.removeListener();
            self.isDragging = false;
            // interaction.dragStartEvent = undefined;
            // startCallback();
        }

        self._mouseUpEventListener =self.addDOMEventListener(PointerEvents.POINTER_UP, dragendcallback, {once:true});

        // self._mouseUpEventListener = self.addWindowEventListener(PointerEvents.POINTER_UP, dragendcallback);


        this._dragSetCallback = function(event:AInteractionEvent){
            if(self.onlyOnFirstIntersection && !event.onFirstIntersection){
                event.preventDefault();
            }else{
                event.preventDefault();
                if(!self._shouldIgnoreEvent(event._event)){
                    interaction.callDragStartCallback(event);
                    interaction.dragStartEvent = event;
                    interaction.isDragging = true;
                    self._mouseMoveEventListener.addListener();
                    self._mouseUpEventListener.addListener();
                }
            }
        }

        // startCallback();
        if(interaction._dragSetCallback) {
            self._mouseDownEventListener = self.addEventListener(PointerEvents.POINTER_DOWN, interaction._dragSetCallback);
        }
    }
}

/** A pointer-drag interaction; create one with {@link ADragInteraction.Create}. */
export class ADragInteraction extends ADragInteractionBase{
    /**
     * Creates a drag interaction on `element` with the given callbacks. Add the result to an interaction mode
     * (e.g. with `addInteraction`) to activate it.
     *
     * @param element the DOM element to listen on (usually the render canvas)
     * Any callback may be `undefined`; a missing one does nothing.
     * @param dragStartCallback called on pointer-down (optional)
     * @param dragMoveCallback called on each pointer-move while dragging (optional)
     * @param dragEndCallback called on pointer-up (optional)
     * @param handle optional name for the interaction; usually left out
     * @returns the new interaction
     */
    static Create(element:any,
                  dragStartCallback?:ADragInteractionCallback,
                  dragMoveCallback?:ADragInteractionCallback,
                  dragEndCallback?:ADragInteractionCallback,
                  handle?:string){
        const interaction = new this(element, undefined, handle);
        interaction.setDragStartCallback(dragStartCallback);
        interaction.setDragMoveCallback(dragMoveCallback);
        interaction.setDragEndCallback(dragEndCallback);
        interaction.bindMethods();
        //Finally, return the interaction
        return interaction;
    }
}
