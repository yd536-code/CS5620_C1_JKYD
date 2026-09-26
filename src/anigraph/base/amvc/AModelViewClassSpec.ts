
// export interface AMVCMapEntry<NodeModelType extends ASceneNodeModel>{
//     modelClass:AModelClassInterface<AModelInterface>;
//     viewClass:AViewClassInterface;
//     controllerClass:ClassInterface<AControllerInterface<NodeModelType>>,
//     details:GenericDict
// }

// export const enum AMVCMapEntryDetail{
//     CAN_SELECT_IN_GUI='CAN_SELECT_IN_GUI',
//     CAN_CLICK_TO_CREATE='CAN_CLICK_TO_CREATE',
// }




// export type AMVCNodeClassSpec<NodeModelType extends ASceneNodeModel> = [AModelClassInterface<AModelInterface>, AViewClassInterface, AControllerClassInterface<ASceneNodeController<ASceneNodeModel>>, AMVCMapDetailDict];

// export function NewAMVCNodeClassSpec(
//     modelClass:AModelClassInterface<ASceneNodeModel>,
//     viewClass:AViewClassInterface,
//     controllerClass:AControllerClassInterface<ASceneNodeController<ASceneNodeModel>>,
//     details?:AMVCMapDetailDict
// ):AMVCNodeClassSpec<ASceneNodeModel>{
//     details = (details!==undefined)?details:{};
//     // if(details){
//     return [modelClass, viewClass, controllerClass, details];
//     // }else{
//     //     return [modelClass, viewClass, controllerClass, {}];
//     // }
//
// }


import {ClassInterface} from "../../basictypes";
import {ANodeView} from "../../scene/nodeView";
import {ANodeModel} from "../../scene/nodeModel";
import {GetClassLabel, HasOwnClassLabel} from "../aserial";


/** Optional flags for an {@link AMVClassSpec}. Each defaults to `true`. */
export interface AMVClassSpecDetails {
    /** Whether the model class is listed by `AModelViewClassMap.getGUIModelOptions`/`getGUIModelOptionsList`. */
    isGUIOption?:boolean;
}
/** Fills in `true` for any detail flag `d` leaves out. */
function AMVClassSpecDetailWithDefaults(d:AMVClassSpecDetails){
    let defaultValues:AMVClassSpecDetails = {
        isGUIOption:true,
    }
    return {...defaultValues, ...d};
}

/**
 * A "Model View Spec": pairs a node model class with the node view class that should draw it, plus optional
 * details. Scene controllers register these in an {@link AModelViewClassMap} so the scene view knows which view
 * to create for each model added to the scene.
 */
export class AMVClassSpec {
    modelClass:ClassInterface<ANodeModel>;
    viewClass:ClassInterface<ANodeView>;
    details:AMVClassSpecDetails;
    /**
     * @param modelClass the node model class
     * @param viewClass the node view class that draws it
     * @param details optional flags; any left out default to `true`
     */
    constructor(modelClass:ClassInterface<ANodeModel>,
                viewClass:ClassInterface<ANodeView>,
                details?:AMVClassSpecDetails) {
        this.modelClass=modelClass;
        this.viewClass=viewClass;
        this.details = AMVClassSpecDetailWithDefaults(details?details:{});
    }
}

/**
 * A collection of {@link AMVClassSpec}s, keyed by the model class's label, used to look up which view class
 * draws a given model.
 */
export class AModelViewClassMap {
    protected _classMap:{[modelClassName:string]:AMVClassSpec};
    constructor(specs?:AMVClassSpec[]) {
        this._classMap = {};
        if(specs){
            this.addSpecs(specs);
        }
    }

    /** Labels of the model classes that have specs. */
    get modelClassNames(){return Object.keys(this._classMap);}
    /** All registered specs. */
    get specs(){return Object.values(this._classMap);}


    /** Returns `{label: label}` for each model class whose spec has `isGUIOption` set (for a GUI dropdown). */
    getGUIModelOptions(){
        let rval:{[name:string]:string}={}
        // let rval = [];
        for(let m in this._classMap){
            if(this._classMap[m].details.isGUIOption){
                rval[m]=m;
            }
        }
        return rval;
    }
    /** Returns the labels of the model classes whose spec has `isGUIOption` set. */
    getGUIModelOptionsList(){
        let rval = [];
        for(let m in this._classMap){
            if(this._classMap[m].details.isGUIOption){
                rval.push(m);
            }
        }
        return rval;
    }

    /**
     * Returns the spec for a model (instance, class, or label string), or `undefined` if there is none.
     *
     * For a class or instance, first tries the class's own label (`GetClassLabel`: its own
     * `@ASerializable`/`@ALabel` label, else its own class name). If that misses and the class has no label of
     * its own (an undecorated subclass), it falls back to the spec of its nearest ancestor that has one, so an
     * undecorated subclass (like `CharacterModel3D`) gets its parent's view. A decorated class with no spec of its
     * own gets `undefined` (and so the scene view's default view class).
     */
    getSpecForModel(model:string|ClassInterface<ANodeModel>|ANodeModel):AMVClassSpec{
        if (typeof model ==='string'||model instanceof String) {
            return this._classMap[model as string];
        }
        let ctor:any = (model instanceof ANodeModel)? model.constructor : model;
        while(ctor && ctor !== Function.prototype){
            const spec = this._classMap[GetClassLabel(ctor)];
            if(spec !== undefined || HasOwnClassLabel(ctor)){
                return spec;
            }
            ctor = Object.getPrototypeOf(ctor);
        }
        // Typed as a spec (not `| undefined`); callers handle a missing spec at runtime.
        return undefined as any;
    }

    /** The view class for a model. Throws if the model has no spec. */
    _viewClassForModel(model:string|ClassInterface<ANodeModel>|ANodeModel){
        return this.getSpecForModel(model).viewClass;
    }

    /** The spec details for a model. Throws if the model has no spec. */
    _classDetailsForModel(model:string|ClassInterface<ANodeModel>|ANodeModel){
        return this.getSpecForModel(model).details;
    }

    /** Adds one spec or a list of specs (see `addSpec`). */
    addSpecs(specs:AMVClassSpec|AMVClassSpec[]){
        if(Array.isArray(specs)){
            for(let spec of specs){
                this.addSpec(spec);
            }
        }else{
            this.addSpec(specs);
        }
    }
    /**
     * Adds a spec, keyed by the model class's label (`SerializationLabel()`). A class without a static
     * `SerializationLabel` is keyed by its class name, with a console warning. A spec for the same label replaces
     * the earlier one.
     */
    addSpec(spec:AMVClassSpec){
        // if(spec.modelClass.hasOwnProperty('SerializationLabel')){
        // let serializationLabel = spec.modelClass.SerializationLabel();
        if('SerializationLabel' in spec.modelClass){
            // @ts-ignore
            let label:string = spec.modelClass.SerializationLabel();
            this._classMap[label]=spec;

        }else{
            this._classMap[spec.modelClass.name]=spec;
            // if(label!==spec.modelClass.name){
            //     console.warn(`Serialization label ${label} is different from class name ${spec.modelClass.name}`)
            // }
            console.warn(`Class ${spec.modelClass.name} not given serialization label`)
        }


    }
}
