import {ASerializable, AssetManager, Color, SeededRandom, V2, Vec2} from "../../../../anigraph";
import {PolygonModel2D} from "../../../../anigraph/starter/nodes/polygon2D";
import {makeNoise2D} from "fast-simplex-noise";
import {TutFactories} from "./TutFactories";

/**
 * Step 10.1: a small circle that drifts smoothly around its home position, driven by simplex noise. Nearby inputs
 * to a noise function give similar outputs, so sampling it at slowly increasing times gives a smooth, random-looking
 * path. (Try `Math.random()` instead to see the difference: jitter.)
 */
@ASerializable("TutNoiseModel")
export class TutNoiseModel extends PolygonModel2D{
    /** The seed for the noise. The same seed gives the same motion every run. */
    static Seed = 12345;

    /** How far the circle wanders from home, in world units. */
    static Distance = 0.8;

    /** How fast the noise is sampled; higher is faster, busier motion. */
    static Frequency = 0.5;

    /** The noise function: takes two numbers, returns a value between -1 and 1. */
    noise: (x: number, y: number)=>number;

    /** The point the circle wanders around. */
    home: Vec2;

    /**
     * @param home the point the circle wanders around
     */
    constructor(home: Vec2 = V2(0, 0)){
        super();
        const color = Color.FromString("#17a2b8");
        this.setVerts(TutFactories.RegularPolygon(24, 0.35, color));
        this.setMaterial(AssetManager.CreateBasicMaterial(color));
        this.home = home.clone();
        this.prsa.position = home.clone();
        this.noise = makeNoise2D(new SeededRandom(TutNoiseModel.Seed).rand);
    }

    /**
     * Sets the position to home plus a noise offset. x and y sample the noise along two rows (0 and 10) that are
     * far enough apart to be unrelated.
     * @param t the current time, in seconds
     * @param args anything else the caller passes
     */
    timeUpdate(t: number, ...args: any[]){
        super.timeUpdate(t, ...args);
        const s = t*TutNoiseModel.Frequency;
        const offset = V2(this.noise(s, 0), this.noise(s, 10)).times(TutNoiseModel.Distance);
        this.prsa.position = this.home.plus(offset);
    }
}
