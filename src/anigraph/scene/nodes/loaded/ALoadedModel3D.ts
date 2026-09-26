import {ANodeModel3D} from "../../nodeModel/ANodeModel3D";
import {AObjectState, ASerializable} from "../../../base";
import {Mat4, NodeTransform3D, Vec3} from "../../../math";
import {AObject3DModelWrapper, VertexArray3D} from "../../../geometry";
import * as THREE from "three";
import {AMaterial} from "../../../rendering";

/**
 * A node that shows a 3D model loaded from a file, drawn by {@link ALoadedView3D}.
 * The loaded Three.js objects are wrapped in {@link AObject3DModelWrapper}s and kept in the node's geometry set.
 */
@ASerializable("ALoadedModel3D")
export class ALoadedModel3D extends ANodeModel3D{
    /**
     * A transform applied to the loaded objects inside the node, for example to scale a model to a sensible size.
     * It starts as a copy of the loaded object's own source transform (such as the transform passed to
     * `AssetManager.load3DModel`), so creating the node doesn't change how the asset looks.
     *
     * Changes reach the geometry set, and from there every loaded object's matrix, whether you assign a new
     * transform or edit this one in place (including with the `sourceScale` setter). {@link ALoadedView3D} then
     * copies the result into its graphics.
     */
    @AObjectState sourceTransform:NodeTransform3D;
    /** The scale of `sourceTransform`. */
    get sourceScale(){
        return this.sourceTransform.scale
    }
    /** Sets the scale of `sourceTransform` in place; the loaded objects follow (see `sourceTransform`). */
    set sourceScale(v:number|Vec3){
        this.sourceTransform.scale=v;
    }

    /** The node's vertex array (`geometry.verts`). */
    get verts(){return this.geometry.verts as VertexArray3D;}
    set verts(v:VertexArray3D){this.geometry.verts = v;}
    /** The loaded objects added to this node, in order. */
    loadedObjects:AObject3DModelWrapper[]=[];

    /** Creates a model for a loaded object. Called on a subclass, it creates an instance of that subclass. */
    static Create(loaded3DModel:THREE.Object3D|THREE.BufferGeometry|AObject3DModelWrapper, material?:AMaterial, ...args:any[]){
        let newmodel = new this(loaded3DModel, material, ...args);
        return newmodel;
    }

    /**
     * Like `ANodeModel.setMaterial`, but also applies the material to every mesh in the first loaded object.
     * @throws Error if `material` is a string.
     */
    setMaterial(material:AMaterial|string){
        if(this.material === material){
            return;
        }else{
            let amaterial:AMaterial;
            if(material instanceof AMaterial){
                amaterial=material;
            }else{
                throw new Error("Material from string not implemented yet. Should look up in MaterialManager.")
            }

            if(this.material){
                this._disposeMaterial()
            }
            this._material = amaterial;

            let havematerials = this.loadedObjects[0].getThreeJSDescendantsThatHaveMatProperty();
            for (let mi=0; mi<havematerials.length; mi++){
                let m = havematerials[mi] as THREE.Mesh;
                m.material = this.material._material;
            }

            this.setMaterialUpdateSubscriptions();
        }
        this.signalMaterialUpdate();
        // this.signalEvent(AMaterial.Events.CHANGE)
    }


    /**
     * @param obj The loaded object: a `THREE.Mesh`, `THREE.Group`, `AObject3DModelWrapper`, or a
     * `THREE.BufferGeometry` (which is wrapped in a mesh; normals are computed if it has none).
     * @param material Optional material applied to the loaded meshes.
     * @param sourceScale Optional scale for `sourceTransform`. If omitted, the loaded object's own scale is kept.
     * @throws Error if `obj` is of an unrecognized type.
     */
    constructor(obj:THREE.Object3D|THREE.BufferGeometry|AObject3DModelWrapper, material?:AMaterial, sourceScale?:number) {
        super();
        let object:AObject3DModelWrapper;
        if(obj instanceof THREE.BufferGeometry) {
            if(obj.attributes.normal === undefined){
                obj.computeVertexNormals()
            }
            // The node has no material yet: use the given one's three.js material, or a plain placeholder.
            // `setMaterial` below then sets the node's material and applies it to this mesh properly.
            let threemesh = new THREE.Mesh(
                obj,
                material ? material.threejs : new THREE.MeshBasicMaterial()
            );
            object = new AObject3DModelWrapper(threemesh);
        }else if(obj instanceof THREE.Mesh || obj instanceof THREE.Group){
            object = new AObject3DModelWrapper(obj);
        }else if (obj instanceof AObject3DModelWrapper) {
            object = obj;
        }else{
            throw new Error(`Unrecognized loaded object ${obj} of type ${typeof obj}`);
        }
        this.addLoadedObject(object);
        // Start from the loaded object's own source transform (identity unless the asset was loaded with one).
        const assetTransform = object.sourceTransform;
        this.sourceTransform = (assetTransform instanceof NodeTransform3D) ?
            assetTransform.clone() : NodeTransform3D.FromMatrix(assetTransform.getMatrix() as Mat4);
        const self = this;
        /*
        Pass `sourceTransform` on to the geometry set whenever it changes: when a new transform is assigned, and when
        the current one is edited in place (e.g. `sourceScale = 2`). `addStateKeysListener` hears both. The geometry
        set gives each loaded object its own copy and updates that object's matrix.
         */
        this.subscribe(this.addStateKeysListener(['sourceTransform'], ()=>{
            self.geometry.sourceTransform = self.sourceTransform;
        }), 'loadedmodel.sourceTransform');
        if(sourceScale !== undefined){
            this.sourceScale = sourceScale; // the listener above passes this on to the loaded objects
        }
        if(material){
            this.setMaterial(material);
        }
    }

    /** Adds a loaded object to the node's geometry set and to `loadedObjects`. */
    addLoadedObject(object:AObject3DModelWrapper){
        this.geometry.addMember(object);
        this.loadedObjects.push(object);
    }



}
