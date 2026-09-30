import {AppState, ASerializable, Color, GetAppState, LineModel2D, V2} from "../../../../anigraph";

/**
 * Step 6.7: a zigzag line whose height comes from a slider. The model only holds the points; {@link TutLineView}
 * draws them. When the slider changes, the model moves its points and calls `signalGeometryUpdate()`, and the view,
 * which listens for geometry changes, rebuilds the line.
 */
@ASerializable("TutLineModel")
export class TutLineModel extends LineModel2D{
    /** Names of this node's control-panel entries. */
    static ControlKeys = {
        Height: "ZigzagHeight",
    }

    /** The number of points along the zigzag. */
    static NPoints = 9;

    /** The zigzag's length, in world units. */
    static Length = 3;

    /**
     * Adds the height slider. Static, because the scene model calls it before any node exists.
     * @param appState the app state
     */
    static SetAppState(appState: AppState){
        appState.addSliderIfMissing(TutLineModel.ControlKeys.Height, 0.4, 0, 1.5, 0.01);
    }

    constructor(){
        super();
        const height: number = GetAppState().getState(TutLineModel.ControlKeys.Height);
        for(let i=0;i<TutLineModel.NPoints;i++){
            // One color per point; the line blends each point's color into the next.
            this.verts.addVertex(this.pointAt(i, height), Color.FromString("#0044ff").GetSpun(i*0.4));
        }
        this.lineWidth = 0.02;
        this.subscribeToAppState(TutLineModel.ControlKeys.Height, (h: number)=>this.setHeight(h));
    }

    /**
     * The position of point `i` for a given zigzag height: alternately up and down.
     * @param i the point's index
     * @param height the zigzag's height
     */
    pointAt(i: number, height: number){
        const x = (i/(TutLineModel.NPoints-1) - 0.5)*TutLineModel.Length;
        const y = (i%2 === 0) ? height/2 : -height/2;
        return V2(x, y);
    }

    /**
     * Moves the existing points in place, then signals the change. Editing vertices in place isn't detected on its
     * own, so without `signalGeometryUpdate()` the line on screen wouldn't change.
     * @param height the zigzag's new height
     */
    setHeight(height: number){
        for(let i=0;i<TutLineModel.NPoints;i++){
            this.verts.position.setAt(i, this.pointAt(i, height));
        }
        this.signalGeometryUpdate();
    }
}
