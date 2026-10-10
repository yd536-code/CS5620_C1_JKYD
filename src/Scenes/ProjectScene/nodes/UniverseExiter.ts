import {AGroupNodeModel2D, ANodeModel2D, ASerializable, Color, Mat3, V2} from "../../../anigraph";
import {CosmicMicrowaveBackground} from "./CosmicMicrowaveBackground";
import {SeaBodyFill} from "./SeaBodyFill";

@ASerializable("UniverseExiter")
export class UniverseExiter extends AGroupNodeModel2D {
    _zValue: number = 0;
    lastTime: number = 0;
    set zValue(value: number) {
        this._zValue = value;
        this.signalGeometryUpdate();
    }
    get zValue() {
        return this._zValue;
    }

    static cosmicContract = 1/4;   // scale of cosmic contraction (after/before)
    static comicXShift = 2;

    static semiDiaBack = 20;   // initial semi-diameter of universe
    nSidesBack = 40;    // initial edges of universe (aim for a circle)
    colorBack = Color.FromString("#ccffff"); // color of universe background
    constructor() {
        super();
        const CMB = CosmicMicrowaveBackground
            .makeBackground(UniverseExiter.semiDiaBack, this.nSidesBack, this.colorBack);
        this.addChild(CMB);
    }

    takeTheUniverse(target: ANodeModel2D) {
        let childTransform = target.getWorldTransform();
        target.reparent(this, false);
        target.setTransform(this.getWorldTransform().getInverse()
            .times(childTransform));
    }

    t_contract_start: number | null = null;
    t_contract_length = 3;
    t_last = -1;  // keep track of animation's end
    // pass the time-step scaling factor (for waterline width to narrow down accordingly)
    contractTheUniverse(t: number): number {
        if (this.t_contract_start === null)
            this.t_contract_start = t;
        this.t_last = t;
        const progress = Math.max(0,Math.min(1,
            (t - this.t_contract_start)/this.t_contract_length)
        );  // clamped time ~[0,1]

        if (progress >= 1) {
            this.t_contract_start = null;
        } else {
            let t_anime =
                6*progress**5 - 15*progress**4 + 10*progress**3; // smoother animation transition
            t_anime = t_anime**1.3;   // ease-in
            const timeScaleFactor = 1 + t_anime *
                (UniverseExiter.cosmicContract - 1);
            const timeTranslateFactor = t_anime * UniverseExiter.comicXShift;
            this.convertTransformToPRSA();
            this.prsa.position = V2(timeTranslateFactor, 0);
            this.prsa.scale = timeScaleFactor;
        }
        return progress;
    }
}