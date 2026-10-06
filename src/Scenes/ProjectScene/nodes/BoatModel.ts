import {ANodeModel2D, ASerializable, AssetManager, Color, Polygon2D, V2, V3} from "../../../anigraph";
import {SeaModel} from "./SeaModel";
import {SampleWater} from "./WaterSurface";
import {SubmergedSection} from "./SubmergedSection";

@ASerializable("BoatModel")
export class BoatModel extends ANodeModel2D {
    // For a sealed extruded trapezoid
    static BoatTopWidth = 3/2;
    static BoatBotWidth = 2/2;
    static BoatHeight = 0.6/2;
    static BoatBreadth = 1;
    static BoatVolume = BoatModel.BoatBreadth*(BoatModel.BoatTopWidth+BoatModel.BoatBotWidth)*BoatModel.BoatHeight/2;
    static Mass = 500 * BoatModel.BoatVolume;
    readonly WaterDensity = SeaModel.Density;

    get hull() {
        return Array.from({length: this.verts.nVerts},
            (_, i)=>this.verts.vertexAt(i));
    }

    static Throttle = 0;   // {-1, 1} Full left or right
    static Velocity = V3(0,0,0);   // X, Y, and angular Velocity

    static TopSpeed = 6;
    static ThrustAccel = 14;
    static Deceleration = 2;

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
    // inertia formula simplified by assuming a cube (https://dynref.engr.illinois.edu/rem.html)
    // value tweaked for smoother gameplay
    get AngularInertia() {
        return BoatModel.Mass * (BoatModel.BoatBotWidth**2) / 12;
        // return BoatModel.Mass * (3 ** 2 + 0.7 ** 2) / 12;
    }
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

