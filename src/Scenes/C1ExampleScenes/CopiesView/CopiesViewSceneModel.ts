import {AppSceneModel2D} from "../../../anigraph/starter/App2D/AppSceneModel2D";
import {AppState, Vec2} from "../../../anigraph";
import {RowOfCopiesModel} from "./nodes";

/**
 * The scene model. It creates the row of copies and passes time and drags on to it. This scene has one node, so the
 * scene model only connects things; all of the behavior is in `RowOfCopiesModel` and its view.
 */
export class CopiesViewSceneModel extends AppSceneModel2D{
    /** The node whose view draws the copies. */
    row!: RowOfCopiesModel;

    /**
     * 1st: adds the control-panel controls. The node's class adds its own through its static `SetAppState`.
     * @param appState
     */
    initAppState(appState: AppState){
        super.initAppState(appState);
        RowOfCopiesModel.SetAppState(appState);
    }

    /**
     * 2nd: builds the scene. This scene loads no files, so it doesn't override `PreloadAssets`.
     */
    async initScene(){
        this.row = new RowOfCopiesModel();
        this.addNode(this.row);
    }

    /**
     * Called once per frame by the scene controller. Node `timeUpdate`s are not called automatically: call each one.
     * @param t the current time, in seconds
     */
    timeUpdate(t: number){
        this.row.timeUpdate(t);
    }

    /**
     * The start of a drag, forwarded from the scene controller.
     * @param worldPoint the cursor, in world coordinates
     */
    onDragStart(worldPoint: Vec2){
        this.row.onDragStart(worldPoint);
    }

    /**
     * A drag, forwarded from the scene controller.
     * @param worldPoint the cursor, in world coordinates
     */
    onDrag(worldPoint: Vec2){
        this.row.onDrag(worldPoint);
    }
}
