import {ALabel} from "../../base";
import {ATwoJSContext} from "./ATwoJSContext";
import {ARenderWindow} from "./ARenderWindow";
import type {ASceneController} from "../../scene";

/**
 * Render window for Two.js-backed 2D scenes.
 *
 * Owns the {@link ATwoJSContext} (which wraps the `Two` instance) and drives the
 * animation loop via `requestAnimationFrame`. The container `<div>` is set
 * by `setContainer`, called from `ATwoJSContextComponent`'s `useEffect` after
 * the React component mounts.
 *
 * **Render loop** (per frame):
 * 1. `requestAnimationFrame` fires `render()`.
 * 2. If the controller is initialized and ready, call
 *    `controller.onAnimationFrameCallback(context)` — this advances the model
 *    clock (`model.timeUpdate()`). Model changes reach the Two.js groups
 *    through the views' listeners (transform edits call `updateTransform()`,
 *    other state changes call `update()`).
 * 3. Call `context.two.update()` to flush all pending Two.js scene changes to
 *    the SVG/canvas DOM.
 *
 * `two.update()` is called here — NOT inside `onAnimationFrameCallback` —
 * to guarantee exactly one flush per frame regardless of what the callback does.
 *
 * **Window resize**: the constructor registers a `resize` listener (via
 * `ARenderWindow._registerResizeListener`) that calls `controller.onWindowResize`,
 * which resizes the context and notifies the scene model via `model.onContextResize`.
 *
 * `isRendering`, the context/controller/container getters, `aspect`, and
 * `startRendering`/`stopRendering` are inherited from {@link ARenderWindow}.
 */
@ALabel("ATwoJSRenderWindow")
export class ATwoJSRenderWindow extends ARenderWindow {
    /**
     * @param sceneController Controller to drive each frame.
     * @param context         Optional pre-built context; a default `ATwoJSContext`
     *                        (SVG renderer, 800×600) is created if omitted.
     */
    constructor(sceneController: ASceneController, context?: ATwoJSContext) {
        super();
        this.render = this.render.bind(this);
        this._context = context ?? new ATwoJSContext();
        this._sceneController = sceneController;
        sceneController.setRenderWindow(this);
        this._registerResizeListener();
    }

    /** `context` typed as an {@link ATwoJSContext}, for access to Two.js-specific members like `two`. */
    get twoContext(): ATwoJSContext {
        return this._context as ATwoJSContext;
    }

    /**
     * Attaches the Two.js DOM element to a container `<div>`.
     * Removes it from the previous container first (if any), then appends it
     * and resizes the Two.js canvas to match the container's current pixel
     * dimensions.
     *
     * Called by `ATwoJSContextComponent` from its `useEffect`, once the React `ref` is live.
     */
    setContainer(container: HTMLElement): void {
        if (this._container) {
            this._container.removeChild(this._context.domElement);
        }
        this._container = container;
        this.twoContext.two.appendTo(container);
        this._context.setSize(container.clientWidth, container.clientHeight);
    }

    /**
     * One iteration of the render loop.
     * Schedules the next frame immediately, then — if the controller is ready —
     * runs the frame callback and flushes Two.js.
     */
    render(): void {
        if (this.isRendering) {
            requestAnimationFrame(() => this.render());
            if (this._sceneController.isInitialized && this._sceneController.isReadyToRender) {
                this._sceneController.onAnimationFrameCallback(this._context);
                this.twoContext.two.update();
            }
        }
    }
}
