/**
 * @file Graphic elements: Three.js graphic objects that own a geometry and a material.
 * @author Abe Davis
 */

import * as THREE from "three";
import {Color} from "../../math";
import {VertexArray, VertexArray2D, VertexArray3D} from "../../geometry";
import {AGLGraphicObject} from "./AGLGraphicObject";
import {AMaterial} from "../material";
import {ALabel} from "../../base";


/**
 * Base class for Three.js graphic objects that own a `THREE.BufferGeometry` and a material. Adds material helpers
 * and disposes the geometry and material along with the object.
 */
@ALabel("AGraphicElementBase")
export abstract class AGraphicElementBase extends AGLGraphicObject{
    /** Removes the object from its parent and disposes its geometry and material(s). */
    dispose(){
        super.dispose();
        if(this.geometry){
            this.geometry.dispose();
        }
        // TODO Material management
        if(this.material){
            if(Array.isArray(this.material)){
                for(let mat of this.material){
                    mat.dispose();
                }
            }else{
                this.material.dispose();
            }
        }
    }
    /** The Three.js geometry. */
    abstract get geometry():THREE.BufferGeometry;
    /** The Three.js material (or materials). */
    abstract get material():THREE.Material|THREE.Material[];

    /**
     * Sets a property on the Three.js material. Three.js colors/vectors are copied into the existing property with
     * `.set(value)`; numbers and strings are assigned directly.
     * Throws if the material has no property called `name`, or if `value` is some other type.
     */
    setMaterialAttribute(name:string, value:any){
        if(name in this.material){
            if(value instanceof THREE.Color || value instanceof THREE.Vector2||value instanceof THREE.Vector3||value instanceof THREE.Vector4){
                // @ts-ignore
                this.material[name].set(value);
            }else if (typeof value === 'number' || typeof value === 'string'){
                // @ts-ignore
                this.material[name]=value;
            }else{
                throw new Error(`Not sure how to set "${name}" attribute on material: ${this.material}`);
            }
        }else{
            throw new Error(`tried to set "${name}" attribute on material with no such attribute: ${this.material}`);
        }
    }

    /** Turns wireframe rendering on or off, if the material supports it. */
    setWireframe(value:boolean){
        if('wireframe' in this.material) {
            this.material.wireframe = value;
        }
    }

    /**
     * Converts the accepted material parameter types to a Three.js material: an {@link AMaterial} gives its
     * `threejs` material; a `Color`/`THREE.Color` gives a new transparent, double-sided `MeshBasicMaterial`
     * (opacity from the color's alpha); a Three.js material (or array) is returned as is.
     */
    static _GetMaterialFromParam(material:Color|THREE.Color|THREE.Material|THREE.Material[]|AMaterial){
        if(material instanceof AMaterial){
            return material.threejs;
        }
        // TO_DO probably should manage material creation better here
        if(material instanceof Color || material instanceof THREE.Color){
            let threecolor = (material instanceof Color)?material.asThreeJS():material;
            let opacity = (material instanceof Color)?material.a:1.0;
            return new THREE.MeshBasicMaterial(
                {
                    color: threecolor,
                    transparent:true,
                    opacity:opacity,
                    side: THREE.DoubleSide,
                    depthWrite: true
                });
        }else{
            return material;
        }
    }
}

/**
 * A Three.js graphic object built from a geometry and a material, normally rendered as a `THREE.Mesh`
 * (`element`). Geometry can be given as a `THREE.BufferGeometry` or an AniGraph {@link VertexArray}; the material as
 * an {@link AMaterial}, a Three.js material, or a color. Many of the graphics in `rendering/graphicelements`
 * extend this class.
 */
@ALabel("AGraphicElement")
export class AGraphicElement extends AGraphicElementBase{
    _geometry!:THREE.BufferGeometry;
    _material!:THREE.Material|THREE.Material[];
    _element!:THREE.Object3D;
    /** The Three.js geometry. */
    get geometry(): THREE.BufferGeometry {
        return this._geometry;
    }
    /** The Three.js material (or materials). */
    get material(): THREE.Material|THREE.Material[]{
        return this._material;
    }
    /** The Three.js object added to the scene (the same object as `element`). */
    get threejs(){
        return this._element;
    }

    /** Swaps in `newMaterial`'s Three.js material. */
    onMaterialChange(newMaterial:AMaterial){
        this.setMaterial(newMaterial.threejs);
    }

    /** The rendered object, typed as a `THREE.Mesh`. */
    get element():THREE.Mesh{
        return this._element as THREE.Mesh;
    }

    /**
     * Creates an element and builds its Three.js mesh right away.
     * Throws if the geometry or material is missing.
     * @param geometry Geometry as a `THREE.BufferGeometry` or a `VertexArray`.
     * @param material Material, Three.js material, or color.
     * @param args Extra arguments passed to the constructor.
     */
    static Create(
        geometry?:THREE.BufferGeometry|VertexArray<any>,
        material?:Color|THREE.Color|THREE.Material|THREE.Material[]|AMaterial,
        ...args:any[]){
        let newElement = new this(geometry, material, ...args);
        // newElement.init();
        newElement._initIfNotAlready();
        return newElement;
    }

    /** Creates an element whose geometry is a unit square in the xy plane, centered at the origin, with texture coordinates (`VertexArray3D.SquareXYUV()`). */
    static CreateSimpleQuad(material:AMaterial, ...args:any[]){
        let newElement = new this(VertexArray3D.SquareXYUV(), material, ...args);
        newElement._initIfNotAlready();
        return newElement;
    }




