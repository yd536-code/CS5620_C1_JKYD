import {ANodeModel3D, AShaderModel, Color, V3, Vec3} from "../../../index";
import {CharacterInterface} from "./CharacterInterface";
import {CharacterMaterial, CharacterShaderModel} from "./CharacterShaderModel";



/**
 * A 3D node for a game character, with mass, velocity, and a character color used by {@link CharacterShaderModel}.
 * Call `await CharacterModel3D.LoadShaderModel()` (e.g. in `PreloadAssets`) before `CreateMaterial()`.
 */
export class CharacterModel3D extends ANodeModel3D implements CharacterInterface{
    /** The shader model class `LoadShaderModel` creates. */
    static ShaderModelClass:(typeof AShaderModel)=CharacterShaderModel;
    /** The shared shader model, set by `LoadShaderModel`. */
    static ShaderModel:AShaderModel;
    /** Creates the shared shader model (named "charactershader" by default) if it hasn't been loaded yet. */
    static async LoadShaderModel(name?:string, ...args:any[]){
        if(this.ShaderModel == undefined) {
            this.ShaderModel = await this.ShaderModelClass.CreateModel(name??"charactershader", ...args)
        }
    }
    /** Creates a material from the shared shader model; arguments go to `CharacterShaderModel.CreateMaterial`. */
    static CreateMaterial(...args:any[]):CharacterMaterial{
        return (this.ShaderModel.CreateMaterial(...args) as CharacterMaterial);
    }

    _characterColor!:Color;
    /** Returns the color last set with `setCharacterColor`. */
    getCharacterColor(){
        return this._characterColor;
    }
    /** Stores `c` and sets the material's `characterColor` uniform. The material must be a {@link CharacterMaterial}. */
    setCharacterColor(c:Color){
        this._characterColor = c;
        (this.material as CharacterMaterial).setCharacterColor(c);
    }

    mass:number=1;
    velocity:Vec3 = V3();

    /** Position in world coordinates. */
    get worldPosition(){
        return this.getWorldTransform().getPosition();
    }

    /** Position relative to the parent (the transform's translation). Setting it edits the transform in place. */
    get position(){
        return this.transform.getPosition();
    }
    set position(value:Vec3){
        this.transform.setPosition(value);
    }
}

/** The members a character model provides (implemented by {@link CharacterModel3D} and {@link LoadedCharacterModel3D}). */
export interface CharacterModelInterface extends CharacterModel3D{
}
