import {StandardTexturedShaderModel} from "../../shaderModels";
import {AShaderMaterial, ATexture, ClassInterface, Color} from "../../../index";
import {BlinnPhongMaterial} from "../../../rendering/shadermodels";


enum CHARACTER_SHADER_UNIFORM_NAMES{
    characterColor="characterColor",
    characterUniform1="characterUniform1"
}

/** Blinn-Phong material with a `characterColor` uniform. Created by {@link CharacterShaderModel}. */
export class CharacterMaterial extends BlinnPhongMaterial{
    /** Sets the `characterColor` uniform. */
    setCharacterColor(color:Color){
        this.setUniformColor(CHARACTER_SHADER_UNIFORM_NAMES.characterColor, color)
    }
}

/**
 * Shader model for characters: a textured Blinn-Phong shader with two extra uniforms, `characterColor` and
 * `characterUniform1`. Its materials are {@link CharacterMaterial}s.
 */
export class CharacterShaderModel extends StandardTexturedShaderModel{
    ShaderMaterialClass:ClassInterface<AShaderMaterial>=CharacterMaterial;
    /** Number of materials that have had per-instance controls added (used to name them "C0", "C1", ...). */
    nMaterials:number=0;
    /**
     * Optionally you can set a texture to be used as the default for all instances of shader materials created with
     * this model
     * @type {ATexture}
     * @private
     */
    private _diffuseTexture?:ATexture;

    /**
     * Set the default diffuse texture
     * @param value
     */
    set diffuseTexture(value){this._diffuseTexture = value;}

    /**
     * Get the default diffuse texture
     * @returns {ATexture | undefined}
     */
    get diffuseTexture(){return this._diffuseTexture;}


    /**
     * Creates a character material from this shader model. `characterUniform1` is set to a random value in [0, 1).
     * @param diffuseTexture texture to use. Defaults to this model's `diffuseTexture`.
     * @param characterColor color to assign this character. Defaults to white.
     * @param addGUISpecs whether to add this material's controls to the control panel (see
     * `addInstanceGUISpecForMaterial`)
     * @param args passed to the base `CreateMaterial`
     * @returns {AShaderMaterial}
     */
    CreateMaterial(diffuseTexture?:ATexture, characterColor?:Color, addGUISpecs:boolean=true,...args:any[]){
        // Fill in the defaults: white for the color, and this model's own `diffuseTexture` (which may itself be
        // undefined) when no texture is given.
        characterColor = characterColor??Color.White();
        diffuseTexture = diffuseTexture??this.diffuseTexture;

        let mat = super.CreateMaterial(...args);

        /**
         * Set the diffuse texture, characterColor, and characterUniform1 uniform values for our shader
         */
        mat.setTexture('diffuse', diffuseTexture);
        mat.setUniformColor("characterColor", characterColor);
        mat.setUniform("characterUniform1", Math.random());

        /**
         * We can optionally add controls for each instance of a shader material
         */
        if(addGUISpecs){
            this.addInstanceGUISpecForMaterial(mat);
        }
        return mat;
    }

    /**
     * Adds a color picker and a slider for `mat`'s `characterColor` and `characterUniform1` to the control panel, in
     * their own subgroup. Does nothing unless the model's instance-controls folder was created first with
     * `AddInstancesControlToGUI`.
     */
    addInstanceGUISpecForMaterial(mat:AShaderMaterial, ){
        /**
         * We will only add the instance spec if you've created an instance folder in the control panel to add the
         * spec to. You create the folder using shaderModel.AddInstancesControlToGUI(folder_name?:string)
         * but don't add it here! CreateMaterial gets called for every material you create using one model. You only
         * want one folder for all the instance materials that belong to this model.
         */
        if(this.hasInstanceControlsFolderInGUI) {

            /**
             * You should have some name for your instance to appear as in the control panel
             * @type {string}
             */
            let instanceName = `C${this.nMaterials}`;

            /**
             * Here we add one color picker and one slider, each on this instance's own
             * subgroup nested inside this model's shared instance-controls group -- see
             * AShaderModel.getInstanceControlSpecGroup. We are setting the initial value
             * to be whatever the value of our uniform is, otherwise the GUI and the
             * uniform will start out of sync; each onChange calls straight through to
             * this specific material's own setUniformColor/setUniform.
             */
            const subgroup = this.getInstanceControlSpecGroup().addControlSpecGroup(instanceName, {});
            subgroup.addColorControl("color", mat.getUniformColorValue("characterColor"),
                (v) => mat.setUniformColor("characterColor", v));
            subgroup.addSliderControl("var1", mat.getUniformValue("characterUniform1"),
                (v) => mat.setUniform("characterUniform1", v), -1, 3, 0.01);
            this.nMaterials++;
        }
    }

}


