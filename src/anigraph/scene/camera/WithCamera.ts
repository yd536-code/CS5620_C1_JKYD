/**
 * @file `WithCamera`: the members shared by {@link ACameraModel2D} and {@link ACameraModel3D}. It holds everything
 * about being a camera that does not depend on the dimension of the camera's pose: access to the wrapped
 * {@link ACamera} and its projection, canvas resizing, the camera's axes, and projection-change listeners.
 *
 * The members are added to each camera class by copying them onto its prototype (`applyWithCamera`), together with
 * an `interface ACameraModel2D extends CameraModelInterface {}` declaration so they type-check. This lets each camera
 * class extend `ANodeModel2D`/`ANodeModel3D` directly, with ordinary single-class inheritance (TypeScript's usual
 * `class extends Mixin(Base)` pattern doesn't allow overriding accessors in the subclass).
 *
 * Pose is not handled here. `ACameraModel3D` keeps its transform and the wrapped camera's pose in sync (see that
 * class), while `ACameraModel2D`'s pose is its own 2D transform and its wrapped camera is used only for projection,
 * because `ACamera`'s pose is always 3D. Both classes override the generic `ndcToWorld` here, which reads the wrapped
 * camera's pose, with versions that use the node's world transform.
 */
import {ACallbackSwitch, AGroupCallbackSwitch, AObject} from "../../base";
import {Mat4, Vec2, Vec3} from "../../math/linalg";
import {ACamera} from "../../math";
import type {ANodeModel} from "../nodeModel/ANodeModel";

/**
 * What every camera model provides, 2D or 3D: everything a caller can do with "the scene's camera" without knowing
 * its dimension. {@link ASceneModel.cameraModel} has type `CameraModelInterface & ANodeModel`, so it can hold either
 * camera class.
 */
export interface CameraModelInterface {
    /** The wrapped {@link ACamera}, which holds the projection (and, for 3D cameras, a synced copy of the pose). */
    readonly camera: ACamera;
    /** The projection matrix (`camera.projection`). */
    readonly projection: Mat4;
    /** The direction the wrapped camera's pose looks along (its local -z axis). */
    readonly forward: Vec3;
    /** The wrapped camera's pose's local x axis. */
    readonly right: Vec3;
    /** The wrapped camera's pose's local y axis. */
    readonly up: Vec3;

    /** Updates the projection for a new canvas size, in pixels. Called by the scene model when the canvas resizes. */
    onCanvasResize(width: number, height: number): void;

    /** Sets the projection matrix. */
    setProjection(m: Mat4): void;

    /**
     * Converts a cursor position in normalized device coordinates (`AInteractionEvent.ndcCursor`) to a world-space
     * point on the camera's `z = 0` plane. Both camera classes use the node's world transform, so this follows the
     * camera as it moves.
     */
    ndcToWorld(ndc: Vec2): Vec2;

    /**
     * Signals `PROJECTION_UPDATED` on this camera model, which runs every listener added with
     * `addCameraProjectionListener` (and `addCameraChangeListener`). Call it after editing the projection matrix in
     * place, since only replacing it is detected automatically.
     */
    signalCameraProjectionUpdate(): void;

    /**
     * Adds a listener for this camera model's `PROJECTION_UPDATED` event. The model sends that event whenever the
     * wrapped camera's projection matrix is replaced (for example by `setProjection`, a zoom change or a resize)
     * and when `signalCameraProjectionUpdate()` is called.
     * @param callback called with this camera model
     * @param handle optional handle for the listener
     * @param synchronous ignored; events always run synchronously. Kept so existing calls still type-check.
     * @returns the listener's switch; call `deactivate()` on it to stop listening
     */
    addCameraProjectionListener(callback: (self: AObject) => void, handle?: string, synchronous?: boolean): ACallbackSwitch;

    /**
     * Adds a callback that fires when the camera changes. It uses a whole-object state listener on the node, so it
     * fires on any state change of the camera model (including in-place pose edits, but also things like
     * `visible`), plus every projection update that `addCameraProjectionListener` hears.
     */
    addCameraChangeListener(callback: (self: AObject) => void, handle?: string, synchronous?: boolean): AGroupCallbackSwitch;
}

