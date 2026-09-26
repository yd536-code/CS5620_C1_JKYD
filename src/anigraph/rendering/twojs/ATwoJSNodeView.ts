import {ANodeView} from "../../scene/nodeView/ANodeView";
import {ATwoJSGraphicObject} from "./ATwoJSGraphicObject";
import type {AGraphicObject} from "../graphicobject/AGraphicObject";
import {Mat3, Mat4, TransformationInterface} from "../../math";
import {Two, TwoGroup} from "./TwoJSImport";
import type {ATwoJSSceneController} from "../../scene/ATwoJSSceneController";

/**
 * Abstract base for all Two.js node views in AniGraph's MVC system.
 *
 * Each `ATwoJSNodeView` owns exactly one `Two.Group` (`_twoGroup`). Graphics
 * are registered via `registerAndAddGraphic`, which adds the graphic's inner
 * group as a child of `_twoGroup`. The parent `ATwoJSSceneView` then attaches
 * `_twoGroup` to the scene hierarchy.
 *
 * Transforms are applied through `setTransform`, which decomposes the
 * model's 3x3 matrix into translation, rotation, and uniform scale and writes
 * them onto `_twoGroup` (Two.js takes these as separate properties rather
 * than a raw matrix). Shear and non-uniform scale are lost.
 *
 * **Lifecycle** (via {@link ANodeView.setModel}, called when the corresponding model
 * node is added to the scene graph):
 * 1. `_initRenderObject()` — creates `_twoGroup`.
 * 2. `init()` — subclass creates and registers graphics.
 * 3. `update()` — subclass syncs visual state to the model.
 * 4. `setModelListeners()` — sets up change listeners so `update()` is called
 *    whenever the model's state (other than its transform) or geometry
 *    changes. Transform changes arrive as `TRANSFORM_UPDATE` events and call
 *    `onTransformUpdate()`, which Two.js views implement as `updateTransform()`
 *    (see below). With `autoTransformUpdate` on (the default), any transform
 *    edit, including nested ones like `node.prsa.position.x = 1`, reaches the
 *    view this way with no manual signal.
 *
 * Subclasses must implement `init()` and `update()`. The initial transform is
 * not applied automatically during `setModel`, so `update()` should call
 * `updateTransform()` (as {@link ATwoJSGroupNodeView} does).
 */
export abstract class ATwoJSNodeView extends ANodeView {
    protected _twoGroup!: TwoGroup;

    /**
     * Called on each `TRANSFORM_UPDATE` event. Only re-applies the transform (`updateTransform()`) rather than
     * calling `update()`, which in many Two.js views rebuilds every graphic.
     */
    onTransformUpdate(): void {
        this.updateTransform();
    }

    /** The Two.js group holding this view's graphics and child views. */
    get twoGroup(): TwoGroup { return this._twoGroup; }

    /** Creates `_twoGroup` and registers this view with the controller for hit testing. */
    protected _initRenderObject(): void {
        // Two.js builds the group's matrix from translation/rotation/scale, which is how transforms are applied here.
        this._twoGroup = new Two.Group();
        (this.controller as ATwoJSSceneController).registerViewForHitTesting(this);
    }

    /** True if `_twoGroup` has a parent group. */
    get isAttachedToRenderHierarchy(): boolean {
        return !!this._twoGroup.parent;
    }

    /** Adds this view's group to `parentView`'s group. */
    addToParentView(parentView: ANodeView): void {
        (parentView as ATwoJSNodeView).twoGroup.add(this._twoGroup);
    }

    protected _setVisible(value: boolean): void {
        // ATwoJSDisplayObject models visibility as opacity 0/1; do the same
        // for the view's group.
        (this._twoGroup as any).opacity = value ? 1 : 0;
    }

    protected _setRenderOrder(_value: number): void {
        // No-op: Two.js has no renderOrder equivalent — z-order is determined
        // by children order in the scene graph.
    }

    abstract init(): void;
    abstract update(): void;

    /** Re-applies the model's current transform to the Two.js group. */
    updateTransform(): void {
        this.setTransform(this._model.transform);
    }

    /**
     * Applies any `TransformationInterface` to the Two.js group. `getMatrix()` returns a `Mat3` for a 2D transform
     * (`Mat3` or `NodeTransform2D`), which is applied directly, and a `Mat4` for a 3D transform, which is reduced
     * to 2D by `_applyMatrixToGroup`.
     */
    setTransform(transform: TransformationInterface): void {
        const mat = transform.getMatrix();
        this._applyMatrixToGroup(mat as Mat3 | Mat4);
    }

    /**
     * Decomposes a row-major Mat3 and writes translation, rotation, and uniform
     * scale onto the Two.js group.
     *
     * Mat3 element layout (`getElement(row, col) = elements[3*row + col]`):
     * ```
     *   [ m00  m01  m02 ]   [ cos·s  -sin·s  tx ]
     *   [ m10  m11  m12 ] = [ sin·s   cos·s  ty ]
     *   [ m20  m21  m22 ]   [   0       0     1 ]
     * ```
     * - **Translation**: `m02 = elements[2]`, `m12 = elements[5]`
     *   (NOT `m20`/`m21`, which are always 0 in affine matrices).
     * - **Rotation**: `atan2(m10, m00) = atan2(sin, cos) = θ`
     *   (NOT `atan2(m01, m00)`, which gives −θ).
     * - **Scale**: first-column magnitude `sqrt(m00² + m10²)`.
     */
    protected _applyMat3ToGroup(m: Mat3): void {
        const tx = m.m02;
        const ty = m.m12;
        const scaleX = Math.sqrt(m.m00 * m.m00 + m.m10 * m.m10);
        const rotation = Math.atan2(m.m10, m.m00);
        this._twoGroup.translation.set(tx, ty);
        this._twoGroup.rotation = rotation;
        this._twoGroup.scale = scaleX > 0 ? scaleX : 1;
    }

    /**
     * Routes a Mat3 or Mat4 to `_applyMat3ToGroup`. A (row-major) Mat4 is
     * reduced to its 2D part: rows `m00, m01, m03` and `m10, m11, m13`, i.e.
     * the x/y rotation-scale block plus the x/y translation.
     */
    protected _applyMatrixToGroup(mat: Mat3 | Mat4): void {
        if (mat instanceof Mat3) {
            this._applyMat3ToGroup(mat);
        } else {
            const m3 = new Mat3([
                mat.m00, mat.m01, mat.m03,
                mat.m10, mat.m11, mat.m13,
                0, 0, 1,
            ]);
            this._applyMat3ToGroup(m3);
        }
    }

    /**
     * Attaches a graphic's Two.js group as a child of this view's group.
     * Called by the shared `registerAndAddGraphic` bookkeeping in `ANodeView`.
     */
    protected _attachGraphic(graphic: AGraphicObject): void {
        this._twoGroup.add((graphic as ATwoJSGraphicObject).displayObject.nativeGroup);
    }

    /** Removes a graphic's Two.js group from this view's group. */
    protected _detachGraphic(graphic: AGraphicObject): void {
        this._twoGroup.remove((graphic as ATwoJSGraphicObject).displayObject.nativeGroup);
    }

    /** Unregisters from hit testing, disposes the graphics, and removes the group from its parent. */
    dispose(): void {
        (this.controller as ATwoJSSceneController).unregisterViewForHitTesting(this);
        this.disposeGraphics();
        this._twoGroup.parent?.remove(this._twoGroup);
    }
}
