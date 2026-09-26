import {ASceneModel2D} from "./ASceneModel2D";
import {AGLContext, ARenderContext, Color} from "../../index"
import {ABasicSceneController, APanZoomInteractionMode2D} from "../index";

/**
 * Base class for a 2D (Three.js) app's scene controller. The scene controller handles keyboard and mouse input and
 * keeps the view hierarchy matched to the model hierarchy. Subclasses usually override:
 * - `initModelViewSpecs()`: say which view class to create for each of your model classes.
 * - `initInteractions()`: register interaction modes.
 * - `onAnimationFrameCallback(context)`: the per-frame loop. The default here calls
 *   `model.timeUpdate(model.clock.currentTime)`, updates the controller, and renders. You only need to override it to add
 *   per-frame controller work; if you do, call `super.onAnimationFrameCallback(context)` and don't call
 *   `model.timeUpdate` yourself, or the model will update twice per frame.
 *
 * The default interaction mode is {@link APanZoomInteractionMode2D} (drag to pan, wheel to zoom).
 */
export class ASceneController2D extends ABasicSceneController{
    /** The keys currently held down, according to the active interaction mode's keyboard interaction. */
    getKeysDownState(){
        return this.interactionMode.getKeyDownState();
    }
    get model():ASceneModel2D{
        return this._model as ASceneModel2D;
    }


    /**
     * Sets up the scene's rendering: a white background and Three.js object sorting (`renderer.sortObjects`), then the
     * base setup, which calls `initInteractions()`. Override to change the background color or image.
     * @returns {Promise<void>}
     */
    async initScene(): Promise<void> {
        this.setClearColor(Color.White());
        this.renderer.sortObjects = true;
        await super.initScene();
    }

    /**
     * Specifies which view class to use for each model class. If you create custom models and views, link them here
     * by calling `addModelViewSpec(ModelClass, ViewClass)`. Call `super.initModelViewSpecs()` first.
     */
    initModelViewSpecs() {
        super.initModelViewSpecs();

        // Example:
        // this.addModelViewSpec(SplineModel, SplineView);
    }

    /**
     * Runs once per frame: updates the model to the current time with
     * `this.model.timeUpdate(this.model.clock.currentTime)`, then updates the controller (interaction modes), then
     * renders the scene with a clear followed by a single render call. `currentTime` is computed when read (see
     * {@link AClock.currentTime}), so frame-to-frame time steps follow the real frame timing.
     */
    onAnimationFrameCallback(context: ARenderContext) {
        const glContext = context as AGLContext;
        /**
         * let's update the model...
         * The scene model's timeUpdate should in turn call timeUpdate on its top-level nodes.
         */
        this.model.timeUpdate(this.model.clock.currentTime);

        /**
         * and let's update the controller...
         * This will mostly update any interactions that depend on time.
         * Keep in mind that the model and controller run on separate clocks for this, since we may
         * want to pause our model's clock and continue interacting with the scene (e.g., moving the camera around).
         */
        this.timeUpdate();

        /**
         * Clear the rendering context.
         * you can also specify which buffers to clear: clear(color?: boolean, depth?: boolean, stencil?: boolean)
         * ``` this.renderer.clear(false, true); ```
         */
        glContext.renderer.clear();
        glContext.renderer.render(this.getThreeJSScene(), this.getThreeJSCamera());
    }

    /**
     * Registers the default interaction mode, {@link APanZoomInteractionMode2D}.
     *
     * This deliberately does **not** call `super.initInteractions()`, which would add the 3D fly/orbit
     * {@link ADebugInteractionMode}. That mode moves the wrapped `ACamera`'s pose, which a 2D camera model doesn't
     * render from, so it would do nothing here. Subclasses that override this usually call
     * `super.initInteractions()` and then register their own modes.
     */
    initInteractions() {
        this.addPanZoomInteractionMode();
    }

    /** Registers {@link APanZoomInteractionMode2D} and makes it the current interaction mode. The 2D counterpart of
     * {@link ABasicSceneController.addDebugInteractionMode}. */
    addPanZoomInteractionMode(){
        let panZoomMode = new APanZoomInteractionMode2D(this);
        this.defineInteractionMode(APanZoomInteractionMode2D.NameInGUI, panZoomMode);
        this.setCurrentInteractionMode(APanZoomInteractionMode2D.NameInGUI);
    }

    // getWorldCoordinatesOfCursorEvent (cursor -> world coordinates) is inherited from ASceneController.

}