    /**
     * Sets the material's `color` property (as on `MeshBasicMaterial` or `MeshStandardMaterial`) and, for a
     * `Color`, its opacity (from `color.a`). If the material has no `color` property (e.g. a custom shader
     * material), only the opacity changes.
     */
    setColor(color:Color|THREE.Color){
        if('color' in this.material) {
            this.setMaterialAttribute('color', (color instanceof Color) ? color.asThreeJS() : color);
        }
        if(color instanceof Color) {
            this.setMaterialAttribute('opacity', color.a);
        }
    }



    /** Sets the material's `opacity`. */
    setOpacity(opacity:number) {
        this.setMaterialAttribute('opacity', opacity);
    }

    /**
     * Sets the geometry from a vertex array. A `VertexArray2D` goes to the subclass's `setVerts2D` when it has one;
     * everything else goes to `setGeometry`. Subclasses may build procedural geometry from the vertices instead of
     * using them directly.
     */
    setVerts(verts:VertexArray<any>){
        if(verts instanceof VertexArray2D && 'setVerts2D' in this){
            // @ts-ignore
            this.setVerts2D(verts);
        }else{
            this.setGeometry(verts);
        }
    }

    /** Copies the vertex array's indices and attributes into `_geometry`. Does nothing if there are no vertices. */
    _setBufferGeometry(verts:VertexArray<any>){
        if(verts.nVerts===0){
            return;
        }
        this._geometry.setIndex(verts.indices.elements);
        for (let attribute in verts.attributes) {
            this._geometry.setAttribute(attribute, verts.getAttributeArray(attribute).BufferAttribute());
        }
    }

    /**
     * Sets the geometry. A `THREE.BufferGeometry` is used directly, but only if no geometry is set yet (otherwise it
     * throws). A `VertexArray3D` is copied into the existing (or a new) buffer geometry. Any other vertex array is
     * passed to `setVerts2D`, which only some subclasses define.
     */
    setGeometry(geometry:THREE.BufferGeometry|VertexArray<any>){
        if(geometry instanceof THREE.BufferGeometry){
            if(this._geometry) {
                throw new Error(`called setGeometry with THREE.BufferGeometry when _geometry is already set...`);
            }else{
                this._geometry = geometry;
            }
        }else{
            if(!(geometry instanceof VertexArray3D)){
                // throw new Error(`cannot set geometry with non-VertexArray3D VertexArray... ${geometry}`);
                // @ts-ignore
                this.setVerts2D(geometry);
                return;
            }else {
                if (!this._geometry) {
                    this._geometry = new THREE.BufferGeometry();
                }
                this._setBufferGeometry(geometry);
            }
        }
    }

    /** Copies a 2D vertex array into the buffer geometry (creating it if needed). */
    _setGeometry2D(geometry:VertexArray2D){
        if (!this._geometry) {
            this._geometry = new THREE.BufferGeometry();
        }
        this._setBufferGeometry(geometry);
    }





    /** Sets the material (see `_GetMaterialFromParam` for accepted types) and applies it to the mesh if it exists. */
    setMaterial(material:Color|THREE.Color|THREE.Material|THREE.Material[]|AMaterial){
        this._material = AGraphicElementBase._GetMaterialFromParam(material);
        if(this._element){
            this.element.material=this._material;
        }
    }


    /**
     * If both `geometry` and `material` are given, the mesh is created right away (`init`). If only one is given,
     * it is stored and the mesh is not created yet.
     * @param geometry Geometry as a `THREE.BufferGeometry` or a `VertexArray`.
     * @param material Material, Three.js material, or color.
     */
    constructor(
        geometry?:THREE.BufferGeometry|VertexArray<any>,
        material?:Color|THREE.Color|THREE.Material|THREE.Material[]|AMaterial,
        ...args:any[])
    {
        super();
        if(geometry && material){
            // If both provided let's go ahead and init
            this.init(geometry, material);
        }else {
            // If only one provided
            if (geometry) {
                this.setGeometry(geometry);
            }
            if (material) {
                this.setMaterial(material);
            }
        }
        if(this.threejs){
            if(this.threejs.name ===""){
                this.setObject3DName(this.serializationLabel);
            }
        }
    }

    /** Sets any given geometry/material and creates the mesh. Throws if the mesh already exists. */
    init(geometry?:THREE.BufferGeometry|VertexArray<any>, material?:Color|THREE.Color|THREE.Material|THREE.Material[]|AMaterial) {
        if(this._element){
            throw new Error(`Tried to call init on GraphicElement that already has _element ${this._element}`);
        }
        this._initIfNotAlready(geometry, material);
    }

    /**
     * Sets any given geometry/material, then creates a new `THREE.Mesh` (with `matrixAutoUpdate` off). Throws if the
     * geometry or material is missing. Despite the name, it does not check for an existing mesh; it replaces it.
     */
    _initIfNotAlready(geometry?:THREE.BufferGeometry|VertexArray<any>, material?:Color|THREE.Color|THREE.Material|THREE.Material[]|AMaterial) {
        if(geometry){
            this.setGeometry(geometry);
        }
        if(material){
            this.setMaterial(material);
        }
        if(this.material && this.geometry) {
            this._element = new THREE.Mesh(this.geometry, this.material);
            this._element.matrixAutoUpdate=false;
        }else{
            throw new Error(`Was unable to initialize render element:\ngeometry:${this.geometry}\nmaterial:${this.material}`)
        }
    }
}
