import {
    ANodeModel2D,
    AppState,
    ASerializable,
    Color,
    GetAppState,
    Mat3,
    Polygon2D,
    V2,
    Vec2
} from "../../../../anigraph";

/**
 * # A shape, plus the parameters for drawing copies of it
 *
 * This model holds one base shape (`verts`) and a few parameters. It doesn't draw anything. `RowOfCopiesView` draws
 * `nCopies` copies of the shape. For each copy `i`, it asks this model where the copy goes (`getTransformForCopy(i)`)
 * and what color it is (`getColorForCopy(i)`).
 *
 * Whenever a parameter changes, the model signals a custom event, `RowOfCopiesModel.Events.PARAMS_CHANGED`. The view
 * listens for that event and redraws the copies.
 *
 * The procedure here is deliberately simple: the copies sit in a row, and their colors blend from one color control
 * to another. To make a different arrangement, change `getTransformForCopy` and `getColorForCopy`. The view doesn't
 * need to change.
 */
@ASerializable("CVRowOfCopiesModel")
export class RowOfCopiesModel extends ANodeModel2D{
    /** Names of this node's control-panel entries. */
    static ControlKeys = {
        NCopies: "CopiesNCopies",
        Spacing: "CopiesSpacing",
        StartColor: "CopiesStartColor",
        EndColor: "CopiesEndColor",
        Wave: "CopiesWave",
    }

    /**
     * The starting value of every parameter. `SetAppState` gives these to the controls, and `readParams` falls back
     * on them if a control doesn't exist (for example, when the model is constructed without a control panel).
     */
    static Defaults = {
        nCopies: 8,
        spacing: 1.5,
        startColor: Color.FromString("#2a9df4"),
        endColor: Color.FromString("#f25c54"),
        wave: false,
    }

    /** The custom events this model signals. The string is the event's name; keep it unique to this class. */
    static Events = {
        PARAMS_CHANGED: "RowOfCopiesParamsChanged",
    }

    /** The size of the base shape, in world units. */
    static ShapeRadius = 0.8;

    /** How far the wave moves copies up and down, in world units. */
    static WaveAmplitude = 1;

    /** How many copies to draw. */
    nCopies: number = 1;
    /** The distance from one copy to the next, in world units. */
    spacing: number = 1;
    /** The color of the first copy. */
    startColor: Color = Color.White();
    /** The color of the last copy. The copies in between blend from `startColor` to this color. */
    endColor: Color = Color.White();
    /** Whether the copies bob up and down in a wave. */
    wave: boolean = false;
    /** The time of the current frame, set by `timeUpdate`. The wave uses it. */
    time: number = 0;

    /** The cursor position at the previous drag event, in world coordinates. Dragging moves the row by the difference. */
    lastDragPoint?: Vec2;

    /**
     * Adds this node's controls to the control panel. The scene model calls it from `initAppState`.
     * @param appState
     */
    static SetAppState(appState: AppState){
        const keys = RowOfCopiesModel.ControlKeys;
        const d = RowOfCopiesModel.Defaults;
        // Sliders: name, initial value, min, max, step size
        appState.addSliderIfMissing(keys.NCopies, d.nCopies, 1, 30, 1);
        appState.addSliderIfMissing(keys.Spacing, d.spacing, 0.2, 3, 0.01);
        // Color pickers: name, initial value
        appState.addColorControl(keys.StartColor, d.startColor);
        appState.addColorControl(keys.EndColor, d.endColor);
        // A checkbox: name, initial value
        appState.addCheckboxControl(keys.Wave, d.wave);
    }

    /**
     * Builds the base shape: a diamond centered at the origin, with its vertices listed **clockwise** (which
     * `APolygonGraphic2D` requires).
     * @param radius distance from the center to each corner
     */
    static BaseShape(radius: number): Polygon2D{
        // No per-vertex colors (`false`): each copy is drawn in one flat color.
        const polygon = Polygon2D.CreateForRendering(false);
        polygon.addVertex(V2(0, radius));
        polygon.addVertex(V2(0.6*radius, 0));
        polygon.addVertex(V2(0, -radius));
        polygon.addVertex(V2(-0.6*radius, 0));
        return polygon;
    }

    /**
     * Creates the base shape, reads the parameters from the control panel, and subscribes to the controls. Model
     * classes must be constructible with no arguments.
     */
    constructor(){
        super();
        this.setVerts(RowOfCopiesModel.BaseShape(RowOfCopiesModel.ShapeRadius));
        this.readParams();
        this.subscribeToParams();
    }