    jump() {    // For boat's jumping action
        if (this.JumpUsed >= 2) return;   // prevent endless jumping
        ++this.JumpUsed;                  // accumulate occurred jumping
        this.IsSlamming = false;          // reset slam state
        BoatModel.Velocity.y = BoatModel.JumpSpeed; // apply upward speed (jump)
        this.PressedKeys.delete('w');   // cost one 'w' per jump
    }
    slam(sampleWater: SampleWater) {    // For boat's slamming action
        if (!this.isAirborne(sampleWater)) return; // prevent slamming if not in air
        this.IsSlamming = true;
        BoatModel.Velocity.y = Math.min(BoatModel.Velocity.y, -BoatModel.SlamSpeed);
    }
    isAirborne(sampleWater: SampleWater): boolean {  // Check if boat's body completely in air
        return true;    // [Placeholder: waiting for implementation !!!]
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

    private moveXVelocityToward(targetXSpeed: number, XAccel: number) {
        const XSpeedDiff = targetXSpeed - BoatModel.Velocity.x;
        BoatModel.Velocity.x += Math.max(-XAccel,
            Math.min(XAccel, XSpeedDiff)
        );
    }
    lastTime?: number;
    updateBoat(t:number, sampleWater: SampleWater) {
        const dt = (this.lastTime === undefined) ? 0 : Math.min(t - this.lastTime, 1/60);
        this.lastTime = t;

        const Position = this.prsa.position;
        const Rotation = this.prsa.rotation;
        const Scale = this.prsa.scale;
        const Anchor = this.prsa.anchor;

        const V = BoatModel.Velocity;

        const CosRot = Math.cos(Rotation);
        const SinRot = Math.sin(Rotation);
        const TargetSpeed = this.curThrottle * BoatModel.TopSpeed;

        const hullBotCenter = V2(
            (this.hull[3].x+this.hull[2].x) / 2,
            (this.hull[3].y+this.hull[2].y) / 2,
        );
        const WaterPts = [this.hull[2], hullBotCenter, this.hull[3]]
            .map(vert=> {
                const localX = (vert.x - Anchor.x) * Scale.x;
                const localY = (vert.y - Anchor.y) * Scale.y;
                const offsetX = CosRot * localX - SinRot * localY;
                const offsetY = SinRot * localX + CosRot * localY;
                return {offsetX, offsetY,
                        waterPt: sampleWater(Position.x + offsetX, t),
                };
            });

        // (X, Y, angular)
        let WaterForce = {X:0, Y:0, Torque: 0};
        let isTouchingWater = false;
        let aveNormal = {X: 0, Y:0};
        let normalWeight = 0;

        const sampleCnt = WaterPts.length;
        for (const sample of WaterPts) {
            const { waterPt, offsetX, offsetY } = sample;
            const normal_magnitude = Math.hypot(
                waterPt.normal.x, waterPt.normal.y
            );  if (normal_magnitude < 1e-6) continue;

            const normal = {
                x: waterPt.normal.x / normal_magnitude,
                y: waterPt.normal.y / normal_magnitude,
            };

            // Fit boat vertices to waterline vertices
            // return {vert-along-surface, vert-perpendicular-to-surface}
            const hull2waterCoords = this.hull.map(vert => {
                const localX = (vert.x - Anchor.x) * Scale.x;
                const localY = (vert.y - Anchor.y) * Scale.y;
                // apply rotation 'matrix'
                const rotatedX = CosRot * localX - SinRot * localY;
                const rotatedY = SinRot * localX + CosRot * localY;
                // project onto sea's surface tangent and normal
                return V2(normal.y * rotatedX - normal.x * rotatedY,
                          normal.x * rotatedX + normal.y * rotatedY);
            });
            // waterline offset relative to boat's center
            const waterline =
                  normal.x * offsetX
                + normal.y * (waterPt.height - Position.y);
            // take   [V2[] of boat vertices, waterline-point relative to boat anchor]
            // return [wetVerts.x = centroid x-coordinate, wetVerts.y = submerged area]
            const wetVerts = SubmergedSection(
                hull2waterCoords,
                waterline,
            ); if (wetVerts.Area <= 0) continue;

            isTouchingWater = true;
            // each sample contributes (1/3) of (rho * g * V)
            const Buoyancy = this.WaterDensity * 9.81 * BoatModel.BoatBreadth
                    * wetVerts.Area / sampleCnt;
            // velocity of boat along local water normal
            const RelativeNormalVelocity =
                (V.x - V.z * offsetY) * normal.x
              + ((V.y + V.z * offsetX) - (waterPt.velocityY??0)) * normal.y;

            const DampRate = (RelativeNormalVelocity < 0) ? 6 : 2;
            let DampForce = -DampRate
                * (BoatModel.Mass/sampleCnt)
                * RelativeNormalVelocity;

            const EffectiveSampleMass = BoatModel.Mass / sampleCnt;
            const MaxDampForce = 0.8 * EffectiveSampleMass
                * Math.abs(RelativeNormalVelocity)
                / Math.max(dt, 1e-5);
            DampForce = Math.max(-MaxDampForce,
                Math.min(MaxDampForce,
                    DampForce
                )
            );

            const normalForce = Math.max(
                0,
                Buoyancy + DampForce
            );

            // console.log(normal.y);
            WaterForce.X      += normalForce * normal.x;
            WaterForce.Y      += normalForce * normal.y;
            WaterForce.Torque += normalForce * wetVerts.CenterX;

            aveNormal.X += normal.x * normalForce;
            aveNormal.Y += normal.y * normalForce;
            normalWeight += normalForce;
        }

        // Is dashing && A/D key not released
        if (this.DashTimer > 0 && this.curThrottle !== 0) {
            this.StopTimer = 0.35;
            this.DashTimer -= dt;
            V.x = CosRot * TargetSpeed * (this.DashTimer <= 0 ? 1 : this.DashMultiplier);
        } else {  // DashTimer ends || Throttle is released
            this.DashTimer = 0;     // end dash
            if (this.curThrottle !== 0) { // throttle on
                this.StopTimer = 0.4;
                this.moveXVelocityToward(TargetSpeed,
                     BoatModel.ThrustAccel * dt
                );
            } else {  // throttle off
                this.StopTimer = Math.max(0, this.StopTimer-dt);
                const brakeStrength = 1 - this.StopTimer/0.4;
                this.moveXVelocityToward(0,
                    // (1 + SinRot/2) * // decelerate harder if boat being virtical
                    BoatModel.Deceleration * brakeStrength * dt
                );
            }
        }

        V.x += 0.5 * ( WaterForce.X / BoatModel.Mass ) * dt;
        V.y += (
            WaterForce.Y / BoatModel.Mass   // Vertical buoyancy acceleration
            - 9.81  // gravity (value tweaked for smoother gameplay)
            // + Recovery
            // + VerticalResistance * verticalSpeedOffset
        ) * dt;

        this.prsa.position.x += V.x * dt;
        this.prsa.position.y += V.y * dt;

        let RestoreTorque = 0;
        if (isTouchingWater && normalWeight > 1e-6) {
            const nor_x = aveNormal.X / normalWeight;
            const nor_y = aveNormal.Y / normalWeight;
            const WaterTanAngle = Math.atan2(-nor_x, nor_y);
            const UprightError = Math.atan2(
                Math.sin(Rotation - WaterTanAngle),
                Math.cos(Rotation - WaterTanAngle)
            );
            RestoreTorque =
                -20 * UprightError
                -10 * V.z;
        } else {
            RestoreTorque = -15 * V.z;
        }

        V.z += (
              WaterForce.Torque / this.AngularInertia
            + RestoreTorque
        ) * dt;
        this.prsa.rotation += V.z * dt;
    }

    timeUpdate(t: number, ...args: any[]) {
        super.timeUpdate(t, ...args);
        this.updateBoat(t, this.sampleWater);
    }
}