import {ANodeModel2D, ASerializable, AssetManager, Color, Polygon2D, V2, V3, Vec2} from "../../../anigraph";
import {SeaModel} from "./SeaModel";
import {SampleWater} from "./WaterSurface";
import {SubmergedSection} from "./SubmergedSection";

@ASerializable("BoatModel")
export class BoatModel extends ANodeModel2D {
    // For a sealed extruded trapezoid
    static BoatTopWidth = 3;
    static BoatBotWidth = 2;
    static BoatHeight = 1;
    static BoatBreadth = 1;
    static BoatVolume = BoatModel.BoatBreadth*(BoatModel.BoatTopWidth+BoatModel.BoatBotWidth)*BoatModel.BoatHeight/2;
    static Mass = 400 * BoatModel.BoatVolume;
    readonly WaterDensity = SeaModel.Density;
    XPushFromWaterCoeff = 0;  // how much the water pulls the boat horizontally

    get hull() {
        return Array.from({length: this.verts.nVerts},
            (_, i)=>this.verts.vertexAt(i));
    }
    private lerp(val1: number, val2: number, t: number): number;
    private lerp(val1: Vec2, val2: Vec2, t: number): Vec2;
    private lerp(val1: number|Vec2, val2: number|Vec2, t: number): number|Vec2 {
        if (typeof val1 === "number" && typeof val2 === "number")
            return val1 * (1-t) + val2 * t;
        else if (typeof val1 === "object" && typeof val2 === "object")
            return V2(val1.x * (1-t) + val2.x * t,
                val1.y * (1-t) + val2.y * t);
        else
            throw new Error("Invalid argument: Expect consistent data type (number|Vec2)")
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
    private PressedKeys = new Set<string>();

    static JumpSpeed = 8;
    static SlamSpeed = 8;
    private JumpUsed = 0;   // Check: to count double jumping
    private wasAirborne = false; // Check if boat is in air
    private isSlamming = false; // Check if boat slams

    sampleWater: SampleWater = () => ({
        height: -Infinity, normal: { x: 0, y: 1}, velocityX: 0, velocityY: 0
    });
    // inertia formula simplified by assuming a cube (https://dynref.engr.illinois.edu/rem.html)
    get AngularInertia() {
        return BoatModel.Mass * (BoatModel.BoatBotWidth**2) / 12;
        // value tweaked for smoother gameplay
    }
    get curThrottle() {
        return Number(this.PressedKeys.has('d')) - Number(this.PressedKeys.has('a'))
    }

    onKeyPress(key: string) {
        if (this.PressedKeys.has(key)) return; // prevent repeated presses
        this.PressedKeys.add(key);  // remember *this* key until key released

        if (key === 'w') this.jump(this.sampleWater); // trigger jump
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
    getOffsetFromAnchor(vert: Vec2) {
        const CosRot = Math.cos(this.prsa.rotation);
        const SinRot = Math.sin(this.prsa.rotation);
        const localX = (vert.x - this.prsa.anchor.x) * this.prsa.scale.x;
        const localY = (vert.y - this.prsa.anchor.y) * this.prsa.scale.y;
        const offsetX = CosRot * localX - SinRot * localY;
        const offsetY = SinRot * localX + CosRot * localY;
        return { x: offsetX, y: offsetY };
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

    updateBoat(t:number, dt: number, sampleWater: SampleWater) {
        const Position = this.prsa.position;
        const Rotation = this.prsa.rotation;
        const Velocity = BoatModel.Velocity;

        const CosRot = Math.cos(Rotation);
        const SinRot = Math.sin(Rotation);
        const TargetSpeed = this.curThrottle * BoatModel.TopSpeed;

        const botSampleCnt = 10;
        const botLeft = this.hull[2];
        const botRight = this.hull[3];
        const WaterPts = Array.from( {length: botSampleCnt},
            (_, i) => {
            const t0 =  i   / botSampleCnt;
            const t1 = (i+1)/ botSampleCnt;

            const p0 = this.lerp(botLeft, botRight, t0);
            const p1 = this.lerp(botLeft, botRight, t1);
            const pm = this.lerp(botLeft, botRight, (t0+t1)/2);

            const panelLength = Math.hypot(p1.x-p0.x, p1.y-p0.y);
            const offset = this.getOffsetFromAnchor(pm);
            return {offsetX:     offset.x,      offsetY: offset.y,
                    panelLength: panelLength,
                    waterPt:     sampleWater(Position.x + offset.x),
            };
        });

        // (X, Y, angular)
        let WaterForce = {X:0, Y:0, Torque: 0};
        let isTouchingWater = false;
        let aveNormal = {X: 0, Y:0};
        let normalSamples = 0;

        const sampleCnt = WaterPts.length;
        for (const sample of WaterPts) {
            const { waterPt, offsetX, offsetY } = sample;
            const normal_magnitude = Math.hypot(
                waterPt.normal.x, waterPt.normal.y
            );  if (normal_magnitude < 1e-6) continue;

            let normal = {
                x: waterPt.normal.x / normal_magnitude,
                y: waterPt.normal.y / normal_magnitude,
            };
            if (normal.y < 0) {
                normal.x *= -1; normal.y *= -1;
            }

            // Fit boat vertices to waterline vertices
            // return {vert-along-surface, vert-perpendicular-to-surface}
            const hull2waterCoords = this.hull.map(vert => {
                const offset = this.getOffsetFromAnchor(vert);
                return V2(normal.y * offset.x - normal.x * offset.y,
                          normal.x * offset.x + normal.y * offset.y);
            });
            // signed local waterline offset along normal to boat's center
            const waterlineNormalOffset =
                normal.x * offsetX + normal.y * (waterPt.height - Position.y);

            // return [wetVerts.x = centroid x-coordinate, wetVerts.y = submerged area]
            const wetVerts = SubmergedSection(
                hull2waterCoords,
                waterlineNormalOffset,
            );

            if (wetVerts.Area <= 0) continue;
            isTouchingWater = true;

            const submergedDepth = Math.max(0,
                waterPt.height - (Position.y+offsetY));
            const displacedVolume =
                submergedDepth * sample.panelLength * BoatModel.BoatBreadth;
            const Buoyancy = this.WaterDensity * 9.81 * displacedVolume;

            const tangent = {x: normal.y, y: -normal.x};
            const BuoOffsetFromCOMX= tangent.x * wetVerts.CenterX
                                           + normal.x * wetVerts.CenterY;
            const BuoOffsetFromCOMY= tangent.y * wetVerts.CenterX
                                           + normal.y * wetVerts.CenterY;

            // velocity of boat vertex
            const PointVelocityX = Velocity.x - Velocity.z * BuoOffsetFromCOMY;
            const PointVelocityY = Velocity.y + Velocity.z * BuoOffsetFromCOMX;

            const boatRelativeNormalVelocity =
                  PointVelocityX * normal.x
                + PointVelocityY * normal.y;

            // stronger resistance when entering water than leaving
            // const DampRate = (boatRelativeNormalVelocity < 0) ? 6 : 2;
            const DampRate = 2;
            let DampForce = -DampRate
                                  * (BoatModel.Mass/sampleCnt)
                                  * boatRelativeNormalVelocity;

            const EffectiveSampleMass = BoatModel.Mass / sampleCnt;
            const MaxDampForce = 0.8 * EffectiveSampleMass
                * Math.abs(boatRelativeNormalVelocity)
                / Math.max(dt, 1e-5);
            DampForce = Math.max(-MaxDampForce,
                Math.min(MaxDampForce, DampForce)
            );

            const DampForceX = DampForce * normal.x;
            const DampForceY = DampForce * normal.y;

            const ForceX = DampForceX;
            const ForceY = Buoyancy + DampForceY;
            WaterForce.X += ForceX;
            WaterForce.Y += ForceY;

            WaterForce.Torque += BuoOffsetFromCOMX * ForceY * 1.1
                               - BuoOffsetFromCOMY * ForceX;

            aveNormal.X += normal.x * wetVerts.Area;
            aveNormal.Y += normal.y * wetVerts.Area;
            normalSamples += wetVerts.Area;
        }

        // Is dashing && A/D key not released
        if (this.DashTimer > 0 && this.curThrottle !== 0) {
            this.StopTimer = 0.35;
            this.DashTimer -= dt;
            Velocity.x = CosRot * TargetSpeed * (this.DashTimer <= 0 ? 1 : this.DashMultiplier);
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
                    BoatModel.Deceleration * brakeStrength * dt
                );
            }
        }
        // add horizontal pull to Velocity.x
        Velocity.x += this.XPushFromWaterCoeff * (WaterForce.X/BoatModel.Mass) * dt;
        Velocity.y += (WaterForce.Y / BoatModel.Mass   // Vertical buoyancy acceleration
                - 9.81) * dt;
        this.prsa.position.x += Velocity.x * dt;
        this.prsa.position.y += Velocity.y * dt;

        let RestoreTorque = 0;
        if (isTouchingWater && normalSamples > 1e-6) {
            let norX = aveNormal.X / normalSamples;
            let norY = aveNormal.Y / normalSamples;
            const norMagnitude = Math.hypot(norX, norY);
            if (norMagnitude > 1e-6) {
                norX /= norMagnitude;
                norY /= norMagnitude;
                const WaterTangentAngle = Math.atan2(-norX, norY);
                const UprightError = Math.atan2(
                    Math.sin(Rotation - WaterTangentAngle),
                    Math.cos(Rotation - WaterTangentAngle)
                );
                const UprightSpring = 3;
                const AngularDamp = 20;
                RestoreTorque = -UprightSpring * UprightError
                                -AngularDamp   * Velocity.z;
            } else { RestoreTorque = -2 * Velocity.z; }
        } else {
            // airborne angular damp
            RestoreTorque = -4 * Velocity.z;
        }

        Velocity.z += (WaterForce.Torque / this.AngularInertia
                     + RestoreTorque) * dt;
        this.prsa.rotation += Velocity.z * dt;

        // boat lands if (was airborne) and (is in water)
        const isAirborne    = this.isAirborne(sampleWater);
        const boatHasLanded = this.wasAirborne && !isAirborne;
        this.wasAirborne = isAirborne;   // update airborne status

        if (boatHasLanded) this.JumpUsed = 0;   // reset jump after boat in water
        if (this.isSlamming && !isAirborne) {
            // if boat has slammed into water
            this.isSlamming = false; // rest slam
            this.JumpUsed = 0;       // reset jump
        }
    }

    lastTime?: number;
    timeUpdate(t: number, ...args: any[]) {
        super.timeUpdate(t, ...args);
        const dt = (this.lastTime === undefined)
            ? 0 : Math.min(0.05, t - this.lastTime);
        this.lastTime = t;

        this.updateBoat(t, dt, this.sampleWater);
    }

    jump(sampleWater: SampleWater) {    // For boat's jumping action
        if (this.JumpUsed !== Number(this.isAirborne(sampleWater)))
            return;  // NO jumping if have had (2-jumps||1-jump but not airborne||0-jump but airborne)
        ++this.JumpUsed;            // accumulate occurred jumping
        this.isSlamming = false;    // reset slam state
        BoatModel.Velocity.y = (this.JumpUsed === 1) // apply upward speed (jump)
            ? BoatModel.JumpSpeed*1.1     // stronger first jump
            : BoatModel.JumpSpeed/1.2;    // weaker second jump
    }
    slam(sampleWater: SampleWater) {    // For boat's slamming action
        if (this.JumpUsed === 0 || !this.isAirborne(sampleWater))
            return; // NO slamming if (haven't jumped||not airborne)
        this.isSlamming = true; // update that boat IS slamming
        BoatModel.Velocity.y = Math.min(BoatModel.Velocity.y, -BoatModel.SlamSpeed);
    }

    // Check if boat's body completely in air
    isAirborne(sampleWater: SampleWater): boolean {
        const boatWorldPts = this.hull.map(vert => {
            const offset = this.getOffsetFromAnchor(vert);
            const pos = this.prsa.position;
            return { x: pos.x + offset.x, y: pos.y + offset.y };
        });
        let lowestDistFromWater = Infinity;
        for (let i = 0; i < boatWorldPts.length; ++i) {
            const pt1 = boatWorldPts[i];
            const pt2 = boatWorldPts[(i+1)%boatWorldPts.length];
            const nSampleAlongBoat = Math.max(1,
                Math.ceil(Math.hypot(pt2.x-pt1.x, pt2.y-pt1.y)/0.125)
            );
            for (let j = 0; j < nSampleAlongBoat; ++j) {
                const lerp = j / nSampleAlongBoat;
                const x = pt1.x + lerp*(pt2.x-pt1.x),
                      y = pt1.y + lerp*(pt2.y-pt1.y);
                lowestDistFromWater = Math.min(lowestDistFromWater,
                    y - sampleWater(x).height);
            }
        }
        return lowestDistFromWater > 0.001;
    }
}