import {AMeshModel2D, AppState, AssetManager, ASerializable, ATexture, GetAppState, VertexArray2D} from "../../../../anigraph";

/**
 * # A flipbook: switching textures over time
 *
 * A textured square that shows the digits 0 through 9, one after another, like the pages of a flipbook. Every frame,
 * `timeUpdate` works out which image should be showing *at the current time* and switches the material's texture if
 * it changed. Basing the frame on the time (not on a count of frames drawn) keeps the speed the same on fast and slow
 * computers.
 *
 * All ten images are loaded once, in `PreloadAssets`, and shared by every flipbook.
 */
@ASerializable("FlipbookModel")
export class FlipbookModel extends AMeshModel2D{
    /** Names of this node's control-panel entries. */
    static ControlKeys = {
        FramesPerSecond: "FlipbookFPS",
    }

    /** The images, in order. Filled in by `PreloadAssets`. */
    static Frames: ATexture[] = [];

    /** Which image is showing now. */
    currentFrame: number = 0;

    /**
     * Adds this node's slider: how many images to show per second.
     * @param appState
     */
    static SetAppState(appState: AppState){
        appState.addSliderIfMissing(FlipbookModel.ControlKeys.FramesPerSecond, 2, 0, 12, 0.1);
    }

    /**
     * Loads the ten digit images, once.
     */
    static async PreloadAssets(){
        if(FlipbookModel.Frames.length > 0){
            return;
        }
        for(let i=0;i<10;i++){
            FlipbookModel.Frames.push(await ATexture.LoadAsync(`./images/sequences/digits/${i}.png`));
        }
    }

    /**
     * A unit square with texture coordinates, showing the first image. Call `PreloadAssets()` first.
     */
    constructor(){
        super(VertexArray2D.SquareXYUV());
        this.setMaterial(AssetManager.Create2DTextureMaterial(FlipbookModel.Frames[0]));
    }

    /**
     * Shows the image for the current time.
     * @param t the current time, in seconds
     */
    timeUpdate(t: number, ...args: any[]){
        super.timeUpdate(t, ...args);
        if(FlipbookModel.Frames.length === 0){
            return;
        }
        const fps: number = GetAppState().getState(FlipbookModel.ControlKeys.FramesPerSecond);
        const frame = Math.floor(t*fps) % FlipbookModel.Frames.length;
        if(frame !== this.currentFrame){
            this.currentFrame = frame;
            // The textured material's image is its "diffuse" texture.
            this.material.setDiffuseTexture(FlipbookModel.Frames[frame]);
        }
    }
}
