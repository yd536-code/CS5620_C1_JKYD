import {AppSceneModel2D} from "../../../anigraph/starter/App2D/AppSceneModel2D";
import {AObjectNode, AppState, AssetManager, V2} from "../../../anigraph";
import {
    ColorWheel,
    ExhibitModel,
    FlipbookModel,
    LayeringModel,
    MarkedShapeModel,
    TexturedQuad,
    WaveLineModel
} from "./nodes";

/**
 * The scene model: a gallery of seven exhibits, each showing one way to draw something. It creates the exhibits,
 * lays them out, forwards time to them, and passes clicks on to whichever exhibit was clicked. The exhibits do the
 * rest themselves.
 */
export class ShapesAndMaterialsSceneModel extends AppSceneModel2D{
    /** Names of the scene's own control-panel entries. */
    static ControlKeys = {
        Background: "Background",
    }

    /** The choices in the Background dropdown. */
    static BackgroundOptions = {
        Color: "Plain color",
        Space: "Space image",
    }

    /** The name the background image is stored under in the AssetManager. */
    static SpaceTextureName = "SpaceBackground";

    /** Every exhibit, in the order they are laid out. */
    exhibits: ExhibitModel[] = [];

    /**
     * Adds the control-panel controls: each node class adds its own, and the scene adds the background dropdown.
     * @param appState
     */
    initAppState(appState: AppState){
        super.initAppState(appState);
        FlipbookModel.SetAppState(appState);
        LayeringModel.SetAppState(appState);
        WaveLineModel.SetAppState(appState);
        // A dropdown: name, initial value, options. The controller reacts to it (see its initScene).
        appState.setSelectionControl(
            ShapesAndMaterialsSceneModel.ControlKeys.Background,
            ShapesAndMaterialsSceneModel.BackgroundOptions.Color,
            Object.values(ShapesAndMaterialsSceneModel.BackgroundOptions)
        );
    }

    /**
     * Loads every file the exhibits need, and the background image.
     */
    async PreloadAssets(): Promise<void> {
        await super.PreloadAssets();
        await ExhibitModel.PreloadAssets();
        await TexturedQuad.PreloadAssets();
        await FlipbookModel.PreloadAssets();
        await LayeringModel.PreloadAssets();
        await AssetManager.loadTexture("./images/SpaceBG.jpg", ShapesAndMaterialsSceneModel.SpaceTextureName);
    }

    /**
     * Creates the exhibits and lays them out in two rows. Each exhibit is a group node whose child is the thing on
     * display.
     */
    async initScene(){
        this.exhibits = [
            // Top row
            new ExhibitModel(ColorWheel.CreatePolygon(), V2(-7.5, 4.5)),
            new ExhibitModel(ColorWheel.CreateMesh(), V2(-2.5, 4.5)),
            new ExhibitModel(TexturedQuad.Create(), V2(2.5, 4.5)),
            new ExhibitModel(new FlipbookModel(), V2(7.5, 4.5)),
            // Bottom row
            new ExhibitModel(new LayeringModel(), V2(-5, -3)),
            new ExhibitModel(new WaveLineModel(), V2(0, -3)),
            new ExhibitModel(new MarkedShapeModel(), V2(5, -3)),
        ];
        for(const exhibit of this.exhibits){
            this.addNode(exhibit);
        }
    }

    /**
     * Called once per frame by the scene controller. Each exhibit updates its own content.
     * @param t the current time, in seconds
     */
    timeUpdate(t: number){
        for(const exhibit of this.exhibits){
            exhibit.timeUpdate(t);
        }
    }

    /**
     * Called by the controller with the node that was clicked (or `undefined` if the click missed everything).
     * The clicked node may be an exhibit's content, or a child of it, so walk up the scene graph to the exhibit.
     * @param node the node model under the cursor
     */
    onPick(node?: AObjectNode){
        let current: AObjectNode|undefined|null = node;
        while(current && !(current instanceof ExhibitModel)){
            current = current.parent;
        }
        if(current instanceof ExhibitModel){
            current.onPicked();
        }
    }
}
