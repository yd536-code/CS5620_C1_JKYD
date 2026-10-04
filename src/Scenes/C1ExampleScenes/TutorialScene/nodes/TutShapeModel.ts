import {
    ASerializable,
    Color,
    AssetManager,
    AGroupNodeModel2D,
    V2,
    AppState,
    GetAppState,
    CallbackType
} from "../../../../anigraph";
import {PolygonModel2D} from "../../../../anigraph/starter/nodes/polygon2D";
import {TutFactories} from "./TutFactories";

@ASerializable("TutShapeModel")
export class TutShapeModel extends PolygonModel2D {
    static Radius = 1.2;

    constructor() {
        super();
        const appState = GetAppState();
        this.setMaterial(AssetManager.CreateBasicMaterial(
            appState.getState(TutShapeModel.ControlKeys.Color)
        ));
        this.rebuild(appState.getState(TutShapeModel.ControlKeys.Sides));
        // Subscribe only if change occurs. Lines above applied only once and remained.
        this.subscribeToAppState(TutShapeModel.ControlKeys.Color,
            ()=>this.applyColor());
        this.subscribeToAppState(TutShapeModel.ControlKeys.Sides,
            (nSides:number)=>this.rebuild(nSides));
    }

    rebuild(nSides: number) { // reflect button's/slider's changes
        this.setVerts(TutFactories.RegularPolygon(
            Math.round(nSides), TutShapeModel.Radius, Color.White()
        ));
    }
    applyColor() {
        const color: Color = GetAppState().getState(TutShapeModel.ControlKeys.Color);
        this.material.setValue("color", color.asThreeJS());
    }
    timeUpdate(t: number, ...args: any[]){
        super.timeUpdate(t, ...args);
        const speed: number = GetAppState().getState(TutShapeModel.ControlKeys.SpinSpeed);
        this.prsa.rotation = speed * t;
    }

    static ControlKeys = {
        SpinSpeed:  "SpinSpeed",
        Color:      "ShapeColor",
        Sides:      "ShapeSides",
        ResetSpeed: "ResetSpeed",
    }
    static SetAppState(appState: AppState){
        const keys = TutShapeModel.ControlKeys;
        appState.addSliderIfMissing(keys.SpinSpeed, 1, -5, 5, 0.01);
        appState.addColorControl(keys.Color, Color.FromString("#3377ff"));
        appState.addSliderIfMissing(keys.Sides, 6, 3, 12, 1);
        appState.addButton(keys.ResetSpeed, ()=> {
            GetAppState().setControlPanelStateValue(keys.SpinSpeed, 1); // will also move the slider
        });
    }

    static Events = {
        Ping: "TutShapePing",
    }
    ping() {
        this.signalEvent(TutShapeModel.Events.Ping);
    }
    addPingListener(callback: CallbackType, handle?: string) {
        return this.addEventListener(TutShapeModel.Events.Ping, callback, handle);
    }
}