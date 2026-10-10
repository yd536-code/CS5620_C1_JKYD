import {ASerializable, Color, LineModel2D, Mat3, V2, Vec2} from "../../../anigraph";
import {SeaModel} from "./SeaModel";
import {UniverseExiter} from "./UniverseExiter";

@ASerializable("SeaBodyFill")
export class SeaBodyFill extends LineModel2D {
    nCopies = 10;              // adjust to appropriately fill the sea
    seaColor = Color.Black();  // initialize a black color (arbitrary)
    copyColors: Color[] = Array(this.nCopies).fill(this.seaColor);

    vanishPointPos: Vec2 = V2(0, 0); // default vanishing point @screen center

    time: number = 0;   // time of current frame
    SamplePts: number[] = [];
    constructor(CurSea: SeaModel) {
        super();
        this.seaColor = CurSea.SeaColor;
        for (let i = 0; i < SeaModel.NSamples; ++i) {
            const SamplePt = CurSea.verts.vertexAt(i);
            this.verts.addVertex(V2(SamplePt.x, -5), this.seaColor);
            this.SamplePts.push(SamplePt.x);
        }
        this.copyColors.fill(this.seaColor);
        this.lineWidth = SeaModel.SeaLineWidth;
    }

    getVertsForCopy(copyIdx: number): Mat3 {
        const waterYRef = SeaModel.deGlobalWarmer;  // reference waterline y-position
        // shift the current copy of waterline downward (from global 0)
        const curSeaDepth = SeaModel.SeaDepth;
        const refYShift = SeaModel.deGlobalWarmer;

        const yShiftNumerator = -this.nCopies * refYShift * curSeaDepth;
        const yShiftDenominator = (copyIdx+1) * (refYShift-curSeaDepth) + curSeaDepth*this.nCopies;
        const yShift = yShiftNumerator / yShiftDenominator;
        const PerspectiveDepthMultiplier =
              (this.vanishPointPos.y - yShift)
            / (this.vanishPointPos.y + waterYRef);

        const waveAmp = SeaModel.WaveAmplitude * PerspectiveDepthMultiplier;
        const wavelength = SeaModel.Wavelength * PerspectiveDepthMultiplier;

        const waveTravel = SeaModel.waveTravel * PerspectiveDepthMultiplier + copyIdx**2;

        const universeR = UniverseExiter.semiDiaBack;
        const universeXbound = 0.99 * Math.sqrt(universeR**2 - yShift**2);
        for (let i = 0; i < SeaModel.NSamples; ++i) {
            let x = this.SamplePts[i];
            let waterHeight = waveAmp * Math.sin(2 * Math.PI / wavelength * (x - waveTravel));
            if (copyIdx === this.nCopies-1) {
                waterHeight *= Math.exp(-((2*x/universeR)**4)); // harsher edge ease for bottom waterline
                x = Math.max(-0.96*universeXbound, Math.min(0.96*universeXbound,x)); // edge clip
            } else {
                waterHeight *= Math.exp(-((1.1*x/universeR)**4));
                x = Math.max(-universeXbound, Math.min(universeXbound,x));
            }
            this.verts.position.setAt(i, V2(x, waterHeight));
        }
        return Mat3.Translation2D(0, yShift);
    }

    previousTime?: number;
    timeUpdate(t: number, ...args: any[]) {
        super.timeUpdate(t, ...args);
        this.previousTime = (this.time === undefined)
            ? 0 : Math.min(0.05, t - this.time);
        this.time = t;
        this.signalGeometryUpdate();
    }
}