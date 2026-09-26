import {AGLNodeView, ALabel, APolygonGraphic2D, Color} from "../../../../anigraph";
import {RowOfCopiesModel} from "./RowOfCopiesModel";

/**
 * # A view that draws many copies of its model's shape
 *
 * Draws a `RowOfCopiesModel` as `nCopies` copies of the model's shape. Each copy is its own `APolygonGraphic2D` with
 * its own transform and color, both of which come from the model (`getTransformForCopy(i)` and `getColorForCopy(i)`).
 * The view decides nothing about where the copies go; it only draws what the model says.
 *
 * The view redraws whenever the model signals `RowOfCopiesModel.Events.PARAMS_CHANGED`. If `nCopies` changed, it
 * first throws away its graphics and creates new ones.
 */
@ALabel("CVRowOfCopiesView")
export class RowOfCopiesView extends AGLNodeView{
    /**
     * How far in front of copy `i-1` copy `i` is drawn. A graphic with a larger z is drawn in front, so where copies
     * overlap, later copies cover earlier ones.
     */
    static CopyZStep = 0.001;

    /** One graphic per copy. `copies[i]` draws copy `i`. */
    copies: APolygonGraphic2D[] = [];

    /** The model, typed as the class this view draws. */
    get model(): RowOfCopiesModel {
        return this._model as RowOfCopiesModel;
    }

    /**
     * Creates the graphics, draws them once, and subscribes to the model's custom event.
     */
    init(): void {
        this.createCopies();
        this.updateCopies();
        this.update();

        // Redraw whenever the model's parameters change. Passing the listener to `subscribe` means it is removed
        // when this view is released.
        this.subscribe(this.model.addParamsListener(()=>{
            if(this.copies.length !== this.model.nCopies){
                this.createCopies();
            }
            this.updateCopies();
        }));
    }

    /**
     * Throws away the old copy graphics, if any, and creates `nCopies` new ones.
     *
     * Each copy is initialized with a `Color`, which gives it a material of its own. That matters: disposing a
     * graphic also disposes its geometry and material, so if copies shared a material, disposing one would break the
     * others. (Each copy also gets its own geometry, built from `model.verts`.)
     */
    createCopies(){
        // disposeGraphic removes one graphic from the view and frees its GPU resources. (The view's disposeGraphics()
        // would free every graphic the view has; this view has only copies, but a view with other graphics, like a
        // marker, would lose those too.)
        for(const copy of this.copies){
            this.disposeGraphic(copy);
        }
        this.copies = [];
        for(let i=0;i<this.model.nCopies;i++){
            const copy = new APolygonGraphic2D();
            copy.init(this.model.verts, this.model.getColorForCopy(i));
            this.registerAndAddGraphic(copy);
            this.copies.push(copy);
        }
    }

    /**
     * Sets every copy's transform and color from the model.
     */
    updateCopies(){
        for(let i=0;i<this.copies.length;i++){
            // setTransform2D sets the 2D transform and a z value in one go; the z value sets the drawing order.
            this.copies[i].setTransform2D(this.model.getTransformForCopy(i), i*RowOfCopiesView.CopyZStep);
            RowOfCopiesView.SetColor(this.copies[i], this.model.getColorForCopy(i));
        }
    }

    /**
     * Changes the color of a graphic's existing material.
     *
     * `graphic.setMaterial(color)` would also work, but it creates a new material every time and never frees the old
     * one. This runs on every slider change and, with the wave on, every frame, so that would leak GPU memory.
     * @param graphic a graphic initialized with a `Color`
     * @param color
     */
    static SetColor(graphic: APolygonGraphic2D, color: Color){
        graphic.setMaterialAttribute("color", color.asThreeJS());
        graphic.setMaterialAttribute("opacity", color.a);
    }

    /**
     * Runs whenever the model's state changes, including its transform. Applies the model's transform, which moves
     * all of the copies together, because they are part of this view.
     */
    update(...args: any[]): void {
        this.setTransform(this.model.transform);
    }
}
