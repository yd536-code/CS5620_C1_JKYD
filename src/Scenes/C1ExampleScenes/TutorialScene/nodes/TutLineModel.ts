import {AppState, ASerializable, Color, GetAppState, LineModel2D, V2} from "../../../../anigraph";

@ASerializable("TutLineModel")
export class TutLineModel extends LineModel2D{
    static ControlKeys = { Height: "ZigzagHeight" }
    static NPoints = 9;
    static Length = 3;

    static SetAppState(appState: AppState){
        appState.addSliderIfMissing(TutLineModel.ControlKeys.Height, 0.4, 0, 1.5, 0.01);
    }

    constructor(){
        super();
        const height: number = GetAppState().getState(TutLineModel.ControlKeys.Height);
        for(let i=0;i<TutLineModel.NPoints;i++){
            this.verts.addVertex(this.pointAt(i, height), Color.FromString("#0044ff").GetSpun(i*0.4));
        }
        this.lineWidth = 0.02;
        this.subscribeToAppState(TutLineModel.ControlKeys.Height, (h: number)=>this.setHeight(h));
    }

    pointAt(i: number, height: number){
        const x = (i/(TutLineModel.NPoints-1) - 0.5)*TutLineModel.Length;
        return V2(x, (i%2 === 0) ? height/2 : -height/2);
    }

    setHeight(height: number){
        for(let i=0;i<TutLineModel.NPoints;i++){
            this.verts.position.setAt(i, this.pointAt(i, height));
        }
        this.signalGeometryUpdate();   // editing vertices in place isn't detected on its own
    }
}