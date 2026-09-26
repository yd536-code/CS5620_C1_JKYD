import {AInteractionMode, BasicInteractionModes} from "./AInteractionMode";
import {HasInteractions} from "../base/amvc/HasInteractions";

// export enum BasicInteractionModes{
//     default='default'
// }

/**
 * The set of {@link AInteractionMode}s a controller can switch between, keyed by name. Starts with an active
 * `default` mode. `setActiveMode(name)` deactivates the other modes and activates `name`.
 */
export class AInteractionModeMap{
    /** The defined modes, by name. */
    public modes:{[name:string]:AInteractionMode}={};
    // private _activeModeNames:string[]=[];
    /** The controller (or other object) that owns these modes; passed to modes created by `defineMode`. */
    public owner:HasInteractions;


    /** Returns `{name: name}` for each mode whose `isGUISelectable` is true (the format a dropdown's options can use). */
    getGUISelectableModesOptions(){
        let rval:{[name:string]:string}={}
        // let rval = [];
        for(let m in this.modes){
            if(this.modes[m].isGUISelectable){
                rval[m]=m;
            }
        }
        return rval;
    }
    /** Returns the names of modes whose `isGUISelectable` is true. */
    getGUISelectableModesList(){
        let rval = [];
        for(let m in this.modes){
            if(this.modes[m].isGUISelectable){
                rval.push(m);
            }
        }
        return rval;
    }
    // get _activeModeName(){
    //     if(this._activeModeNames.length===1) {
    //         return this._activeModeNames[0]
    //     }else{
    //         throw new Error("Multiple interaction modes are active");
    //     }
    // }

    // get activeMode(){
    //     return this.modes[this._activeModeName];
    // }

    /** Returns the names of the currently active modes. */
    getActiveModeNames(){
        let rval = [];
        for(let m in this.modes){
            if(this.modes[m].active){
                rval.push(m);
            }
        }
        return rval;
    }

    /**
     * Creates the map with one active `default` mode.
     * @param owner the object that owns the modes
     */
    constructor(owner:HasInteractions){
        this.owner = owner;
        this.defineMode(BasicInteractionModes.default);
        this.setActiveMode(BasicInteractionModes.default);
    }

    /**
     * Adds a mode under `name`: `mode` if given, otherwise a new empty {@link AInteractionMode}. If `name` is
     * already defined, warns, deactivates the old mode, and replaces it; the new mode is not activated
     * automatically.
     */
    defineMode(name:string, mode?:AInteractionMode){
        if(name in this.modes){
            // Name both classes, so an accidental collision (two different mode classes that ended up
            // with the same name) is obvious rather than looking like an intentional redefinition.
            const oldClass = this.modes[name].constructor.name;
            const newClass = mode ? mode.constructor.name : "AInteractionMode";
            console.warn(`you are redefining interaction mode "${name}" (was ${oldClass}, now ${newClass})`);
            this.modes[name].deactivate();
        }
        if(mode ===undefined){
            this.modes[name]=new AInteractionMode(name, this.owner);
        }else{
            this.modes[name]=mode;
        }

    }

    /** Returns whether a mode named `name` exists. */
    modeIsDefined(name:string){
        return name in this.modes;
    }

    /** Deactivates and removes the mode `name` (warns if it doesn't exist). */
    undefineMode(name:string){
        if(name in this.modes){
            this.modes[name].deactivate();
            delete this.modes[name];
        }else{
            console.warn(`you are trying to undefine interaction mode ${name} that doesn't exist`);
        }
    }

    /** Deactivates and removes every mode, including `default`. */
    clearAllModes(){
        for(let modeName in this.modes){
            this.undefineMode(modeName);
        }
    }

    _getActiveModes(){
        const activeModes = [];
        for(const mode in this.modes){
            if(this.modes[mode].active){
                activeModes.push(this.modes[mode]);
            }
        }
        return activeModes;
    }
    /** Makes exactly the modes in `modeNames` active, deactivating the others. Throws if a name isn't defined. */
    _setActiveInteractionModes(modeNames:string[]){
        const oldActiveModes = this._getActiveModes();
        for(const oldmode of oldActiveModes){
            if(!modeNames.includes(oldmode.name)){
                oldmode.deactivate();
            }
        }
        for(let modeName of modeNames){

            // if(!this.modes[modeName]){
            //     console.log(modeName);
            // }
            if(!this.modes[modeName].active){
                this.modes[modeName].activate();
            }
        }
        // this._activeModeNames=modeNames;
    }
    /** Makes `modeName` the only active mode. */
    setActiveMode(modeName:string){
        this._setActiveInteractionModes([modeName]);
    }
    _activateAllModes(){
        this._setActiveInteractionModes(Object.keys(this.modes));
    }
    /** Deactivates every mode. */
    deactivateAll(){
        this._setActiveInteractionModes([]);
    }

    /** Removes (and deactivates) every mode. */
    dispose(){
        this.clearAllModes();
        // this.deactivateAll();
    }

}


