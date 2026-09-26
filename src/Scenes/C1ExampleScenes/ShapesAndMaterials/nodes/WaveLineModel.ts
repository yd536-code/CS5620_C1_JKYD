import {AppState, ASerializable, Color, GetAppState, LineModel2D, V2} from "../../../../anigraph";

/**
 * # An animated line
 *
 * A sine wave drawn as a line through `NVerts` points, each with its own color, so the line fades through a rainbow.
 * Every frame, `timeUpdate` moves the points to make the wave travel, and the **LineWidth** slider sets how thick it
 * is. `WaveLineView` draws it.
 *
 * `LineModel2D` is the engine's model for a line through a list of points; it adds a `lineWidth` to the usual node
 * model.
 */
@ASerializable("WaveLineModel")
export class WaveLineModel extends LineModel2D{
    /** Names of this node's control-panel entries. */
    static ControlKeys = {
        LineWidth: "LineWidth",
    }

    /** Number of points along the line. More points make a smoother curve. */
    static NVerts = 40;

    /** The line's length and the wave's height, in world units. */
    static Length = 3.4;
    static Amplitude = 0.6;

    /**
     * Adds this node's slider.
     * @param appState
     */
    static SetAppState(appState: AppState){
        appState.addSliderIfMissing(WaveLineModel.ControlKeys.LineWidth, 0.02, 0.002, 0.1, 0.001);
    }

    /**
     * Creates the points, spaced evenly from left to right, with rainbow colors.
     */
    constructor(){
        super();
        const baseColor = Color.FromString("#ff0000");
        for(let i=0;i<WaveLineModel.NVerts;i++){
            const x = this.xForIndex(i);
            // Spin the hue a little further for each point.
            this.verts.addVertex(V2(x, 0), baseColor.GetSpun(1.5*Math.PI*i/(WaveLineModel.NVerts-1)));
        }
        this.lineWidth = GetAppState().getState(WaveLineModel.ControlKeys.LineWidth);
    }

    /**
     * The x coordinate of point `i`.
     * @param i
     */
    xForIndex(i: number): number{
        return (i/(WaveLineModel.NVerts-1) - 0.5)*WaveLineModel.Length;
    }

    /**
     * Moves every point up or down along a traveling sine wave, and applies the line width from the slider.
     * @param t the current time, in seconds
     */
    timeUpdate(t: number, ...args: any[]){
        super.timeUpdate(t, ...args);
        for(let i=0;i<WaveLineModel.NVerts;i++){
            const x = this.xForIndex(i);
            const y = WaveLineModel.Amplitude*Math.sin(3*x - 2*t);
            this.verts.position.setAt(i, V2(x, y));
        }
        // The vertices changed, so tell the view to redraw them.
        this.signalGeometryUpdate();

        // lineWidth is an @AObjectState property: setting it notifies the view on its own.
        const width: number = GetAppState().getState(WaveLineModel.ControlKeys.LineWidth);
        if(width !== this.lineWidth){
            this.lineWidth = width;
        }
    }
}
