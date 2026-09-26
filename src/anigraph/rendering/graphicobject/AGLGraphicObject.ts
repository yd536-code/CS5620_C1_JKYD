import * as THREE from "three";
import {Color, Mat3, Mat4, TransformationInterface, Vec3} from "../../math";
import {AMaterial} from "../material";
import {ALabel, GetClassLabel} from "../../base";
import type {AGraphicObject} from "./AGraphicObject";

/** Anything that wraps a Three.js `Object3D`. */
export interface HasThreeJSObject{
    threejs:THREE.Object3D;
}


/**
 * Base class for Three.js graphic objects: the visual pieces a node view adds to the Three.js scene. Wraps one
 * `THREE.Object3D` (`threejs`) and implements {@link AGraphicObject}. Transforms are written straight into the
 * object's `matrix` (`setTransform`, `setMatrix`), so subclasses normally turn off Three.js's `matrixAutoUpdate`.
 */
@ALabel("AGLGraphicObject")
export abstract class AGLGraphicObject implements AGraphicObject, HasThreeJSObject{
    /**
     * The Three.js object that gets added to the scene.
     */
    abstract get threejs():THREE.Object3D;

    /** Does nothing at this level. */
    onMaterialUpdate(newMaterial:AMaterial, ...args:any[]){
        // console.log("Material Update!")
    }
    /** If `newMaterial` is an {@link AMaterial} and `threejs` is a `THREE.Mesh`, swaps in its Three.js material. */
    onMaterialChange(newMaterial:AMaterial|Color, ...args:any[]){
        if(newMaterial instanceof AMaterial && this.threejs instanceof THREE.Mesh){
            (this.threejs as THREE.Mesh).material = newMaterial._material;
        }
    }
    /** Does nothing at this level; subclasses such as {@link AGraphicElement} override it. */
    setColor(color:Color){
    }

    /**
     * Does nothing at this level; subclasses with wireframe-capable materials
     * (e.g. {@link AGraphicElementBase}) override it.
     */
    setWireframe(value:boolean){
    }


    /** Sets the Three.js object's `name` (handy when inspecting the scene). */
    setObject3DName(name:string){
        this.threejs.name = name;
    }

    // get eventHandler(){return this.threejs;}

    /** Writes `mat` into the Three.js object's `matrix`. A `Mat3` is first converted with `Mat4.From2DMat3`. */
    setMatrix(mat:Mat3|Mat4){
        if(mat instanceof Mat3){
            Mat4.From2DMat3(mat).assignTo(this.threejs.matrix);;
        }else{
            mat.assignTo(this.threejs.matrix);
        }

    }

    /** Returns the Three.js object's `matrix` as a `Mat4`. */
    getMatrix(){
        return Mat4.FromThreeJS(this.threejs.matrix);
    }

    /** The Three.js object's `uuid`. */
    get uid(){
        return this.threejs.uuid;
    }

    /** Adds another graphic's Three.js object as a child of this one. */
    add(toAdd:AGLGraphicObject){
        this.threejs.add(toAdd.threejs);
    }
    /** Removes a child graphic's Three.js object. */
    remove(toRemove:AGLGraphicObject){
        this.threejs.remove(toRemove.threejs);
    }

    /** This graphic's class's own label (see `GetClassLabel`), used as its default three.js object name. */
    get serializationLabel(): string {
        return GetClassLabel(this.constructor);
    }

    /** Whether the Three.js object is visible. */
    set visible(value){this.threejs.visible = value;}
    get visible(){return this.threejs.visible;}

    /** Writes `T.getMatrix()` into the Three.js object's `matrix` (a 2D `Mat3` is converted to a `Mat4` first). */
    public setTransform(T:TransformationInterface){
        let mat = T.getMatrix();
        if(mat instanceof Mat3){
            mat = Mat4.From2DMat3(mat);
        }
        (mat as Mat4).assignTo(this.threejs.matrix);
    };

    /**
     * Like `setTransform`, but also sets the z translation (`elements[11]`) to `depth`, e.g. to layer 2D objects.
     */
    public setTransform2D(T:TransformationInterface, depth:number){
        let mat = T.getMatrix();
        if(mat instanceof Mat3){
            mat = Mat4.From2DMat3(mat);
        }
        mat.elements[11]=depth;
        (mat as Mat4).assignTo(this.threejs.matrix);
    };

    /** Removes the Three.js object from its parent. */
    dispose(){
        if(this.threejs){
            // this._mesh.dispose();
            this.threejs.parent?.remove(this.threejs);
        }

    }
}
