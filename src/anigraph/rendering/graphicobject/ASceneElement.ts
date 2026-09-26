import {AGraphicElement} from "./AGraphicElement";
import type {AGLGraphicObject} from "./AGLGraphicObject";
import * as THREE from "three";


/**
 * Wraps a `THREE.Scene` as a graphic object, keeping a list of member graphics so they can be removed and disposed
 * together.
 */
export class ASceneElement extends AGraphicElement{
    protected _threejs:THREE.Scene;
    protected _members:AGLGraphicObject[]=[];
    /** The member graphics added with `add`. */
    get members(){
        return this._members;
    }

    /** The wrapped `THREE.Scene`. */
    get threejs():THREE.Scene{
        return this._threejs;
    }

    private get _scene(){
        return this._threejs;
    }
    /** Returns the wrapped `THREE.Scene`. */
    getThreeJSScene(){
        return this._scene;
    }

    /** @param threejsObject Scene to wrap; a new `THREE.Scene` is created if omitted. */
    constructor(threejsObject?:THREE.Scene) {
        super();
        if(threejsObject){
            this._threejs = threejsObject;
        }else{
            this._threejs = new THREE.Scene();
        }
        if(this.threejs){
            if(this.threejs.name ==""){
                this.setObject3DName(this.serializationLabel);
            }
        }
    }

    /** Calls `fn` on each member and returns the results. */
    mapOverMembers(fn:(child:AGLGraphicObject)=>any[]|void){
        var rvals = [];
        for(let member of this._members){
            rvals.push(fn(member));
        }
        return rvals;
    }

    /** Adds a member graphic to the scene. */
    add(toAdd:AGLGraphicObject){
        this._members.push(toAdd);
        super.add(toAdd);
    }

    /** Removes a member graphic. Throws if it is not a member. */
    remove(toRemove:AGLGraphicObject){
        for(let c=0; c<this._members.length; c++){
            if(this._members[c].uid===toRemove.uid){
                this._members.splice(c,1);
                super.remove(toRemove);
                return;
            }
        }
        throw new Error(`Tried to remove render object ${toRemove} that is not a member of ${this}`);
    }

    /** Disposes every member, then removes the scene from its parent. */
    dispose() {
        this.mapOverMembers((m:AGLGraphicObject)=>{m.dispose();});
        super.dispose();
    }
}
