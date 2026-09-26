import {ALoadedModel3D} from "../../../../scene/nodes/loaded/ALoadedModel3D";
import {AMaterial, AObject3DModelWrapper, ASerializable, ATexture, Color, V3, Vec3} from "../../../../index";
import {CharacterModelInterface} from "../CharacterModel3D";
import {CharacterMaterial} from "../CharacterShaderModel";
import * as THREE from "three";

/**
 * A character (see {@link CharacterModelInterface}) whose geometry is a loaded 3D model file ({@link ALoadedModel3D}).
 */
@ASerializable("LoadedCharacterModel3D")
export class LoadedCharacterModel3D extends ALoadedModel3D implements CharacterModelInterface{
    mass:number=1;
    velocity:Vec3 = V3();

    /** Position relative to the parent (the transform's translation). Setting it edits the transform in place. */
    get position(){
        return this.transform.getPosition();
    }
    set position(value:Vec3){
        this.transform.setPosition(value);
    }

    /** Position in world coordinates. */
    get worldPosition(){
        return this.getWorldTransform().getPosition();
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

    /** Creates a character from a loaded Three.js object (or wrapper) and an optional material. */
    static Create(loaded3DModel:THREE.Object3D|AObject3DModelWrapper, material?:AMaterial, ...args:any[]){
        let newmodel = new this(loaded3DModel, material, ...args);
        return newmodel;
    }

}
