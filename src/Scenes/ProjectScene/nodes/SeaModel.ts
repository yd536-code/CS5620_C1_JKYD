import {
    ASerializable,
    Color,
    LineModel2D,
    V2
} from "../../../anigraph";
import {WaterSample} from "./WaterSurface";
import {BoatModel} from "./BoatModel";
import {AppState, GetAppState} from "../../../anigraph";

@ASerializable("SeaModel")
export class SeaModel extends LineModel2D {
    static Density = 1000;  // water: kg/m3
    static SeaDepth= 14;  // imaginary depth into screen (passed to SeaBodyFill to actually create seaBody as an area)
    static SeaHalfWidth = 19.9; // width of seaBody shape
    static SeaLineWidth = 0.005;
    SeaColor = Color.FromString("#4587f8");

    static deGlobalWarmer = 1; // distance below horizontal center of the screen

    static waveSpeed = 3;
    static scrollSpeed = 3;
    static WaveTopSpeed = 10;
    static WaveAccel = 4;
    static WaveAmplitude = 0.2;
    static Wavelength = 4;

    static NSpacing = 0.25;
    static NSamples = 1 + Math.floor(2 * SeaModel.SeaHalfWidth / SeaModel.NSpacing);

    static time = 0;
    static ripple= new Float32Array(SeaModel.NSamples);
    static YVelocity= new Float32Array(SeaModel.NSamples);
    static pending= new Float32Array(SeaModel.NSamples); // pending change due to the boat

    xForIdxOf(idx : number): number{
        return idx * SeaModel.NSpacing - SeaModel.SeaHalfWidth
    }

    constructor() {
        super();
        for (let i = 0; i < SeaModel.NSamples; ++i) {
            const x = this.xForIdxOf(i);
            this.verts.addVertex(V2(x,-SeaModel.deGlobalWarmer), this.SeaColor);
        }
        this.lineWidth = SeaModel.SeaLineWidth;
    }

    static SetAppState(appState: AppState) {
        appState.addSliderIfMissing("WaterSpeedMultiplier", 1, 0, 3, 0.1);
    }

    private PressedKeys = new Set<string>();
    get waveThrottle() {
        return Number(this.PressedKeys.has('ArrowRight'))
             - Number(this.PressedKeys.has('ArrowLeft'))
    }

    onKeyPress(key: string) {
        if (this.PressedKeys.has(key))
            return; // prevent repeated press
        this.PressedKeys.add(key);  // remember *this* key until key released
    }
    onKeyRelease(key: string) {  // browser reports any key released
        this.PressedKeys.delete(key);   // release *this* from pressed keys
        // SeaModel.WaveTopSpeed = Math.sign(SeaModel.WaveTopSpeed);
    }

