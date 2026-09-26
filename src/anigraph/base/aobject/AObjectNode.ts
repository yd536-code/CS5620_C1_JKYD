import {AObject, AObjectState} from "./AObject";
import {ASerializable} from "../aserial";
import {ref} from "valtio";

/** Events an {@link AObjectNode} signals when the tree it belongs to changes. */
export enum AObjectNodeEvents{
    // Descendant Events
    /** Signaled on a node when it gets a new parent (or is removed from its parent). Listeners get `(newParent, oldParent)`. */
    NewParent = 'NewParent',
    /** Signaled on a node (and, in turn, each of its descendants) when its root changes. */
    NewRoot = 'NewRoot',

    //Ancestor Events
    /** Signaled on a parent when a child is added, with the child. */
    NewChild = 'NewChild',
    /** Signaled on every ancestor of a newly added child, with the child. */
    DescendantAdded = 'DescendantAdded',
    /** Signaled on a parent after a child is removed, with the child. */
    ChildRemoved = 'ChildRemoved',
    /** Signaled on the former parent and each of its ancestors when a child is removed, with the child. */
    DescendantRemoved = 'DescendantRemoved',
    /** Signaled on each (former) ancestor of a node when the node is released, with the node. */
    DescendantReleased='DescendantReleased'
}

/**
 * An {@link AObject} that is also a node in a tree: it has a `name`, a `parent`, `children`, and a `root`, and it
 * signals {@link AObjectNodeEvents} when the tree changes. This is the base class of models (and so of the scene
 * graph) and of controllers.
 */
@ASerializable("AObjectNode")
export class AObjectNode extends AObject{
    /** The node's children (reactive state). Use `addChild`/`removeChild` rather than editing it directly. */
    @AObjectState public _children:AObjectNode[];
    /** Display name; defaults to the class's label. */
    @AObjectState public name!: string;
    /** The node's children. */
    get children(){
        return this._children;
    }

    protected _parent!:AObjectNode|null;
    protected _root!:AObjectNode;

    /**
     * Which space this node belongs to (`'2D'` or `'3D'`), or `undefined` if it isn't tied to one (e.g.
     * `AModelGraph`, plain `AObjectNode`/`AModel` instances). `ANodeModel2D`/`ANodeModel3D` override this, and
     * `_addChild` refuses to parent two nodes whose `nodeSpace`s disagree, so 2D and 3D node models can't be mixed
     * in one tree. (A getter is used instead of `instanceof` checks because this file can't import the node model
     * classes without a circular import.)
     */
    get nodeSpace():'2D'|'3D'|undefined{
        return undefined;
    }

    /** The top node of the tree this node is in (the node itself if it has no parent). */
    get root(){
        return this._root;
    }
    /** Sets the root of this node and all its descendants, signaling `NewRoot` on each one whose root changes. */
    set root(node:AObjectNode){
        if(this._root.uid===node.uid){
            return;
        }else{
            this._root = node;
            this.signalEvent(AObjectNodeEvents.NewRoot);

            // set all the children HelperClasses' roots, which will cause them to set their children HelperClasses' root...
            this.mapOverChildren((child:AObjectNode)=>{
                child.root = node;
            })
        }
    }

    /** Like the `root` setter, but without signaling `NewRoot`. */
    protected _setRootSilent(node:AObjectNode){
        if(this._root.uid===node.uid){
            return;
        }else{
            this._root = node;
            // set all the children HelperClasses' roots, which will cause them to set their children HelperClasses' root...
            this.mapOverChildren((child:AObjectNode)=>{
                child._setRootSilent(node);
            })
        }
    }


    /**
     * @param name display name; defaults to the class's label (`serializationLabel`).
     */
    constructor(name?: string){
        super();
        this.name = name ? name : this.serializationLabel;
        // @ts-ignore
        this._children = (this.children===undefined)?[]:this.children;
        this._root = this._root??(this._parent??this);
        // @ts-ignore
        this._parent = (this._parent===undefined)?null:this._parent;


    }

    /**
     * Adds a listener for this node's `NewParent` event, called as `(newParent, oldParent)`. When the node is added
     * to a parent, the callback gets `(newParent, undefined)`. When the node is removed from its parent, it gets
     * `(null, oldParent)`.
     * @param callback called with the new parent and the old parent
     * @param handle optional identifier for the listener
     * @param synchronous kept for compatibility with the state-listener methods. Events are always delivered
     * synchronously: the callback runs before `addChild`/`removeChild` returns.
     */
    addNewParentListener(callback:(newParent?:AObjectNode|null, oldParent?:AObjectNode)=>void, handle?:string, synchronous:boolean=true){
        return this.addEventListener(AObjectNodeEvents.NewParent, callback, handle);
    }