    /**
     * Copies every parameter from the control panel into this model's fields, falling back on `Defaults` for any
     * control that doesn't exist.
     */
    readParams(){
        const appState = GetAppState();
        const keys = RowOfCopiesModel.ControlKeys;
        const d = RowOfCopiesModel.Defaults;
        // Round, because a slider can report values like 7.999999, and nCopies is used as a count.
        this.nCopies = Math.round(appState.getState(keys.NCopies) ?? d.nCopies);
        this.spacing = appState.getState(keys.Spacing) ?? d.spacing;
        // clone() so this model has its own Colors, not the control panel's (or the Defaults') objects.
        this.startColor = (appState.getState(keys.StartColor) ?? d.startColor).clone();
        this.endColor = (appState.getState(keys.EndColor) ?? d.endColor).clone();
        this.wave = appState.getState(keys.Wave) ?? d.wave;
    }

    /**
     * Keeps the parameters in sync with the control panel: whenever any of these controls changes, read them all
     * again and tell listeners (the view) that the parameters changed.
     */
    subscribeToParams(){
        for(const key of Object.values(RowOfCopiesModel.ControlKeys)){
            this.subscribeToAppState(key, ()=>{
                this.readParams();
                this.signalParamsChanged();
            });
        }
    }

    /** Tells every listener that a parameter changed. Call it after changing any parameter. */
    signalParamsChanged(){
        this.signalEvent(RowOfCopiesModel.Events.PARAMS_CHANGED);
    }

    /**
     * Registers a callback to run whenever the parameters change. Returns a subscription handle; a view should pass
     * it to its own `subscribe(...)` so the callback is removed when the view is released.
     * @param callback
     * @param handle an optional name for the subscription
     */
    addParamsListener(callback: (...args: any[])=>void, handle?: string){
        return this.addEventListener(RowOfCopiesModel.Events.PARAMS_CHANGED, callback, handle);
    }

    /**
     * Where copy `i` goes, in this node's own coordinates. The view applies the node's transform on top of it, so
     * moving the node moves every copy.
     *
     * The copies sit in a row along x, `spacing` apart, centered on the origin. With the Wave checkbox on, each one
     * is also moved up or down by a sine of the time, a little behind the copy before it.
     *
     * It depends only on `i`, the parameters and the time, so the same inputs always give the same picture.
     * @param i the copy's index, from 0 to `nCopies - 1`
     */
    getTransformForCopy(i: number): Mat3{
        const x = (i - (this.nCopies-1)/2)*this.spacing;
        const y = this.wave ? RowOfCopiesModel.WaveAmplitude*Math.sin(3*this.time - 0.6*i) : 0;
        return Mat3.Translation2D(V2(x, y));
    }

    /**
     * The color of copy `i`: a blend from `startColor` (copy 0) to `endColor` (the last copy).
     * @param i the copy's index, from 0 to `nCopies - 1`
     */
    getColorForCopy(i: number): Color{
        // How far along the row this copy is, from 0 to 1. (With one copy, use 0 rather than dividing by 0.)
        const s = (this.nCopies > 1) ? i/(this.nCopies-1) : 0;
        const a = this.startColor;
        const b = this.endColor;
        return Color.FromRGBA(
            a.r + (b.r - a.r)*s,
            a.g + (b.g - a.g)*s,
            a.b + (b.b - a.b)*s,
            a.a + (b.a - a.a)*s,
        );
    }

    /**
     * The per-frame update. The copies only change over time when the wave is on, so only then does it record the
     * time and signal a change.
     * @param t the current time, in seconds
     */
    timeUpdate(t: number, ...args: any[]){
        super.timeUpdate(t, ...args);
        if(this.wave){
            this.time = t;
            this.signalParamsChanged();
        }
    }

    /**
     * The start of a drag. Remembers where it started, so `onDrag` can move by how far the cursor moved.
     * @param worldPoint the cursor, in world coordinates
     */
    onDragStart(worldPoint: Vec2){
        this.lastDragPoint = worldPoint.clone();
    }

    /**
     * A drag: moves the whole row by however far the cursor moved since the last drag event. This changes the node's
     * own transform, not the parameters, so no custom event is needed: the view's `update()` applies the transform.
     * @param worldPoint the cursor, in world coordinates
     */
    onDrag(worldPoint: Vec2){
        if(this.lastDragPoint !== undefined){
            const delta = worldPoint.minus(this.lastDragPoint);
            this.prsa.position = this.prsa.position.plus(delta);
        }
        this.lastDragPoint = worldPoint.clone();
    }
}
