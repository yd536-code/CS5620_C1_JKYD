import {ANodeModel2D, ASerializable, AssetManager, Color, Polygon2D, V2, V3} from "../../../anigraph";
import {SeaModel} from "./SeaModel";
import {SampleWater} from "./WaterSurface";

@ASerializable("BoatModel")
export class BoatModel extends ANodeModel2D {
    // For a sealed Pyramidal Frustum
    static Mass = 700;
    static BoatTopWidth = 3;
    static BoatBotWidth = 2.1;
    static BoatHeight = 0.7;
    readonly WaterDensity = SeaModel.Density;

    static Throttle = 0;   // {-1, 1} Full left or right
    static Velocity = V3(0,0,0);   // X, Y, and angular Velocity
    static Acceleration = 18;
    static JumpSpeed = 8;
    static SlamSpeed = 8;

    private JumpUsed = 0;   // Check: to count double jumping
    private HasLeftWater = false;   // Check: allow double jumping only in air
    private IsSlamming = false; // Check: trigger slamming motion

    sampleWater: SampleWater = () => ({
        height: -Infinity, normal: { x: 0, y: 1}, velocityY: 0
    });

    get Inertia(): number {
        return BoatModel.Mass * (BoatModel.BoatBotWidth**2) / 6;
    } // inertia formula simplified by assuming a cube (https://dynref.engr.illinois.edu/rem.html)

    jump() {    // For boat's jumping action
        if (this.JumpUsed >= 2) return;   // prevent endless jumping
        ++this.JumpUsed;                  // accumulate occurred jumping
        this.IsSlamming = false;          // reset slam state
        BoatModel.Velocity.y = BoatModel.JumpSpeed; // apply upward speed (jump)
    }
    slam() {    // For boat's slamming action

    }

    constructor() {
        super();
        this.setVerts(BoatModel.makeBoat());
        this.setMaterial(AssetManager.Create2DRGBAMaterial());
    }

    static makeBoat(seaWidth:number = 200, seaDepth:number = 100): Polygon2D{
        // CreateForRendering(true) gives the polygon a color attribute, so each vertex can have its own color.
        let theBoat = Polygon2D.CreateForRendering(true);
        const BoatColor = Color.FromString("#cf7049");

        theBoat.addVertex(V2(-BoatModel.BoatTopWidth/2,  BoatModel.BoatHeight/2), BoatColor);
        theBoat.addVertex(V2( BoatModel.BoatTopWidth/2,  BoatModel.BoatHeight/2), BoatColor);
        theBoat.addVertex(V2( BoatModel.BoatBotWidth/2, -BoatModel.BoatHeight/2), BoatColor);
        theBoat.addVertex(V2(-BoatModel.BoatBotWidth/2, -BoatModel.BoatHeight/2), BoatColor);

        return theBoat;
    }
}