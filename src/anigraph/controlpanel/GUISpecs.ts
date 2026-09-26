import {button, folder} from "leva";
import {SHADER_UNIFORM_TYPES} from "../basictypes";
import {Color} from "../math/Color";
import tinycolor from "tinycolor2";

type _GUIControlSpec={[name:string]:any};
/** A leva control spec (or folder spec): a plain object of leva settings such as `value`, `min`, `max`, `onChange`. */
export interface GUIControlSpec extends _GUIControlSpec{
}


// export interface GUISliderSpec{
//     name:string,
//     value:any,
//     min?:any,
//     max?:any,
//     step?:any
// }


// export interface ShaderUniformParameterGUISpec{
//     nameInShader: string;
//     nameInGUI:string;
//     dtype:SHADER_UNIFORM_TYPES;
//     spec:GUIControlSpec;
// }

/**
 * Static helpers that build leva control specs for the control panel. Most scene code should use the
 * `AAppState` `addXControl` methods (called from {@link ASceneModel.initAppState}) instead of calling these directly.
 */
export class GUISpecs{
    /** Returns the key a control named `name` gets inside folder `folderName` when folder-name suffixing is on: `"<name>_<folderName>"`. */
    static KeyNameInFolder(name:string, folderName:string){
        return name+"_"+folderName;
    }

    /**
     * Wraps `spec` in a leva `folder()`.
     * @param name the folder name; also the key suffix when `addFolderNameToKeys` is true
     * @param spec the `{name: spec}` controls inside the folder
     * @param addFolderNameToKeys if true (default), each key becomes `"<key>_<name>"` (see `KeyNameInFolder`)
     * @param collapsed whether the folder starts collapsed (default true)
     * @param render optional leva conditional-render hook, `(get) => boolean`, re-evaluated whenever any control
     * changes; `get(path)` reads another control's current value by its leva store path. Use it to show the
     * folder only while, e.g., a `Tool` dropdown is set to `"Add Lens"`.
     */
    static MakeFolder(name:string, spec:GUIControlSpec, addFolderNameToKeys:boolean=true, collapsed:boolean=true, render?:(get:(path:string)=>any)=>boolean){
        let specUse:GUIControlSpec = {};
        if(addFolderNameToKeys){
            for(let k in spec){
                specUse[GUISpecs.KeyNameInFolder(k, name)]=spec[k];
                // specUse[k+"_"+name]=spec[k];
            }
        }else{
            specUse = spec;
        }
        let fspec = folder(
            specUse,
            { collapsed: collapsed, render: render }
        )
        return fspec;
    }

    /**
     * Builds a color-picker spec. leva holds the color as `initialValue.RGBuintAfloat`; `onChange` receives it
     * converted back to an AniGraph {@link Color}.
     */
    static ColorControl(onChange:(color:Color)=>void, initialValue:Color, otherSpecs?:{[name:string]:any}){
        return {
            value:initialValue.RGBuintAfloat,
            onChange: (v:any)=>{
                return onChange(Color.FromTinyColor(tinycolor(v)))
            },
            ...otherSpecs
        }
    }

    /** Builds a leva button spec that calls `callback` when clicked. */
    static ButtonControl(callback:()=>void, otherSpecs?:{[name:string]:any}){
        return button(callback, otherSpecs);
    }

    /** Builds a checkbox spec; `initialValue` defaults to `false`. */
    static CheckboxControl(onChange:(value:boolean)=>void, initialValue?:boolean, otherSpecs?:{[name:string]:any}){
        return {
            value:initialValue??false,
            onChange: (v:any)=>{
                return onChange(v);
            },
            ...otherSpecs
        }
    }

    /** Builds a slider spec. `step` defaults to 1% of the range, `(max-min)*0.01`. */
    static SliderControl(onChange:(v:number)=>void, initialValue:any, min:number, max:number, step?:number, otherSpecs?:{[name:string]:any}){{
            return {
                value: initialValue,
                onChange: onChange,
                min:min,
                max:max,
                step:step??(max-min)*0.01,
                ...otherSpecs
            }
        }
    }

    /** Builds a dropdown spec with choices `options`; `initialValue` should be one of them. */
    static SelectionControl(onChange:(v:string)=>void, options:string[], initialValue:string, otherSpecs?:{[name:string]:any}){
        return {
            value:initialValue,
            options:options,
            onChange:onChange,
            ...otherSpecs
        }
    }
}









// export interface GUIControlSpec extends _GUIControlSpec{
//   value:any;
//   onChange:AppStateValueChangeCallback;
// }
