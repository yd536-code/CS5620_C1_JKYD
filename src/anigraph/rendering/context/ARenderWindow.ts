import {AObject, AObjectState} from "../../base";
import {ARenderContext} from "./ARenderContext";
import type {ASceneController} from "../../scene/ASceneController";

/**
 * Backend-independent base for a render window: the object that owns a render context, a DOM container, and the
 * `requestAnimationFrame` loop driving a scene controller. Subclasses ({@link AGLRenderWindow} for Three.js,
 * {@link ATwoJSRenderWindow} for Two.js) implement `render()` (the per-frame work, e.g. frame capture on
 * Three.js, `two.update()` on Two.js) and `setContainer()` (attaching the backend's DOM element).
 */
export abstract class ARenderWindow extends AObject {
    // `@AObjectState` fields cannot take an inline initializer (Object.defineProperty on the prototype at
    // decoration time would be shadowed by a Babel-compiled own-property assignment) -- set in the constructor
    // instead, matching every other `@AObjectState` field in this codebase.
    @AObjectState isRendering!: boolean;
    protected _context!: ARenderContext;
    protected _sceneController!: ASceneController;
    protected _container!: HTMLElement;

    constructor() {
        super();
        this.isRendering = false;
    }

    /** The render context this window draws with. */
    get context(): ARenderContext {
        return this._context;
    }

    /** The scene controller this window drives each frame. */
    get sceneController(): ASceneController {
        return this._sceneController;
    }

    /** The DOM element the backend's drawing surface is attached to (unset until `setContainer`). */
    get container(): HTMLElement {
        return this._container;
    }

    /** The container's aspect ratio, or `1` if no container has been set yet. */
    get aspect(): number {
        if (!this._container) return 1;
        return this._container.clientWidth / this._container.clientHeight;
    }

    /**
     * Attaches the backend's DOM element to `container` (removing it from any previous container first) and resizes
     * the backend's context to match.
     */
    abstract setContainer(container: HTMLElement): void;

    /**
     * One iteration of the render loop, scheduling the next via `requestAnimationFrame` while `isRendering`.
     * Backend-specific (see the class docstring).
     */
    abstract render(): void;

    /** Stops the render loop after the current frame. */
    stopRendering(): void {
        this.isRendering = false;
    }

    /** Starts the `requestAnimationFrame` loop (via the backend-specific `render()`). No-op if already rendering. */
    startRendering(): void {
        if (!this.isRendering) {
            this.isRendering = true;
            this.render();
        }
    }

    /**
     * Registers a `window` resize listener that calls `sceneController.onWindowResize`. Each subclass constructor
     * calls this once, after `_sceneController` is set.
     */
    protected _registerResizeListener(): void {
        const self = this;
        window.addEventListener("resize", () => {
            self.sceneController.onWindowResize(self);
        });
    }
}