    /**
     * Adds a listener for this node's `ChildRemoved` event (called with the removed child).
     * @param callback called with the removed child
     * @param handle optional identifier for the listener
     * @param synchronous kept for compatibility with the state-listener methods. Events are always delivered
     * synchronously: the callback runs before `removeChild` returns.
     */
    addChildRemovedListener(callback:(child:AObjectNode)=>void, handle?:string, synchronous:boolean=true){
        return this.addEventListener(AObjectNodeEvents.ChildRemoved, callback, handle);
    }


    /** Signals this node's `NewParent` event with the given arguments. */
    signalNewParent(newParent?:AObjectNode, oldParent?:AObjectNode){
        this.signalEvent(AObjectNodeEvents.NewParent, newParent, oldParent);
    }

    /**
     * Adds `child` as a child of this node, optionally without signaling some events. With both flags on, it
     * signals `NewParent` on the child (and `NewRoot` on the child and its descendants), `NewChild` on this node
     * (always signaled), and `DescendantAdded` on each of the child's new ancestors.
     *
     * Throws if `child` is already a child of this node, if it already has a parent (remove it first, or use
     * `reparent`), or if this node and the child have different `nodeSpace`s (2D vs. 3D).
     * @param child the node to add
     * @param position index to insert the child at; appended at the end if omitted
     * @param signalChildEvents whether to signal `NewParent`/`NewRoot` on the child and its descendants
     * @param signalAncestorEvents whether to signal `DescendantAdded` on the ancestors
     * @param args extra arguments passed along with the `DescendantAdded` events
     */
    _addChild(child:AObjectNode, position?:number, signalChildEvents:boolean=true, signalAncestorEvents:boolean=true, ...args:any[]){
        // Check if child is already in children
        if(this.children.includes(child)){
            throw new Error(`Tried to add existing child ${child} to node ${this}`);
        }

        // If child already has a parent this is a problem: we should have dealt with that elsewhere
        if(child.parent){
            throw new Error(`Child ${child} already has parent ${child.parent} when trying to add as child of ${this}`);
        }else{
            // Space check (2D vs 3D), resolved here rather than on `AModelGraph.addChild`: this is the one place
            // every `addChild` -- graph-root or node-to-node, at any depth -- funnels through, so checking the
            // immediate edge on every call transitively keeps any connected subtree of space-tagged nodes
            // homogeneous, not just direct children of the graph root. A node with no `nodeSpace` (the graph root
            // itself, a plain `AObjectNode`) is compatible with anything; only two *disagreeing* tags reject.
            if(this.nodeSpace && child.nodeSpace && this.nodeSpace!==child.nodeSpace){
                throw new Error(`Cannot add ${child.nodeSpace} node ${child} as a child of ${this.nodeSpace} node ${this}: mixing 2D and 3D node models is not supported.`);
            }
            child._parent=this;
            if(signalChildEvents) {
                child.signalNewParent(this)
                child.root = this.root;
            }else{
                child._setRootSilent(this.root);
            }
        }
        if(position!==undefined){
            this.children.splice(position, 0, ref(child));
        }else{
            this.children.push(ref(child));
        }
        this.signalEvent(AObjectNodeEvents.NewChild, child);
        if(signalAncestorEvents) {
            child.mapOverAncestors((ancestor:AObjectNode)=>{
                ancestor.signalEvent(AObjectNodeEvents.DescendantAdded, child, ...args);
            })
        }
    }

    /**
     * Adds `child` as a child of this node, signaling all events (see `_addChild`). Throws if the child already has
     * a parent; remove it first or use `reparent`.
     * @param child the node to add
     * @param position index to insert the child at; appended at the end if omitted
     * @param args extra arguments passed along with the `DescendantAdded` events
     */
    addChild(child:AObjectNode, position?:number, ...args:any[]){
        return this._addChild(child, position, true, true, ...args);
    }

    /** This node's parent, or `null` if it has none. */
    public get parent():AObjectNode|null{
        return this._parent;
    };

    /** Calls `fn` on each child and returns the list of results. */
    mapOverChildren(fn:(child:AObjectNode)=>any[]|void){
        var rvals = [];
        for(let child of this.children){
            rvals.push(fn(child));
        }
        return rvals;
    }

    /** Calls `fn` on each ancestor, from the parent up to the root, and returns the list of results. */
    mapOverAncestors(fn:(ancestor:AObjectNode)=>any[]|void){
        var rvals = [];
        let parent = this.parent;
        let lastParent = (this as AObjectNode);
        while(parent && (parent!==lastParent)){
            rvals.push(fn(parent));
            lastParent = parent;
            parent = parent.parent;
        }
        return rvals;
    }

