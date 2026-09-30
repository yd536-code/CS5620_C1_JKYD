import {
    AppState,
    ASerializable,
    AssetManager,
    BezierTween,
    CallbackType,
    Color,
    GetAppState,
    V2
} from "../../../../anigraph";
import {PolygonModel2D} from "../../../../anigraph/starter/nodes/polygon2D";
import {AudioManager} from "../../../../anigraph/audio/AAudioManager";
import {TutFactories} from "./TutFactories";

/** The sound played by `pulse()` (step 9.1). Its path is also the name it's stored under. */
const POP_SOUND = "./sounds/Pop1.wav";

/**
 * The tutorial's first node (step 1.1): a regular polygon at the center of the scene. Later steps add to it:
 * - spinning (2.1), at a speed from a slider (3.1), using `dt` (7.1);
 * - a color picker and a number-of-sides slider, used through subscriptions, and a button that resets the speed
 *   slider (3.2);
 * - a custom event, "Ping" (3.3);
 * - an eased pulse (7.2, 7.3), with a sound (9.1);
 * - a highlight color, which the scene model turns on when another node is near (8.7).
 */
@ASerializable("TutShapeModel")
export class TutShapeModel extends PolygonModel2D{
    /** Names of this node's control-panel entries (steps 3.1 and 3.2). */
    static ControlKeys = {
        SpinSpeed: "SpinSpeed",
        Color: "ShapeColor",
        Sides: "ShapeSides",
        ResetSpeed: "ResetSpeed",
    }

    /** Names of the events this node signals (step 3.3). */
    static Events = {
        Ping: "TutShapePing",
    }

    /** The shape's radius. */
    static Radius = 1.2;

    /** The color used while the shape is highlighted (step 8.7). */
    static HighlightColor = Color.FromString("#ffcc00");

    /** Handle for the pulse's timed action (step 7.2). */
    static PulseHandle = "Pulse";

    /** How long a pulse lasts, in seconds. */
    static PulseDuration = 0.6;

    /** The pulse's easing curve: it overshoots before settling (step 7.2). Built once, as a static. */
    static PulseTween = new BezierTween(0.3, 0.0, 0.3, 1.6);

    /** The time of the last `timeUpdate`, for computing `dt` (step 7.1). */
    lastTime?: number;

    /** The extra scale the current pulse adds; 1 when not pulsing. The pulse sets it, and `timeUpdate` applies it. */
    pulseScale: number = 1;

    /** Whether the shape is currently highlighted (step 8.7). */
    highlighted: boolean = false;

    /**
     * Adds this node's controls (steps 3.1 and 3.2). Static, because the scene model calls it from `initAppState`,
     * before any node exists.
     * @param appState the app state
     */
    static SetAppState(appState: AppState){
        const keys = TutShapeModel.ControlKeys;
        // Slider: name, initial value, min, max, step
        appState.addSliderIfMissing(keys.SpinSpeed, 1, -5, 5, 0.01);
        appState.addColorControl(keys.Color, Color.FromString("#3377ff"));
        appState.addSliderIfMissing(keys.Sides, 6, 3, 12, 1);
        // setControlPanelStateValue changes the value and moves the slider; setState alone wouldn't move it.
        appState.addButton(keys.ResetSpeed, ()=>{
            GetAppState().setControlPanelStateValue(keys.SpinSpeed, 1);
        });
    }

    /** Loads the pop sound (step 9.1). */
    static async PreloadAssets(){
        await AudioManager.LoadSound(POP_SOUND, POP_SOUND);
    }

    /** Every argument has a default: model classes must be constructible with no arguments. */
    constructor(){
        super();
        const appState = GetAppState();
        this.setMaterial(AssetManager.CreateBasicMaterial(appState.getState(TutShapeModel.ControlKeys.Color)));
        this.rebuild(appState.getState(TutShapeModel.ControlKeys.Sides));

        // Step 3.2: subscriptions only fire on *changes*, so the lines above applied the current values once.
        this.subscribeToAppState(TutShapeModel.ControlKeys.Color, ()=>this.applyColor());
        this.subscribeToAppState(TutShapeModel.ControlKeys.Sides, (nSides: number)=>this.rebuild(nSides));
    }

    /**
     * Rebuilds the outline with a new number of sides. `setVerts` signals the geometry change, so the view redraws.
     * @param nSides the number of sides
     */
    rebuild(nSides: number){
        this.setVerts(TutFactories.RegularPolygon(Math.round(nSides), TutShapeModel.Radius, Color.White()));
    }

    /** Sets the basic material's color: the highlight color (step 8.7) or the color picker's (step 3.2). */
    applyColor(){
        const color: Color = this.highlighted ?
            TutShapeModel.HighlightColor : GetAppState().getState(TutShapeModel.ControlKeys.Color);
        this.material.setValue("color", color.asThreeJS());
    }

    /**
     * Step 8.7: turns the highlight on or off. The scene model calls this; the shape decides what highlighted
     * looks like.
     * @param highlighted whether to highlight
     */
    setHighlighted(highlighted: boolean){
        if(highlighted !== this.highlighted){
            this.highlighted = highlighted;
            this.applyColor();
        }
    }

    /** Step 3.3: signals the Ping event. The shape doesn't know who, if anyone, is listening. */
    ping(){
        this.signalEvent(TutShapeModel.Events.Ping);
    }

    /**
     * Step 3.3: listens for the Ping event. Wrapping `addEventListener` like this means callers don't need to know
     * the event's name.
     * @param callback called on every ping
     * @param handle optional name for the listener
     * @returns a callback switch; pass it to `subscribe` on the listening object
     */
    addPingListener(callback: CallbackType, handle?: string){
        return this.addEventListener(TutShapeModel.Events.Ping, callback, handle);
    }

    /**
     * Steps 7.2, 7.3 and 9.1: plays a pop and grows the shape briefly, with easing. A pulse that's already running
     * is canceled first, so repeated pulses restart instead of being ignored.
     */
    pulse(){
        AudioManager.playSound(POP_SOUND);
        if(this.hasSubscription(TutShapeModel.PulseHandle)){
            this.unsubscribe(TutShapeModel.PulseHandle);
        }
        this.addTimedAction(
            (progress: number)=>{
                // progress is already eased; sin(pi*progress) goes 0 -> 1 -> 0 over the pulse.
                this.pulseScale = 1 + 0.4*Math.sin(Math.PI*progress);
            },
            TutShapeModel.PulseDuration,
            ()=>{this.pulseScale = 1;},
            TutShapeModel.PulseTween,
            TutShapeModel.PulseHandle
        );
    }

    /**
     * Spins at the slider's speed (steps 2.1, 3.1), stepping by `dt` so that changing the speed doesn't make the
     * shape jump (step 7.1), and applies the pulse's scale (step 7.2).
     * @param t the current time, in seconds
     * @param args anything else the caller passes
     */
    timeUpdate(t: number, ...args: any[]){
        super.timeUpdate(t, ...args);
        // Clamped, so a long pause (such as switching browser tabs) doesn't make the shape jump.
        const dt = (this.lastTime === undefined) ? 0 : Math.min(t - this.lastTime, 0.05);
        this.lastTime = t;

        const speed: number = GetAppState().getState(TutShapeModel.ControlKeys.SpinSpeed);
        this.prsa.rotation += speed*dt;
        this.prsa.scale = V2(this.pulseScale, this.pulseScale);
    }
}
