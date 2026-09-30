import {AMeshModel2D, AppState, AssetManager, ASerializable, ATexture, GetAppState, VertexArray2D} from "../../../../anigraph";

/**
 * Step 6.5 (optional): a flipbook. A textured square that switches between ten loaded images (the digits 0 to 9)
 * over time, at a rate set by a slider. The frame is chosen from the time, not by counting frames drawn, so it
 * plays at the same speed on fast and slow computers.
 *
 * It's a subclass of `AMeshModel2D`, so it needs its own spec: `addModelViewSpec(TutFlipbookModel, AMeshView2D)`.
 */
@ASerializable("TutFlipbookModel")
export class TutFlipbookModel extends AMeshModel2D{
    /** Names of this node's control-panel entries. */
    static ControlKeys = {
        FramesPerSecond: "FlipbookFPS",
    }

    /** The loaded frames, shared by every flipbook. */
    static Frames: ATexture[] = [];

    /** The index of the frame being shown. */
    currentFrame: number = 0;

    /**
     * Adds the frame-rate slider.
     * @param appState the app state
     */
    static SetAppState(appState: AppState){
        appState.addSliderIfMissing(TutFlipbookModel.ControlKeys.FramesPerSecond, 2, 0, 12, 0.1);
    }

    /** Loads the ten frames, once. */
    static async PreloadAssets(){
        if(TutFlipbookModel.Frames.length > 0){
            return;
        }
        for(let i=0;i<10;i++){
            TutFlipbookModel.Frames.push(await ATexture.LoadAsync(`./images/sequences/digits/${i}.png`));
        }
    }

    constructor(){
        super(VertexArray2D.SquareXYUV());
        this.setMaterial(AssetManager.Create2DTextureMaterial(TutFlipbookModel.Frames[0]));
    }

    /**
     * Shows the frame for the current time, switching the material's image only when the frame changes.
     * @param t the current time, in seconds
     * @param args anything else the caller passes
     */
    timeUpdate(t: number, ...args: any[]){
        super.timeUpdate(t, ...args);
        const fps: number = GetAppState().getState(TutFlipbookModel.ControlKeys.FramesPerSecond);
        const frame = Math.floor(t*fps) % TutFlipbookModel.Frames.length;
        if(frame !== this.currentFrame){
            this.currentFrame = frame;
            this.material.setDiffuseTexture(TutFlipbookModel.Frames[frame]);  // the image is the "diffuse" texture
        }
    }
}
