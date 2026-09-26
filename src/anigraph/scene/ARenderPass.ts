/**
 * @file Render passes for Three.js scenes. Two.js scenes have no render passes; they render their single scene view
 * directly.
 */
import * as THREE from "three";
import type {AGLContext} from "../rendering/context/AGLContext";
import type {AGLSceneController} from "./AGLSceneController";
import type {AGLSceneView} from "./AGLSceneView";
import type {ACameraView} from "./camera";
import type {ANodeModel} from "./nodeModel";
import type {CameraModelInterface} from "./camera";
import type {ARenderTarget} from "../rendering/target/ARenderTarget";
import type {AInteractionEvent} from "../interaction";
import type {Vec2} from "../math";

/** Settings for a new {@link ARenderPass}. Only `name`, `sceneView`, and `cameraModel` are required. */
export interface ARenderPassParams {
    /** Identifies the pass (for lookup/debugging); does not have to match a scene view's own name. */
    name: string;
    /** The graph/backend-scene mapping this pass draws. Several passes may share one (a mini-map re-rendering the
     * same world through a second camera) or use separate views over the same graph (needed when a pass wants
     * different materials, e.g. a second pass whose node views draw every node with a flat color). */
    sceneView: AGLSceneView;
    /** The camera this pass renders through. Does not have to be the scene's main `cameraModel`; a mini-map pass
     * typically uses a second camera. The camera model must have a view in the scene view the controller looks it up
     * in (see {@link ARenderPass.getThreeJSCamera}). */
    cameraModel: ANodeModel & CameraModelInterface;
    /** Normalized viewport `[x, y, w, h]`, each in `[0, 1]`, in the same (bottom-up) convention
     * `THREE.WebGLRenderer.setViewport` uses. Defaults to the full canvas. */
    viewport?: [number, number, number, number];
    /** Whether this pass clears the color buffer before drawing. Default `true`. */
    clearColor?: boolean;
    /** Whether this pass clears the depth buffer before drawing. Default `true`. A HUD pass drawn on top of
     * another pass's pixels typically sets `clearColor: false` and keeps depth clearing on. */
    clearDepth?: boolean;
    /** Render to this target instead of the canvas, or `undefined`/`null` for the canvas (default). */
    renderTarget?: ARenderTarget | null;
    /** Whether `renderPasses()` draws this pass at all. Default `true`. */
    visible?: boolean;
    /** Whether this pass takes part in cursor hit-testing (see {@link findPassAtCursor}). Default `true`. Set it to
     * `false` for a display-only pass, so the cursor reaches the pass drawn under it. */
    interactive?: boolean;
}

/**
 * One entry in an {@link AGLSceneController}'s ordered render list: a scene view, the camera model to see it through,
 * a viewport, clear flags, and an optional render target. Use several passes for a mini-map, a HUD, or a split
 * screen. Every Three.js scene gets one full-canvas pass automatically (`AGLSceneController.mainRenderPass`); add
 * others with `AGLSceneController.addRenderPass`.
 * @example
 * this.addRenderPass(new ARenderPass({
 *     name: "minimap",
 *     sceneView: this.mainSceneView,
 *     cameraModel: minimapCamera,
 *     viewport: [0.75, 0.75, 0.25, 0.25],
 * }));
 */
export class ARenderPass {
    name: string;
    sceneView: AGLSceneView;
    cameraModel: ANodeModel & CameraModelInterface;
    viewport: [number, number, number, number];
    clearColor: boolean;
    clearDepth: boolean;
    renderTarget: ARenderTarget | null;
    visible: boolean;
    interactive: boolean;

    constructor(params: ARenderPassParams) {
        this.name = params.name;
        this.sceneView = params.sceneView;
        this.cameraModel = params.cameraModel;
        this.viewport = params.viewport ?? [0, 0, 1, 1];
        this.clearColor = params.clearColor ?? true;
        this.clearDepth = params.clearDepth ?? true;
        this.renderTarget = params.renderTarget ?? null;
        this.visible = params.visible ?? true;
        this.interactive = params.interactive ?? true;
    }

