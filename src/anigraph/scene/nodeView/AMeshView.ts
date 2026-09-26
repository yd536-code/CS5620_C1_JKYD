import {AGLNodeView} from "./AGLNodeView";
import {ATriangleMeshGraphic} from "../../rendering";
import type {ANodeModel} from "../nodeModel/ANodeModel";
import type {VertexArray2D, VertexArray3D} from "../../geometry";

/**
 * Shared base for views that draw a model's vertex array as a triangle mesh (`ATriangleMeshGraphic`), whether the
 * vertices are 2D or 3D: the graphic accepts either kind, and the model embeds its own transform for rendering.
 *
 * The one thing that differs between the mesh views is when the vertices are re-sent to the graphic, which is why
 * `pushesVertsOnUpdate` is an explicit choice instead of a shared default:
 * - 3D mesh views re-send the vertices on every `update()` (which also runs on every transform update by default),
 *   so an in-place vertex edit shows up at the next `update()` of any kind.
 * - 2D mesh views re-send them only when the model signals a geometry update, because their transforms change every
 *   frame during animation and re-sending the vertices each time would be wasted work.
 *
 * Either way, after editing a model's vertices in place, call `model.signalGeometryUpdate()` (`setVerts` does it
 * for you): in-place vertex edits are not detected on their own.
 *
 * `ANodeView.setModel` calls `init()` and then `update()`, so the graphic is built and filled before first display.
 */
export abstract class AMeshView<M extends ANodeModel> extends AGLNodeView{
    /** The graphic that draws the model's vertices. */
    meshGraphic!:ATriangleMeshGraphic;

    get model():M{
        return this._model as M;
    }

    /**
     * Whether `update()` re-sends the model's vertices to the graphic (see the class description).
     */
    protected abstract get pushesVertsOnUpdate():boolean;

    /**
     * Creates the view for a model. The `this` parameter makes the result the type of the class it is called on.
     * @param model The model to view.
     * @returns The new view, already attached to the model.
     */
    static Create<V extends AMeshView<any>>(this: new () => V, model:ANodeModel, ...args:any[]):V{
        let view = new this();
        view.setModel(model);
        return view;
    }

    /**
     * Builds the mesh graphic. Views that do not re-send vertices on every update listen for geometry updates
     * instead, so a changed vertex array still reaches the graphic.
     */
    init(){
        this.meshGraphic = new ATriangleMeshGraphic(this.model.verts, this.mainMaterial.threejs);
        this.registerAndAddGraphic(this.meshGraphic);
        if(!this.pushesVertsOnUpdate){
            const self = this;
            this.subscribe(this.model.addGeometryListener(
                ()=>{
                    self.updateGeometry();
                }
            ));
        }
    }

    /** Re-sends the vertices if `pushesVertsOnUpdate`, then applies the model's transform. */
    update(): void {
        if(this.pushesVertsOnUpdate){
            this.updateGeometry();
        }
        this.updateTransform();
    }

    /**
     * Sends the model's current vertices to the graphic. `setVerts` picks the 2D or 3D path from the vertex array.
     */
    updateGeometry(){
        this.meshGraphic.setVerts(this.model.verts as VertexArray2D|VertexArray3D);
    }
}
