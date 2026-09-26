import {AppState, ASerializable, AssetManager, Color, GetAppState, Polygon2D, V2, Vec2} from "../../../../anigraph";
import {PolygonModel2D} from "../../../../anigraph/starter/nodes/polygon2D";

/**
 * # A spiky star
 *
 * A star-shaped polygon controlled from the control panel: number of spikes, spikiness, scale, rotation and color.
 * The articulated arm is attached to it as a child (see the scene model), so whatever you do to the star's
 * transform also happens to the arm.
 *
 * This class uses its controls in two different ways, on purpose:
 * - **Subscribe** (spikes, spikiness, color): a callback runs only when the control changes, and rebuilds the
 *   geometry. Good for changes that are expensive to apply.
 * - **Read every frame** (scale, rotation): `timeUpdate` reads the current value and applies it. Simple, and fine for
 *   changes that are cheap to apply, like setting a transform.
 *
 * It is drawn by the engine's `PolygonView2D`.
 */
@ASerializable("HASpikyStarModel")
export class SpikyStarModel extends PolygonModel2D{
    /** Names of this node's control-panel entries. */
    static ControlKeys = {
        NumSpikes: "StarSpikes",
        Spikiness: "StarSpikiness",
        Scale: "StarScale",
        Rotation: "StarRotation",
        Color: "StarColor",
    }

    /** Distance from the center to the tip of each spike, in the star's own coordinates. */
    static OuterRadius = 1;

    /**
     * Adds this node's controls to the control panel. The scene model calls it from `initAppState`.
     * @param appState
     */
    static SetAppState(appState: AppState){
        // Sliders: name, initial value, min, max, step size
        appState.addSliderIfMissing(SpikyStarModel.ControlKeys.NumSpikes, 7, 3, 20, 1);
        appState.addSliderIfMissing(SpikyStarModel.ControlKeys.Spikiness, 0.5, 0, 0.9, 0.01);
        appState.addSliderIfMissing(SpikyStarModel.ControlKeys.Scale, 2, 0.2, 4, 0.01);
        appState.addSliderIfMissing(SpikyStarModel.ControlKeys.Rotation, 0, -Math.PI, Math.PI, 0.01);
        // A color picker: name, initial value
        appState.addColorControl(SpikyStarModel.ControlKeys.Color, Color.FromString("#f2a900"));
    }

    /**
     * Builds the star's outline. Each spike contributes two vertices: its tip (at `OuterRadius`) and the notch
     * halfway to the next tip (closer to the center). The vertices go around **clockwise** (negative angle step),
     * which polygons drawn by `APolygonGraphic2D` require.
     * @param nSpikes number of spikes
     * @param spikiness 0 gives a regular polygon; closer to 1 gives deeper notches
     * @param color the color of every vertex
     */
    static SpikyGeometry(nSpikes: number, spikiness: number, color: Color): Polygon2D{
        const polygon = Polygon2D.CreateForRendering(true);
        const step = -2*Math.PI/nSpikes;
        const notchRadius = SpikyStarModel.OuterRadius*(1-spikiness);
        for(let i=0;i<nSpikes;i++){
            const tipAngle = i*step;
            const notchAngle = (i+0.5)*step;
            polygon.addVertex(V2(Math.cos(tipAngle), Math.sin(tipAngle)).times(SpikyStarModel.OuterRadius), color);
            polygon.addVertex(V2(Math.cos(notchAngle), Math.sin(notchAngle)).times(notchRadius), color);
        }
        return polygon;
    }

    /**
     * Where the first spike's tip is, in the star's own coordinates. Vertex 0 is at angle 0, so this is on the +x
     * axis. The scene model attaches the arm here.
     */
    static FirstSpikeTip(): Vec2{
        return V2(SpikyStarModel.OuterRadius, 0);
    }

    constructor(){
        super();
        // The RGBA material colors each pixel from the colors of the nearby vertices.
        this.setMaterial(AssetManager.Create2DRGBAMaterial());

        // Subscriptions only fire when a control *changes*, so build the geometry once now from the current values.
        this.rebuildGeometry();

        // "Subscribe" style: rebuild whenever one of the shape controls changes.
        this.subscribeToAppState(SpikyStarModel.ControlKeys.NumSpikes, ()=>this.rebuildGeometry());
        this.subscribeToAppState(SpikyStarModel.ControlKeys.Spikiness, ()=>this.rebuildGeometry());
        this.subscribeToAppState(SpikyStarModel.ControlKeys.Color, ()=>this.rebuildGeometry());
    }

    /**
     * Replaces the star's vertices using the current control values.
     */
    rebuildGeometry(){
        const appState = GetAppState();
        // Round the slider value: it is used as a loop count.
        const nSpikes = Math.round(appState.getState(SpikyStarModel.ControlKeys.NumSpikes));
        const spikiness: number = appState.getState(SpikyStarModel.ControlKeys.Spikiness);
        const color: Color = appState.getState(SpikyStarModel.ControlKeys.Color);
        this.setVerts(SpikyStarModel.SpikyGeometry(nSpikes, spikiness, color));
        // Tell the view the geometry changed so it rebuilds its graphic.
        this.signalGeometryUpdate();
    }

    /**
     * "Read every frame" style: apply the scale and rotation controls to this node's transform.
     * The arm is a child of the star, so it is scaled and rotated along with it; nothing here has to know that.
     * (The arm doesn't animate on its own, so there is no child `timeUpdate` to call from here.)
     * @param t the current time, in seconds
     */
    timeUpdate(t: number, ...args: any[]){
        super.timeUpdate(t, ...args);
        const appState = GetAppState();
        const transform = this.prsa;
        transform.rotation = appState.getState(SpikyStarModel.ControlKeys.Rotation);
        // A single number scales x and y equally. (A Vec2 would scale them separately.)
        transform.scale = appState.getState(SpikyStarModel.ControlKeys.Scale);
        this.signalTransformUpdate();
    }
}
