import {AGLNodeView} from "../../nodeView";

/**
 * View for {@link ALoadedModel3D}: creates graphics for the model's loaded 3D objects (see
 * `AGLNodeView.initLoadedObjects`) and keeps them in sync with the model's transform and `sourceTransform`.
 */
export class ALoadedView3D extends AGLNodeView{
    /** Creates graphics for the model's loaded objects (the default `AGLNodeView.init`). */
    init(): void {
        super.init();
    }

    /**
     * Applies the model's transform, and copies each loaded object's source transform (for example a changed
     * `sourceScale`) into the matching graphic. The graphics are copies of the loaded objects made in `init()`, so
     * they don't see the model's changes by themselves.
     */
    update(...args: any[]): void {
        this.setTransform(this.model.transform);
        for(let elid in this._loadedElements){
            this._loadedElements[elid].updateSourceTransform();
        }
    }

}
