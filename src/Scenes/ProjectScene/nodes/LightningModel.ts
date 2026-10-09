import {AppState, ASerializable, Color, GetAppState, LineModel2D, V2} from "../../../anigraph";

/**
 * Stores the lightning bolt's shape. Strike behavior and timing can be added here.
 */
@ASerializable("LightningModel")
export class LightningModel extends LineModel2D {
    //will hold weather impact frame is on yes or no
    impactActive = false;
    impactStartTime = -1;
    impactPhase = 0;
    afterimageActive = false;
    boltOpacity = 1;

    //adding a slider for the lightning time
    static SetAppState(appState: AppState) {
        appState.addSliderIfMissing("LightningDuration", 0.18, 0.01, 1, 0.005)
        appState.addSliderIfMissing("LightningAfterimageTime", 1.3, 0, 2, 0.05);
    }
    /** Creates a white zigzag whose bottom tip is at the node's position. */
    constructor() {
        super();
        this.lineWidth = 0.005;
        this.visible = false;

        // Local coordinates: placing this node at the boat puts the tip on the boat.
        const points = [
            V2(0, 30),
            V2(-0.5, 20),
            V2(0.4, 12),
            V2(-0.6, 7),
            V2(0.3, 4),
            V2(-0.2, 2),
            V2(0, 0),
        ];
        for (const point of points) {
            this.verts.addVertex(point, Color.White());
        }
    }

    onKeyPress(key: string){
        if (key.toLowerCase() == "r") {
            this.impactActive = true;
            this.impactStartTime = -1;

            //reset the after image after each strike
            this.afterimageActive = false;
            this.boltOpacity = 1;
        }
    }

    /** Called by the scene once connected; add the strike animation here. */
    timeUpdate(t: number, ...args: any[]) {
        super.timeUpdate(t, ...args);

        if(this.impactActive || this.afterimageActive){
            if(this.impactStartTime == -1){
                this.impactStartTime = t;
            }

            let elapsed = t - this.impactStartTime;
            let duration = GetAppState().getState("LightningDuration");
            let afterimageTime = GetAppState().getState("LightningAfterimageTime");

            //move through the phases to make the impact frames good
            if (elapsed < duration * (0.085 / 0.135)) {
                this.impactPhase = 1;
            } else if (elapsed < duration) {
                this.impactPhase = 2;
            } else if (afterimageTime > 0 && elapsed < duration + afterimageTime) {
                //making the after image of the lightning
                this.impactPhase = 0;
                this.impactActive = false;
                this.afterimageActive = true;

                let progress = (elapsed - duration) / afterimageTime;
                this.boltOpacity = 1 - progress;
            } else {
                //all finished
                this.impactPhase = 0;
                this.impactActive = false;
                this.afterimageActive = false;
                this.boltOpacity = 0;
            }
        }
    }
}
