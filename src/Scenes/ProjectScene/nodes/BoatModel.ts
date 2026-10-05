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

    static TopXSpeed = 10;
    static ThrustAccel = 30;
    static Deceleration = 20;

    private DashKey = "Control";
    private DashMultiplier = 2;
    private DashTimer = 0;
    private StopTimer = 0;

    static JumpSpeed = 8;
    static SlamSpeed = 8;
    private JumpUsed = 0;   // Check: to count double jumping
    private HasLeftWater = false;   // Check: allow double jumping only in air
    private IsSlamming = false; // Check: trigger slamming motion

    private PressedKeys = new Set<string>();

    sampleWater: SampleWater = () => ({
        height: -Infinity, normal: { x: 0, y: 1}, velocityY: 0
    });

    get AngularInertia(): number {
        return BoatModel.Mass * (BoatModel.BoatBotWidth**2) / 6;
    } // inertia formula simplified by assuming a cube (https://dynref.engr.illinois.edu/rem.html)

    get curThrottle() {
        return Number(this.PressedKeys.has('d')) - Number(this.PressedKeys.has('a'))
    }

    onKeyPress(key: string) { // browser reports any key pressed
        if (this.PressedKeys.has(key)) return; // prevent repeated jump/slam while *this* key held
        this.PressedKeys.add(key);  // remember *this* key until onKeyRelease()

        if (key === 'w') this.jump();                 // trigger jump
        if (key === 's') this.slam(this.sampleWater); // trigger slam

        if (this.PressedKeys.has(this.DashKey) && this.curThrottle !== 0)
            this.DashTimer = 0.25;
    }
    onKeyRelease(key: string) {  // browser reports any key released
        this.PressedKeys.delete(key);   // release *this* from pressed keys
    }
    resetInput() {
        this.PressedKeys.clear();
        this.DashTimer = 0;
        BoatModel.Throttle = 0;
    }
    private moveXVelocityToward(targetXSpeed: number, XSpeedChange: number) {
        const XSpeedDiff = targetXSpeed - BoatModel.Velocity.x;
        BoatModel.Velocity.x += Math.sign(XSpeedDiff) *
            Math.min( Math.abs(XSpeedDiff), XSpeedChange );
    }

    jump() {    // For boat's jumping action
        if (this.JumpUsed >= 2) return;   // prevent endless jumping
        ++this.JumpUsed;                  // accumulate occurred jumping
        this.IsSlamming = false;          // reset slam state
        BoatModel.Velocity.y = BoatModel.JumpSpeed; // apply upward speed (jump)
    }
    slam(sampleWater: SampleWater) {    // For boat's slamming action

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

    updateBoat(t: number, dt: number) {
        const TargetSpeed = this.curThrottle * BoatModel.TopXSpeed;
        // Is dashing && A/D key not released
        if (this.DashTimer > 0 && this.curThrottle !== 0) {
            this.StopTimer = 0.35;
            this.DashTimer -= dt;
            BoatModel.Velocity.x = TargetSpeed *
                (this.DashTimer <= 0 ? 1 : this.DashMultiplier);
        } else {  // DashTimer ends || Throttle is released
            this.DashTimer = 0;     // end dash
            if (this.curThrottle !== 0) { // throttle on
                this.StopTimer = 0.35;
                this.moveXVelocityToward(
                    TargetSpeed, BoatModel.ThrustAccel * dt
                );
            } else {  // throttle off
                this.StopTimer = Math.max(0, this.StopTimer-dt);
                const brakeStrength = 1 - this.StopTimer/0.35;
                this.moveXVelocityToward(
                    0, BoatModel.Deceleration * brakeStrength * dt
                );
            }
        }
        this.prsa.position.x += BoatModel.Velocity.x * dt;
    }

    timeUpdate(t: number, ...args: any[]) {
        super.timeUpdate(t, ...args);
        this.updateBoat(t, 1/60);
    }
}