    // Advance water
    static waveTravel: number = 0;
    updateWater(t: number, dt: number,
                BoatProp0toBound: number, BoatThrollet: number) {
        // proportion of max speed addition from that of boat due to boundary ~[0,1]
        const TakeSpeedFromBoat = Math.abs(BoatProp0toBound);
        const newTopSpeed = SeaModel.WaveTopSpeed + 2*BoatModel.TopSpeed * TakeSpeedFromBoat;
        const boatBoundCausedAccel = 3 * BoatModel.ThrustAccel * BoatProp0toBound;
        const boatThrolletCausedAccel = BoatModel.ThrustAccel * BoatThrollet
            * (BoatThrollet === Math.sign(SeaModel.waveSpeed)
                ? 7 : 3);
        SeaModel.waveSpeed += (this.waveThrottle * SeaModel.WaveAccel
                            - boatBoundCausedAccel - boatThrolletCausedAccel) * dt;
        SeaModel.waveSpeed = Math.max(-newTopSpeed,
            Math.min(newTopSpeed, SeaModel.waveSpeed)
        );  // clamp to top wave speed
        //so we can change the accalaration speed with a slider
        let multiplier = GetAppState().getState("WaterSpeedMultiplier");

        SeaModel.scrollSpeed = SeaModel.waveSpeed * multiplier;
        SeaModel.waveTravel += SeaModel.scrollSpeed * dt;
        const waveAmp = SeaModel.WaveAmplitude; // wave amplitude (m)
        const lambda = SeaModel.Wavelength;     // wavelength (m)
        const dx2 = SeaModel.NSpacing**2;       // squared spatial resolution (Δx)²

        // Formulas from (https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models)
        // I asked ChatGPT to point me to relevant equations.
        for (let i = 1; i < SeaModel.NSamples; ++i) {
            // 1. Spatial curvature (1D Discrete Laplacian)
            const curvature = (
                SeaModel.ripple[i-1] - 2*SeaModel.ripple[i] + SeaModel.ripple[i+1]
            ) / dx2;

            // 2. Boundary absorption (suppress edge reflection)
            const dist2center = Math.abs(this.xForIdxOf(i));
            const dampBound = 90;   // as X spans [-100,100], let the bound be |X| > dampBound
            const dampCoef = 10;    // smooth out velocity reduction due to damping
            const edgeDamp = Math.max(0,
                (dist2center - dampBound)/dampCoef
            );

            // 3. Acceleration: wave propagation - equilibrium pull - damping
            const waveAccel    = (SeaModel.waveSpeed**2) * curvature;
            const restoreAccel = -5 * SeaModel.ripple[i];
            const dampAccel    = -(1.5 + 5 * edgeDamp) * SeaModel.YVelocity[i];

            // 4. Integrate Accels' and apply external boat impulses
            const netAccel = waveAccel + restoreAccel + dampAccel;
            SeaModel.YVelocity[i] += (netAccel*dt) + SeaModel.pending[i];
        }
        // 5. Integrate height's
        for (let i = 1; i < SeaModel.NSamples - 1; ++i)
            SeaModel.ripple[i] += SeaModel.YVelocity[i] * dt;
        SeaModel.pending.fill(0);   // Reset queued boat impulses

        // 6. Update rendered seaBody-surface-outline to View
        for (let i = 0; i < SeaModel.NSamples; ++i) {
            const x = this.xForIdxOf(i);
            const k = 2 * Math.PI / lambda;
            const y = waveAmp * Math.sin(k * (x - SeaModel.waveTravel)) + SeaModel.ripple[i];
            this.verts.position.setAt(i, V2(x,y-SeaModel.deGlobalWarmer));
        }
        this.signalGeometryUpdate();  // tell the view to re-draw
    }

    sampleWaterAtX(X: number): WaterSample {
        const localX = X - this.transform.getPosition().x;
        const k = 2 * Math.PI / SeaModel.Wavelength;
        const cur_idx = (localX + SeaModel.SeaHalfWidth) / SeaModel.NSpacing; // "exact" index w/ decimals

        // clamp to keep (prev_idx+1) valid
        const pre_idx = Math.min(SeaModel.NSamples-2, Math.floor(cur_idx)); // previous, integer index
        const lerp = cur_idx - pre_idx;

        const pre_vert = this.verts.vertexAt(pre_idx);
        const suf_vert = this.verts.vertexAt(pre_idx+1);

        // Interpolate the water level
        const heightInterpolated = this.transform.getPosition().y
                                         + pre_vert.y * (1 - lerp)
                                         + suf_vert.y * lerp;

        const slope = (suf_vert.y - pre_vert.y)/SeaModel.NSpacing;
        const carrierYVelocity = (idx: number): number=> {
            const vert_x = this.xForIdxOf(idx);
            return -SeaModel.WaveAmplitude * k * SeaModel.scrollSpeed
                * Math.cos(k * (vert_x - SeaModel.waveTravel));
        };

        const pre_YVelocity = carrierYVelocity(pre_idx)
                                 + SeaModel.YVelocity[pre_idx];
        const suf_YVelocity = carrierYVelocity(pre_idx+1)
                                 + SeaModel.YVelocity[pre_idx+1];
        const YVelocityInterpolated =
            pre_YVelocity * (1 - lerp) +
            suf_YVelocity * lerp;

        const norLength = Math.hypot(slope, 1);
        const surfaceNormal = {
            x: -slope / norLength,
            y : 1 / norLength,
        };

        return { height: heightInterpolated, normal: surfaceNormal,
                 velocityX: 0, velocityY: YVelocityInterpolated, };
    }

    lastTime?: number;
    timeUpdate(t: number, ...args: any[]) {
        super.timeUpdate(t, ...args);
        const dt = (this.lastTime === undefined)
            ? 0 : Math.min(0.05, t - this.lastTime);
        this.lastTime = t;

        this.updateWater(t, dt, args[0], args[1]);
    }
}