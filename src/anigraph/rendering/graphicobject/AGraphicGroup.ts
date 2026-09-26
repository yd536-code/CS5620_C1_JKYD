import * as THREE from "three";
import {AGLGraphicObject} from "./AGLGraphicObject";
import {ALabel} from "../../base";


/**
 * A Three.js graphic that holds other graphics. Wraps a `THREE.Group` (or a given `Object3D`) and keeps a list of
 * member graphics so they can be removed and disposed together.
 */
@ALabel("AGraphicGroup")
export class AGraphicGroup extends AGLGraphicObject{
    protected _threejs:THREE.Object3D;

    /** The wrapped Three.js object. */
    get threejs(){
        return this._threejs;
    }
    protected members:AGLGraphicObject[]=[];
    /** @param threejsObject Object to wrap; a new `THREE.Group` is created if omitted. Its `matrixAutoUpdate` is turned off. */
    constructor(threejsObject?:THREE.Object3D) {
        super();
        // this._threejs = new THREE.Group();
        if(threejsObject){
            this._threejs = threejsObject;
        }else{
            this._threejs = new THREE.Group();
        }
        this._threejs.matrixAutoUpdate=false;
        if(this.threejs){
            if(this.threejs.name ==""){
                this.setObject3DName(this.serializationLabel);
            }
        }
    }

    /** Calls `fn` on each member and returns the results. */
    mapOverMembers(fn:(child:AGLGraphicObject)=>any[]|void){
        var rvals = [];
        for(let member of this.members){
            rvals.push(fn(member));
        }
        return rvals;
    }

    /** Adds a member graphic. */
    add(toAdd:AGLGraphicObject){
        this.members.push(toAdd);
        super.add(toAdd);
    }

    /** Removes a member graphic. Throws if it is not a member. */
    remove(toRemove:AGLGraphicObject){
        for(let c=0;c<this.members.length;c++){
            if(this.members[c].uid===toRemove.uid){
                this.members.splice(c,1);
                // this.onExit(toRemove);
                // this.threejs.remove(toRemove.threejs);
                super.remove(toRemove);
                return;
            }
        }
        throw new Error(`Tried to remove render object ${toRemove} that is not a member of ${this}`);
    }



    /** Disposes every member, then removes this group from its parent. */
    dispose() {
        this.mapOverMembers((m:AGLGraphicObject)=>{m.dispose();});
        super.dispose();
    }

}



// constructor() {
//     super();
//     this.members=new ASelection<AGraphicObject>(
//         [],
//         (o:AGraphicObject)=>{
//             this.threejs.add(o.threejs);
//         },
//         (o:AGraphicObject)=>{return;},
//         (o:AGraphicObject)=>{
//             this.threejs.remove(o.threejs);
//         }
//     );
// }
// dispose(){
//     super.dispose();
//     let memberList = this.members.items();
//     this.members.set();
//     for(let m of memberList){
//         m.dispose();
//     }
// }
//
// add(obj:AGraphicObject){
//     this.members.push(obj);
//     this.threejs.add(obj.threejs);
// }
//
// remove(obj:AGraphicObject){
//
// }