    /** Returns this node's ancestors, from the parent up to the root. */
    getAncestorList(){
        var rvals = [];
        let parent = this.parent;
        let lastParent = (this as AObjectNode);
        while(parent && (parent!==lastParent)){
            rvals.push(parent);
            lastParent = parent;
            parent = parent.parent;
        }
        return rvals;
    }

    /** Returns all descendants of this node (not including itself), in depth-first preorder. */
    getDescendantList(){
        const rval:AObjectNode[] = [];
        this.mapOverChildren((c:AObjectNode)=>{
            rval.push(c);
            for(let cc of c.getDescendantList()){
                rval.push(cc);
            };
        })
        return rval;
    }

    /** Returns the children for which `fn` returns true. */
    filterChildren(fn:(child:AObjectNode, index?:number, array?:AObjectNode[])=>boolean){
        return this.children.filter(fn);
    }

    /** Returns the descendants (see `getDescendantList`) for which `fn` returns true. */
    filterDescendants(fn:(child:AObjectNode, index?:number, array?:AObjectNode[])=>boolean){
        return this.getDescendantList().filter(fn);
    }

    /** Calls `fn` on each descendant (see `getDescendantList`) and returns the list of results. */
    mapOverDescendants(fn:(descendant:AObjectNode)=>any[]|void){
        return this.getDescendantList().map(fn);
    }

    /**
     * Releases this node and its whole subtree: releases the children, removes this node from its parent
     * (signaling `DescendantRemoved` on the former ancestors), signals `DescendantReleased` on those ancestors, and
     * then does the {@link AObject.release} cleanup.
     */
    release(...args:any[]){
        this.releaseChildren(...args)
        // Capture ancestors BEFORE `_removeChild` sets `_parent` to null
        // below; after that, `getAncestorList` would find none and
        // `DescendantReleased` would never reach the graph (whose
        // `AModelGraph._releaseModel` listener cleans up the model map and
        // the scene views).
        //
        // The signal is still sent *after* `_removeChild`, so ancestors hear
        // `DescendantRemoved` before `DescendantReleased`.
        // `AGLSceneView.onModelNodeRemoved` relies on that order: it expects
        // the node's view to still be registered when the node is removed,
        // and the view is only disposed afterward, on release.
        //
        // `DescendantReleased` only reaches the graph while this node is still attached to it. A node released
        // after being detached is cleaned up instead through `AModelGraph`'s watch on each registered model's own
        // `RELEASE` event (`AModelGraph._watchForRelease`).
        const ancestors = this.getAncestorList();
        if(this._parent!==null){
            this._parent._removeChild(this);
        }
        let self = this;
        for(const ancestor of ancestors){
            ancestor.signalEvent(AObjectNodeEvents.DescendantReleased, self);
        }
        super.release();
        //would do super.release(args) here...
    }


    /**
     * Removes `child` from this node, optionally without signaling some events. With both flags on, it signals
     * `NewParent` on the child (with arguments `(null, this node)`, i.e. no new parent and this node as the old one), `NewRoot` on the child and its descendants (the
     * child becomes its own root), `DescendantRemoved` on this node and each of its ancestors, and finally
     * `ChildRemoved` on this node (always signaled). Throws if `child` is not a child of this node.
     * @param child the child to remove
     * @param signalDescendantEvents whether to signal `NewParent`/`NewRoot` on the child and its descendants
     * @param signalAncestorEvents whether to signal `DescendantRemoved` on this node and its ancestors
     * @private
     */
    _removeChild(child:AObjectNode, signalDescendantEvents:boolean=true, signalAncestorEvents:boolean=true,){
        for(let c=0;c<this.children.length;c++){
            if(this.children[c].uid===child.uid){
                this.children.splice(c,1);
                child._parent = null;
                if(signalDescendantEvents){
                    child.signalEvent(AObjectNodeEvents.NewParent, null, this);
                    child.root = child;
                }else{
                    child._setRootSilent(child);
                }
                if(signalAncestorEvents) {
                    this.signalEvent(AObjectNodeEvents.DescendantRemoved, child);
                    this.mapOverAncestors((ancestor: AObjectNode) => {
                        ancestor.signalEvent(AObjectNodeEvents.DescendantRemoved, child);
                    })
                }
                this.signalEvent(AObjectNodeEvents.ChildRemoved, child);
                return;
            }
        }
        throw new Error(`Tried to remove node ${child} that is not a child of ${this}`);
    }

    /**
     * Removes `child` from this node, signaling all events (see `_removeChild`). The child is not released. Throws
     * if `child` is not a child of this node.
     */
    removeChild(child:AObjectNode){
        return this._removeChild(child, true, true);
    }

