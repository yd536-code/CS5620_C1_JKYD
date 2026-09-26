import {
    AGroupNodeModel2D,
    AppState,
    ASerializable,
    AssetManager,
    BezierTween,
    Color,
    GetAppState,
    Polygon2D,
    V2
} from "../../../../anigraph";
import {PolygonModel2D} from "../../../../anigraph/starter/nodes/polygon2D";

/**
 * # A group of shapes that orbit a center
 *
 * A group node with three small polygons as children. The children never move themselves: they sit at fixed
 * positions around the group's origin, and the *group* rotates. Because a child's transform is relative to its
 * parent, rotating the group carries the children around in a circle.
 *
 * `spin()` starts an extra, eased spin on top of the steady orbit, using the node's `addTimedAction`. The timed action
 * sets `spinAngle` every frame for the length of the spin, and `timeUpdate` adds `spinAngle` to the steady orbit. (The
 * timed action doesn't set the rotation itself, because `timeUpdate` sets the rotation every frame and would
 * overwrite it.)
 *
 * A group node draws nothing itself; the controller pairs it with `AGroupNodeView`.
 */
@ASerializable("HAOrbitGroupModel")
export class OrbitGroupModel extends AGroupNodeModel2D{
    /** Names of this node's control-panel entries. */
    static ControlKeys = {
        Radius: "OrbitRadius",
    }

    /** How fast the group turns, in radians per second. */
    static OrbitSpeed = 0.5;
    /**
     * The name of the spin's timed action. Giving the action a name keeps a second click from starting another spin
     * while one is running.
     */
    static SpinHandle = "Spin";
    /** How long a spin lasts, in seconds. */
    static SpinDuration = 2;
    /** How far a spin turns the group: two full turns, so it ends where it would have been anyway. */
    static SpinAngle = 4*Math.PI;

    /**
     * The spin's easing curve. `eval(x)` maps progress x in [0,1] to an eased value that starts at 0 and ends at 1.
     * These control points make it dip below 0 first (a wind-up backward) and go past 1 before settling (overshoot).
     */
    static SpinTween = new BezierTween(0.33, -0.6, 0.66, 1.6);

    /** The orbiting shapes. They are this group's children. */
    moons: PolygonModel2D[] = [];

    /** The extra rotation the current spin adds to the orbit, in radians. It is 0 when the group isn't spinning. */
    spinAngle: number = 0;

    /**
     * Adds this node's controls to the control panel. The scene model calls it from `initAppState`.
     * (The Spin! button is added by the scene model instead: a button calls a method on a particular instance, and
     * no instance exists yet when this static method runs.)
     * @param appState
     */
    static SetAppState(appState: AppState){
        appState.addSliderIfMissing(OrbitGroupModel.ControlKeys.Radius, 2.5, 0, 5, 0.01);
    }

    /**
     * A regular polygon, with its vertices listed clockwise.
     * @param nSides
     * @param radius
     * @param color
     */
    static RegularPolygon(nSides: number, radius: number, color: Color): Polygon2D{
        const polygon = Polygon2D.CreateForRendering(true);
        for(let i=0;i<nSides;i++){
            const theta = -i*2*Math.PI/nSides;
            polygon.addVertex(V2(Math.cos(theta), Math.sin(theta)).times(radius), color);
        }
        return polygon;
    }

    /**
     * Creates the three moons as children of this group.
     */
    constructor(){
        super();
        const moonSpecs: [number, string][] = [[3, "#e4572e"], [4, "#29a36a"], [5, "#8e44ad"]];
        for(const [nSides, color] of moonSpecs){
            const moon = new PolygonModel2D(OrbitGroupModel.RegularPolygon(nSides, 0.6, Color.FromString(color)));
            moon.setMaterial(AssetManager.Create2DRGBAMaterial());
            this.addChild(moon);
            this.moons.push(moon);
        }
    }

    /**
     * Starts a spin. Ignored while a spin is already running (the action's handle is still in use), because
     * restarting would make the rotation jump back.
     *
     * `addTimedAction(callback, duration, onDone, tween, handle)` calls `callback(progress)` every frame for `duration`
     * seconds, with `progress` going from 0 to 1, reshaped by the tween. The last call is always with progress exactly
     * 1, so the spin ends at exactly `SpinAngle`.
     */
    spin(){
        this.addTimedAction(
            (progress: number)=>{
                this.spinAngle = OrbitGroupModel.SpinAngle*progress;
            },
            OrbitGroupModel.SpinDuration,
            // Done. The spin ended at a whole number of turns, so dropping it doesn't make the group jump.
            ()=>{this.spinAngle = 0;},
            OrbitGroupModel.SpinTween,
            OrbitGroupModel.SpinHandle
        );
    }

    /**
     * Places the moons evenly around a circle, in this group's coordinates.
     * @param radius
     */
    layoutMoons(radius: number){
        this.moons.forEach((moon, i)=>{
            const theta = i*2*Math.PI/this.moons.length;
            moon.prsa.position = V2(Math.cos(theta), Math.sin(theta)).times(radius);
            moon.signalTransformUpdate();
        });
    }

    /**
     * Per-frame update. Only the group's rotation changes over time (plus the moons' distance from the center, if
     * the Radius slider moved); the moons move because they are children of the group.
     * @param t the current time, in seconds
     */
    timeUpdate(t: number, ...args: any[]){
        super.timeUpdate(t, ...args);
        this.layoutMoons(GetAppState().getState(OrbitGroupModel.ControlKeys.Radius));
        this.prsa.rotation = OrbitGroupModel.OrbitSpeed*t + this.spinAngle;
        this.signalTransformUpdate();
    }
}
