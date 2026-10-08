import {ASerializable, Color, LineModel2D, Mat3, V2, Vec2} from "../../../anigraph";
import {SeaModel} from "./SeaModel";

@ASerializable("SeaBodyFill")
export class SeaBodyFill extends LineModel2D {
    nCopies = 6;              // adjust to appropriately fill the sea
    seaColor = Color.Black();  // initialize a black color (arbitrary)
    copyColors: Color[] = Array(this.nCopies).fill(this.seaColor);

    vanishPointPos: Vec2 = V2(0, 0); // default vanishing point @screen center
    vSceneFOV = Math.PI/4;    // heuristic Vertical Field of View of Scene (45-deg)

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
        this.lineWidth = 0.1;
    }

    getVertsForCopy(copyIdx: number): Mat3 {
        const waterYRef = SeaModel.deGlobalWarmer;  // reference waterline y-position

        // shift the current copy of waterline downward (from global 0)
        let yShift = -10 / (1-
            (this.nCopies-copyIdx) / (this.nCopies+1) * (1-10/SeaModel.deGlobalWarmer)
        );
        const PerspectiveDepthMultiplier =
              (this.vanishPointPos.y - yShift)
            / (this.vanishPointPos.y + waterYRef);

        const waveAmp = SeaModel.WaveAmplitude * PerspectiveDepthMultiplier;
        const wavelength = SeaModel.Wavelength * PerspectiveDepthMultiplier;

        const waveTravel = SeaModel.waveTravel * PerspectiveDepthMultiplier + copyIdx**2;

        for (let i = 0; i < SeaModel.NSamples; ++i) {
            const x = this.SamplePts[i];
            const waterHeight = waveAmp * Math.sin(2*Math.PI/wavelength
                * (x - waveTravel));
            this.verts.position.setAt( i, V2(x, waterHeight) );
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