    /**
     * This pass's viewport in pixels, given the canvas's current full pixel size (`context.getShape()`).
     * @param canvasShape `[width, height]` in pixels.
     */
    pixelViewport(canvasShape: [number, number]): [number, number, number, number] {
        const [nx, ny, nw, nh] = this.viewport;
        const [cw, ch] = canvasShape;
        return [nx * cw, ny * ch, nw * cw, nh * ch];
    }

    /** Returns the Three.js camera for this pass's `cameraModel`, looked up in `controller`'s main scene view. */
    getThreeJSCamera(controller: AGLSceneController): THREE.Camera {
        const views = controller.getViewListForModel(this.cameraModel);
        return (views[0] as ACameraView).threeJSCamera;
    }

    /**
     * Returns `event`'s cursor in this pass's own NDC (`[-1, 1]` across this pass's viewport), or `null` if the
     * cursor isn't over this pass's viewport. Wraps `AInteractionEvent.ndcCursorForViewport`.
     */
    localNDCCursor(event: AInteractionEvent): Vec2 | null {
        return event.ndcCursorForViewport(this.viewport);
    }

    /**
     * Returns the world-space point under `event`'s cursor as seen through this pass's own camera
     * (`cameraModel.ndcToWorld(localNDCCursor(event))`), or `undefined` if the cursor isn't over this pass's
     * viewport. {@link ASceneController.getWorldCoordinatesOfCursorEvent} is the single-camera equivalent, which
     * always uses the scene's main camera and the canvas-wide NDC.
     */
    worldPointAtCursor(event: AInteractionEvent): Vec2 | undefined {
        const ndc = this.localNDCCursor(event);
        if (!ndc) return undefined;
        return this.cameraModel.ndcToWorld(ndc);
    }

    /** Sets the viewport, render target and a matching scissor rectangle, clears per this pass's flags, and
     * renders `sceneView` through `cameraModel`. The scissor rectangle matters whenever more than one pass draws
     * into the same canvas/target -- `WebGLRenderer.clear()` clears the whole framebuffer, not just the current
     * viewport, so without it a later pass's clear would erase an earlier pass's pixels outside its own viewport
     * too (see `AGLContext.clearBuffers`). Does nothing if `visible` is false. Does not restore the viewport, scissor,
     * or render target afterward; `AGLSceneController.renderPasses()` resets the viewport and scissor test once, after
     * the whole list. */
    render(context: AGLContext, controller: AGLSceneController): void {
        if (!this.visible) return;
        const shape = context.getShape();
        const [x, y, w, h] = this.pixelViewport([shape.x, shape.y]);
        context.setViewport(x, y, w, h);
        context.setScissor(x, y, w, h);
        context.setScissorTest(true);
        context.setRenderTarget(this.renderTarget?.target ?? null);
        context.clearBuffers(this.clearColor, this.clearDepth);
        context.renderer.render(this.sceneView.threeJSScene, this.getThreeJSCamera(controller));
    }
}

/**
 * Returns the topmost pass under `event`'s cursor that is both `visible` and `interactive`, or `undefined` if there
 * is none. Passes draw in list order, so the last entry is on top; this checks them in reverse.
 *
 * A pass with `interactive: false` is skipped even when the cursor is over it, so the pass under it can receive the
 * event. An interactive pass stops the search as soon as the cursor is inside its viewport, whether or not the
 * cursor is over any of its content (finding content under the cursor is `getNodeViewAtCursor`'s job).
 * `AGLSceneController.getPassAtCursor` wraps this function.
 */
export function findPassAtCursor(passes: ARenderPass[], event: AInteractionEvent): ARenderPass | undefined {
    for (let i = passes.length - 1; i >= 0; i--) {
        const pass = passes[i];
        if (!pass.visible || !pass.interactive) continue;
        if (pass.localNDCCursor(event) !== null) return pass;
    }
    return undefined;
}
