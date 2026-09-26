import {AGLNodeView} from "./AGLNodeView";

/**
 * View for group nodes (`AGroupNodeModel2D` and `AGroupNodeModel3D`). A group renders nothing itself; it exists so
 * that the views of its children, nested under this view's render object, inherit its transform. The model embeds the
 * transform for its own dimension, so one class serves both.
 */
export class AGroupNodeView extends AGLNodeView{
    /** A group has no graphics of its own, so there is nothing to create. */
    init(){

    }
    /** Applies the model's transform. */
    update(){
        this.updateTransform();
    }
}