    /**
     * Releases all of this node's children (see `release`).
     * @param args passed to each child's `release`
     */
    releaseChildren(...args:any[]){
        return this.mapOverChildren((child:AObjectNode)=>{return child.release(...args);});
    }

    /**
     * Removes all children from this node without releasing them.
     */
    removeChildren(){
        const self = this;
        return this.mapOverChildren((child:AObjectNode)=>{self.removeChild(child);});
    }


    /**
     * Rebuilds a node from saved data (see {@link AObject.fromJSON}) and reconnects its tree: each child's
     * `parent` is set to the new node, and every descendant's `root` is set to it.
     */
    static fromJSON(state_dict:{[name:string]:any}){
        // `_children`'s revived elements must be `ref()`-wrapped *before*
        // they are assigned into the new instance's (valtio) `state`, just
        // like `_addChild` does. A class instance assigned into state without
        // `ref()` gets deep-proxied by valtio, and the raw object can't be
        // cleanly recovered from the proxy afterward (even later plain
        // assignments onto it, like `_parent`, would end up holding proxies).
        const rawChildren: AObjectNode[] = state_dict['_children'] ?? [];
        const stateForConstruction = {
            ...state_dict,
            _children: rawChildren.map((c: AObjectNode) => ref(c)),
        };
        const rval = (this.CreateWithState(stateForConstruction) as AObjectNode);

        // Direct children's `_parent`. Each level's `fromJSON` sets its own
        // direct children's `_parent`, and revival runs bottom-up (an inner
        // node's `fromJSON` finishes before its parent's), so this covers
        // every depth without a full-subtree walk.
        rval.mapOverChildren((c: AObjectNode) => {
            c._parent = rval;
        });

        // `_root`, unlike `_parent`, must point at the top of the whole
        // tree, which an inner node's `fromJSON` can't know. So every level
        // stamps its entire subtree with itself; the outermost call runs
        // last and reaches every node, so its value is the one that stays.
        for (const descendant of rval.getDescendantList()) {
            descendant._root = rval;
        }

        return rval;
    }
    // toJSON() is inherited from AObject.


    //##################//--Reparenting--\\##################
    //<editor-fold desc="Reparenting">

    /** Returns the child with the given uid, or `undefined` if this node has no such child. */
    getChildWithID(uid:string){
        for(let c=0;c<this.children.length;c++){
            if(this.children[c].uid===uid){
                return this.children[c];
            }
        }
    }

    /** Maps a list of child uids to the children themselves; throws on a uid that isn't a child's. */
    _uidsToChildrenList(uidList:string[]){
        let aon_array:AObjectNode[] = [];
        for(let uid of uidList){
            let child = this.getChildWithID(uid);
            if(child) {
                aon_array.push(child);
            }else{
                throw new Error(`unrecognized child uid: ${uid}`);
            }
        }
        return aon_array;
    }

    /** Maps a list of nodes to their uids. */
    _childrenListToUIDs(childrenList:AObjectNode[]){
        let rval:string[]= [];
        for(let c of childrenList){
            rval.push(c.uid);
        }
        return rval;
    }

    /**
     * Moves the children with the given uids, in the order listed, to the end of the children list (so listing
     * every child's uid puts the children in that order). Each child is removed and re-added with `reparent`,
     * without child events but with ancestor events. Throws on a uid that isn't a child's.
     */
    reorderChildren(uidList:string[]){
        for(let uid of uidList){
            let child = this.getChildWithID(uid);
            if(child){
                child.reparent(this, false);
            }else{
                throw new Error ("Tried to reorder children with uid that does not belong to parent.")
            }
        }
    }

    /**
     * Removes this node from its current parent (if any) and adds it as the last child of `newParent`. By default
     * both kinds of events are signaled (see `_removeChild` and `_addChild`).
     * @param newParent the new parent
     * @param signalDescendantEvents whether to signal `NewParent`/`NewRoot` on this node and its descendants
     * @param signalAncestorEvents whether to signal `DescendantRemoved`/`DescendantAdded` on the old and new ancestors
     * @param args extra arguments passed along with the `DescendantAdded` events
     */
    reparent(newParent:AObjectNode, signalDescendantEvents:boolean=true, signalAncestorEvents:boolean=true, ...args:any[]){
        if(this.parent){
            this.parent._removeChild(this, signalDescendantEvents, signalAncestorEvents);
        }
        newParent._addChild(this, undefined, signalDescendantEvents, signalAncestorEvents, ...args);
    }
    //</editor-fold>
    //##################\\--Reparenting--//##################


}
