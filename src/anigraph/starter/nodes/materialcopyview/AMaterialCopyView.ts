import {AGLNodeView} from "../../../scene";
import {AGraphicObject, AShaderMaterial} from "../../../rendering";
import {ALabel} from "../../../base";

let nErrors = 0;

/**
 * A view that draws its model with its own copy of the model's material, re-copied whenever the model's material
 * changes. Useful for rendering another view of the scene with different material settings: override
 * `adjustViewMaterial` to change the copy.
 */
@ALabel("AMaterialCopyView")
export abstract class AMaterialCopyView extends AGLNodeView{
    viewMaterial!:AShaderMaterial;

    init(): void {
        this.copyModelMaterial();
        this.initLoadedObjects(this.viewMaterial);
        this.update();
    }

    get mainMaterial(){
        return this.viewMaterial;
    }

    /** Releases the old copy (if any), clones the model's material into `viewMaterial`, and calls `adjustViewMaterial`. */
    copyModelMaterial(){
        if(this.viewMaterial){
            this.viewMaterial.release()
        }
        this.viewMaterial = AShaderMaterial.Clone(this.model.material) as AShaderMaterial;
        this.adjustViewMaterial()
    }

    /** Hook for changing the copied material. Does nothing by default. */
    adjustViewMaterial(){
        //this.viewMaterial.wireframe=true
    }

    onMaterialUpdate(...args:any[]){
        const self = this;
        this.copyModelMaterial();
        this.mapOverGraphics((element:AGraphicObject)=>{
            element.onMaterialUpdate(self.viewMaterial, ...args);
        })
    }

    onMaterialChange(...args:any[]) {
        const self = this;
        this.copyModelMaterial();
        this.mapOverGraphics((element:AGraphicObject)=>{
            element.onMaterialChange(self.viewMaterial, ...args);
        })
    }

    /** Applies the model's transform. */
    update(): void {
        this.setTransform(this.model.transform);
    }

}
