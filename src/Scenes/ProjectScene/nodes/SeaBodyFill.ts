import {ASerializable, Color, LineModel2D, Mat3, V2, Vec2} from "../../../anigraph";
import {SeaModel} from "./SeaModel";

@ASerializable("SeaBodyFill")
export class SeaBodyFill extends LineModel2D {
    nCopies = 5;              // adjust to appropriately fill the sea
    seaColor = Color.Black();  // initialize a black color (arbitrary)
    copyColors: Color[] = Array(this.nCopies).fill(this.seaColor);

    static time: number = 0;   // time of current frame

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

    updateWaterBody(t: number) {
        const waveAmp = SeaModel.WaveAmplitude;
        const waveNumber = 2 * Math.PI / SeaModel.Wavelength;
        let waveTraveled = SeaModel.waveTravel;

        for (let i = 0; i < SeaModel.NSamples; ++i) {
            const x = this.SamplePts[i];
            const waterHeight = waveAmp * Math.sin(waveNumber
                * (x - waveTraveled)) + SeaModel.ripple[i];
            this.verts.position.setAt( i, V2(x, waterHeight) );
        }
        this.signalGeometryUpdate();  // tell the view to re-draw
    }

    getVertsForCopy(copyIdx: number): Mat3 {
        const waveAmp = SeaModel.WaveAmplitude;
        const waveNumber = 2 * Math.PI / SeaModel.Wavelength;
        let waveTraveled = SeaModel.waveTravel;
        const dt = 1/60;

        waveTraveled = SeaModel.waveTravel
            -(SeaModel.waveSpeed)
            * (copyIdx/this.nCopies) * SeaBodyFill.time * dt;

        for (let i = 0; i < SeaModel.NSamples; ++i) {
            const x = this.SamplePts[i];
            const waterHeight = waveAmp * Math.sin(waveNumber
                * (x - waveTraveled))
                + SeaModel.ripple[i];
            this.verts.position.setAt( i, V2(x, waterHeight) );
        }
        const y = -1 - copyIdx**1.4;
        return Mat3.Translation2D(0,y);
    }

    timeUpdate(t: number, ...args: any[]) {
        super.timeUpdate(t, ...args);
        this.updateWaterBody(t);
        SeaBodyFill.time = t;
    }
}