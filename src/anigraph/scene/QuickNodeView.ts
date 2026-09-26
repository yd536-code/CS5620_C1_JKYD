import {AGLNodeView, NodeViewCallback} from "./nodeView";
import {ANodeModel} from "./nodeModel";

/**
 * A Three.js node view whose `init`, `update`, and `dispose` behavior comes from callbacks instead of a subclass.
 * Handy for quick one-off views. Create one with `QuickNodeView.Create(model, init, update, dispose)`.
 *
 * Every callback is optional: a method whose callback was left out simply does nothing extra (`dispose()` still
 * does the standard `AGLNodeView` cleanup).
 */
export class QuickNodeView extends AGLNodeView{
    protected _initCallback?:NodeViewCallback;
    protected _updateCallback?:NodeViewCallback;
    protected _disposeCallback?:NodeViewCallback;

    /** Calls the init callback with this view, if there is one. */
    init(){
        this._initCallback?.(this);
    }

    /** Calls the update callback with this view, if there is one. */
    update(){
        this._updateCallback?.(this);
    }

    /**
     * Disposes the view's graphics and detaches its Three.js object (see `AGLNodeView.dispose`), then calls the
     * dispose callback, if there is one.
     */
    dispose() {
        super.dispose();
        this._disposeCallback?.(this);
    }

    /**
     * If `model` is given, `init` is required (the constructor throws otherwise) and the view is connected to the
     * model immediately.
     */
    constructor(model?:ANodeModel, init?:NodeViewCallback, update?:NodeViewCallback, dispose?:NodeViewCallback){
        super();
        if(model && (init===undefined)){
            throw new Error("If a model is passed to the QuickNodeView constructor, you must also pass an init function")
        }
        if(init){this._initCallback = init;}
        if(update){this._updateCallback = update;}
        if(dispose){this._disposeCallback = dispose;}
        if(model) {
            this.setModel(model);
        }
    }

    /** Creates a view with the given callbacks and connects it to `model`. */
    static Create(model:ANodeModel, init:NodeViewCallback, update?:NodeViewCallback, dispose?:NodeViewCallback){
        let newView = new QuickNodeView();
        newView._initCallback = init;
        if(update){newView._updateCallback = update;}
        if(dispose){newView._disposeCallback = dispose;}
        newView.setModel(model);
        return newView;
    }
}

