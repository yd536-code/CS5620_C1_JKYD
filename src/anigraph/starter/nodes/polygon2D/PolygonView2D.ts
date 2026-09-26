
import {ALabel} from "../../../base";
import {AGLNodeView} from "../../../scene";
import {APolygonGraphic2D} from "../../../rendering";
import {PolygonModel2D} from "./PolygonModel2D";

/**
 * Three.js view for a {@link PolygonModel2D}: draws the polygon with the model's material, rebuilds the graphic on
 * geometry updates, and applies the model's transform (including `zValue`) in `update()`.
 */
@ALabel("PolygonView2D")
export class PolygonView2D extends AGLNodeView{
    element!: APolygonGraphic2D;
    get model(): PolygonModel2D {
        return this._model as PolygonModel2D;
    }
    init(): void {
        this.element = new APolygonGraphic2D();
        this.element.init(this.model.verts, this.mainMaterial.threejs);
        this.registerAndAddGraphic(this.element);
        this.update();
        const self = this;
        this.subscribe(this.model.addGeometryListener(
            ()=>{
                self.updateGeometry();
            }
        ))

    }

    /** Copies the model's current vertices into the graphic. Called on geometry updates. */
    updateGeometry(){
        this.element.setVerts2D(this.model.verts);
    }

    /**
     * Applies the model's transform to the graphic, with `zValue` as the z translation (the node's depth, used for
     * draw order). This is `updateTransform()`, i.e. `model.getRenderMatrix()`.
     */
    update(): void {
        this.updateTransform();
    }


}