/** A camera model: any `ANodeModel` that also owns a wrapped `_camera`. What `WithCamera`'s methods need from `this`. */
type CameraModelHost = ANodeModel & { _camera: ACamera; camera: ACamera };

/** `this` cannot be typed on an accessor (TS2784), so `CameraModelMembers`'s accessors cast through this instead. */
function host(self: unknown): CameraModelHost {
    return self as CameraModelHost;
}

/**
 * `CameraModelInterface`'s implementation, as methods typed against `CameraModelHost` rather than a real base
 * class. `applyWithCamera` copies these onto a camera class's prototype; nothing here is ever instantiated
 * directly.
 */
class CameraModelMembers {
    get camera(): ACamera {
        return host(this)._camera;
    }

    onCanvasResize(this: CameraModelHost, width: number, height: number) {
        this.camera.onCanvasResize(width, height);
    }

    get projection() {
        return host(this).camera.projection;
    }

    setProjection(this: CameraModelHost, m: Mat4) {
        this.camera.projection = m;
    }

    ndcToWorld(this: CameraModelHost, ndc: Vec2): Vec2 {
        return this.camera.convertNDCToWorld2D(ndc);
    }

    get forward() {
        return host(this).camera.forward;
    }

    get right() {
        return host(this).camera.right;
    }

    get up() {
        return host(this).camera.up;
    }

    signalCameraProjectionUpdate(this: CameraModelHost) {
        this.signalEvent(ACamera.CameraUpdateEvents.PROJECTION_UPDATED);
    }

    /*
    The listener and the signal use the same event source: this model's `PROJECTION_UPDATED` event. Each camera class
    forwards the wrapped camera's projection changes into that event from its constructor, so listeners hear both an
    explicit `signalCameraProjectionUpdate()` and a replaced projection matrix.
     */
    addCameraProjectionListener(this: CameraModelHost, callback: (self: AObject) => void, handle?: string, synchronous: boolean = true): ACallbackSwitch {
        const self = this;
        return this.addEventListener(ACamera.CameraUpdateEvents.PROJECTION_UPDATED, () => callback(self), handle);
    }

    /**
     * Fires `callback` on any state change of this camera model (a whole-object `addStateListener`, which also catches
     * in-place pose edits such as `prsa.position = ...`, as `PanZoomController2D` makes) and on every projection
     * update (see `addCameraProjectionListener`). `ATwoJSSceneView` uses this to keep its view of the scene in sync
     * with the camera.
     * @returns a switch covering both listeners
     */
    addCameraChangeListener(this: CameraModelHost, callback: (self: AObject) => void, handle?: string, synchronous: boolean = true) {
        let rhandles:ACallbackSwitch[] = [];
        rhandles.push(this.addStateListener(callback, handle, synchronous));
        rhandles.push((this as unknown as CameraModelInterface).addCameraProjectionListener(callback, handle));
        return new AGroupCallbackSwitch(rhandles, handle);
    }
}

/**
 * Copies `CameraModelMembers`'s methods and accessors onto `target`'s prototype. Call once per camera class, right
 * after its declaration, and pair it with `interface <TargetClass> extends CameraModelInterface {}` so the copied
 * members type-check at call sites. Skips any name `target`'s own class body already defines (e.g.
 * `ACameraModel3D.ndcToWorld`, which needs a parented-camera-aware implementation `WithCamera`'s generic one
 * cannot provide) -- since this runs *after* the class body, a blind copy would silently clobber that override.
 */
export function applyWithCamera(target: Function) {
    for (const name of Object.getOwnPropertyNames(CameraModelMembers.prototype)) {
        if (name === "constructor") continue;
        if (Object.prototype.hasOwnProperty.call((target as any).prototype, name)) continue;
        const descriptor = Object.getOwnPropertyDescriptor(CameraModelMembers.prototype, name)!;
        Object.defineProperty(target.prototype, name, descriptor);
    }
}
