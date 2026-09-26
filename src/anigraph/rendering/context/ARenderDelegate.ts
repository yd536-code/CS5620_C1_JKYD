import {ARenderWindow} from "./ARenderWindow";
import {ARenderContext} from "./ARenderContext";
import {ConfirmInitialized} from "../../scene/ConfirmInitialized";

/**
 * What a render window needs from the object it drives (in practice, a scene controller): readiness checks, a
 * per-frame callback, and a resize callback.
 */
export interface ARenderDelegate extends ConfirmInitialized{
    /** True once the delegate is set up and frames can be rendered. */
    get isReadyToRender():boolean;
    /** Sets up rendering for the given window. */
    initRendering(renderWindow: ARenderWindow): Promise<void>;
    /** Called once per animation frame by the render window. */
    onAnimationFrameCallback(context: ARenderContext): void;
    /** Called when the browser window is resized. */
    onWindowResize(renderWindow: ARenderWindow): void;
    /** The render window driving this delegate. */
    get renderWindow(): ARenderWindow;
    /** Sets the render window driving this delegate. */
    setRenderWindow(renderWindow: ARenderWindow): void;
    /** The render context used for drawing. */
    get context(): ARenderContext;
}
