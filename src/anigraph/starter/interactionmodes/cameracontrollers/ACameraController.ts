import type {AInteractionEvent} from "../../../interaction";
import type {AKeyboardInteraction} from "../../../interaction/DOM/AKeyboardInteraction";
import type {ADragInteraction} from "../../../interaction/ADragInteraction";
import type {AWheelInteraction} from "../../../interaction/AWheelInteraction";
import type {CameraModelInterface} from "../../../scene/camera";
import type {ANodeModel} from "../../../scene/nodeModel";

/**
 * A camera controller: an object that moves one camera model in response to input events (keys, drags, the mouse
 * wheel). Interaction modes such as {@link ADebugInteractionMode} and {@link APanZoomInteractionMode2D} create
 * controllers and pass each input callback on to them with `forwardToControllers`, so the camera math lives in the
 * controller instead of in the interaction mode.
 *
 * Every method is optional: a controller that only cares about dragging (`OrbitController3D`) simply leaves out
 * `onKeyDown`, `onWheelMove`, and so on, and receives only the events it implements.
 */
export interface ACameraController {
    /** The camera model this controller moves. Passed in to the constructor (the interaction mode passes its
     * owner's `cameraModel`). It is `readonly` here only so that users of the interface don't reassign it; the
     * built-in controllers declare it writable so their interaction mode can point them at a new camera model when
     * the scene replaces its camera. */
    readonly cameraModel: CameraModelInterface & ANodeModel;

    onKeyDown?(event: AInteractionEvent, interaction: AKeyboardInteraction): void;
    onKeyUp?(event: AInteractionEvent, interaction: AKeyboardInteraction): void;
    onWheelMove?(event: AInteractionEvent, interaction: AWheelInteraction): void;
    onDragStart?(event: AInteractionEvent, interaction: ADragInteraction): void;
    onDragMove?(event: AInteractionEvent, interaction: ADragInteraction): void;
    onDragEnd?(event: AInteractionEvent, interaction: ADragInteraction): void;
    /** Optional per-frame update, for a controller with its own momentum or easing. None of the built-in
     * controllers implement it, and the built-in interaction modes do not call it. */
    timeUpdate?(t: number): void;
}

/**
 * The subset of `ACameraController`'s members that are callbacks, i.e. everything but `cameraModel`.
 * @internal
 */
export type ACameraControllerMethodName = Exclude<keyof ACameraController, "cameraModel">;

/**
 * Calls `method(...args)` on every controller in `controllers` that implements it, in order. Controllers that don't
 * implement `method` are skipped.
 * @param controllers the controllers to forward to
 * @param method the callback name, e.g. `'onDragMove'`
 * @param args the arguments to pass (not type-checked here; pass what that method expects)
 */
export function forwardToControllers(
    controllers: ACameraController[],
    method: ACameraControllerMethodName,
    ...args: any[]
): void {
    for (const controller of controllers) {
        const fn = controller[method] as ((...a: any[]) => void) | undefined;
        if (fn) fn.apply(controller, args);
    }
}
