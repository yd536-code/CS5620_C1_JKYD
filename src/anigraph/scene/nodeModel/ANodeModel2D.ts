import {
    Mat3,
    Mat4,
    NodeTransform2D,
    Precision,
    TransformationInterface2D,
    TransformationInterface
} from "../../math";
import {BoundingBox2D, BoundingBox3D, HasBounds2D, VertexArray2D, VertexArray3D} from "../../geometry";
import {ANodeModelSubclass} from "./NodeModelSubclass";
import {AObjectState} from "../../base/aobject";

/**
 * Base class for 2D node models: nodes with 2D vertices (`VertexArray2D`) and a 2D transform.
 *
 * **Transform.** A 2D node's transform is a {@link NodeTransform2D} (PRSA: position, rotation, scale, anchor) by
 * default, or a `Mat3` if you choose one. Edit a PRSA transform through `prsa`, which is the node's own live
 * transform:
 * ```ts
 * node.prsa.position = V2(1, 2);   // moves the node; its views redraw automatically
 * node.prsa.rotation = Math.PI/4;
 * ```
 * `prsa` throws on a node whose transform is a `Mat3`; `transformIsPRSA` tells which it is, and
 * `convertTransformToPRSA()`/`convertTransformToMatrix()` switch between them. `setTransform(t)` keeps the node's
 * current representation.
 *
 * **Depth.** `zValue` sets the node's depth for draw order. It is part of the node's transform, so changing it
 * redraws the node's views like any other transform edit.
 */
export abstract class ANodeModel2D extends ANodeModelSubclass<TransformationInterface2D, VertexArray2D> implements HasBounds2D{
    /** Tags every 2D node model as belonging to the 2D space, so `AObjectNode._addChild` rejects parenting it to (or under) a 3D node. */
    get nodeSpace(){return '2D' as const;}

    /**
     * Backing state for `zValue`. It is `@AObjectState` and one of `transformStateKeys`, so a change counts as a
     * transform change: with `autoTransformUpdate` on it redraws the node's views right away, and with it off it
     * waits for `signalTransformUpdate()` like any other transform edit.
     */
    @AObjectState _zValue!:number;

    /** The 2D node's transform state: `_transform` and `_zValue` (which becomes the z translation of the render matrix). */
    get transformStateKeys():string[]{
        return ["_transform", "_zValue"];
    }

    /**
     * Depth used for draw order: the z translation of this node's render matrix (see `embedTransform`). Starts at 0.
     * Part of the node's transform, so setting it redraws the node's views (right away with `autoTransformUpdate` on).
     */
    set zValue(value){
        this._zValue = value;
    }
    get zValue(){return this._zValue;}

    /**
     * @param verts The node's vertices. Defaults to an empty `VertexArray2D`.
     * @param transform The initial transform, stored as given (a `Mat3` makes a matrix node). Defaults to an
     * identity `NodeTransform2D`.
     * @param args Ignored here; accepted so subclasses can forward extra arguments.
     */
    constructor(verts?:VertexArray2D, transform?:TransformationInterface2D, ...args:any[]) {
        super(verts, transform);
        this._zValue = 0;
        if(!this.verts){
            this._setVerts(new VertexArray2D());
        }
    }

    /**
     * The node's transform relative to its parent: a `NodeTransform2D` or a `Mat3`. To edit a PRSA transform, use
     * `prsa`; to read the matrix of either kind, use `transform.getMatrix()`.
     */
    get transform(): TransformationInterface2D {
        return this._transform as TransformationInterface2D;
    }

    /**
     * Resets the transform to an identity `NodeTransform2D`. The constructor calls it when no transform is given, so
     * `NodeTransform2D` (position, rotation, scale and anchor stored separately, which is easy to animate) is the
     * default representation for 2D nodes. A subclass that wants a different default overrides this method.
     */
    setTransformToIdentity(){
        this._transform = new NodeTransform2D();
    }

    /**
     * True if this node's transform is a `NodeTransform2D` (PRSA), so `prsa` can be used. False if it is a `Mat3`.
     */
    get transformIsPRSA():boolean{
        return this._transform instanceof NodeTransform2D;
    }

    /**
     * The node's live PRSA transform (position, rotation, scale, anchor). Editing it edits the node: with
     * `autoTransformUpdate` on (the default), `node.prsa.position = V2(1, 2)` redraws the node's views right away.
     *
     * A node's transform is a `NodeTransform2D` unless something made it a `Mat3`: constructing it with a `Mat3`,
     * `convertTransformToMatrix()`, `setTransformMat3()`, or `setTransform()` with a matrix that has shear (which
     * logs a warning). Then there is no live PRSA to edit, and this throws rather than hand back a copy whose edits
     * would be lost. Check `transformIsPRSA` first, or call `convertTransformToPRSA()`.
     * @returns The node's own `NodeTransform2D` (not a copy).
     * @throws Error if the node's transform is a `Mat3`.
     */
    get prsa():NodeTransform2D{
        if(this._transform instanceof NodeTransform2D){
            return this._transform;
        }
        throw new Error(
            `This node's transform is a ${this._transform instanceof Mat3 ? "Mat3" : this._transform?.constructor?.name}, ` +
            `so it has no live PRSA. Call convertTransformToPRSA() first (or use getTransformAsPRSA() for a copy).`
        );
    }

    /**
     * Converts this node's transform to a `NodeTransform2D` in place, so that `prsa` works. Does nothing if it
     * already is one. The result has anchor 0 (a matrix has no anchor to keep), and its matrix is the same as
     * before, unless the `Mat3` has shear: then the closest PRSA is used, which changes how the node looks, and a
     * warning is logged (once per node).
     */
    convertTransformToPRSA(){
        if(this._transform instanceof NodeTransform2D){
            return;
        }
        const m = this._transform as Mat3;
        let t = NodeTransform2D.TryFromMatrix(m);
        if(t === undefined){
            this._warnTransformOnce("lossyToPRSA",
                `convertTransformToPRSA(): this node's Mat3 has shear, so no NodeTransform2D reproduces it. ` +
                `Using the closest one, which changes how the node looks.`);
            t = new NodeTransform2D();
            t._setWithMatrix(m, undefined, undefined, false);
        }
        // Assign _transform directly: `setTransform` would keep the current representation.
        this._transform = t;
    }

    /**
     * Converts this node's transform to a `Mat3` in place. Does nothing if it already is one. The matrix is exact,
     * but it folds the anchor into the translation, so converting back gives anchor 0. If the anchor is non-zero,
     * a warning is logged (once per node).
     */
    convertTransformToMatrix(){
        if(this._transform instanceof Mat3){
            return;
        }
        const t = this._transform as NodeTransform2D;
        this._warnIfAnchorLost(t, "convertTransformToMatrix()");
        // Assign _transform directly: `setTransform` would keep the current representation.
        this._transform = t.getMatrix();
    }

    /**
     * Warns (once per node) if converting `t` to a matrix loses its anchor, i.e. the anchor is non-zero.
     * @param t The PRSA transform being converted.
     * @param where The call doing the conversion, for the message.
     */
    protected _warnIfAnchorLost(t:NodeTransform2D, where:string){
        if(t.anchor.L2() > Precision.epsilon){
            this._warnTransformOnce("anchorLost",
                `${where}: this node's transform is a Mat3, so the NodeTransform2D's anchor ` +
                `(${t.anchor.x}, ${t.anchor.y}) is folded into the matrix's translation. The matrix is exact, but the ` +
                `anchor can't be recovered from it.`);
        }
    }

    /**
     * @deprecated Use `prsa` to edit the node's transform, or `transform.getMatrix()` to read it. This always returns
     * a **copy**: a clone of the `NodeTransform2D` if the transform is one, or a `NodeTransform2D` decomposed from the
     * `Mat3` if it isn't. Editing the copy does not change the node.
     * @returns A copy of the current transform as a `NodeTransform2D`.
     */
    getTransformAsPRSA():NodeTransform2D{
        if(this._transform instanceof NodeTransform2D){
            return this._transform.clone();
        }else{
            return NodeTransform2D.FromMatrix(this._transform as Mat3);
        }
    }

    /** @deprecated Use `convertTransformToMatrix()` instead. */
    setTransformToMatrix(){
        this.convertTransformToMatrix();
    }

    /** @deprecated Use `convertTransformToPRSA()` instead. */
    setTransformToPRSA(){
        this.convertTransformToPRSA();
    }

    /**
     * Embeds a 2D transform as a 2D homogeneous 4x4 matrix with `zValue` as its z translation. A transform that is
     * already a `Mat4` is treated as an already-embedded render matrix and returned unchanged (some views build
     * their own 4x4 matrices).
     * @param transform A `Mat3` or `NodeTransform2D`, or an already-embedded `Mat4`.
     * @returns The matrix to apply to this node's render object.
     */
    embedTransform(transform:TransformationInterface):Mat4{
        const m = transform.getMatrix();
        if(m instanceof Mat3){
            const embedded = m.Mat4From2DH();
            embedded.m23 = this.zValue;
            return embedded;
        }
        return m as Mat4;
    }

    /**
     * Sets the node's transform, keeping the node's current representation (`NodeTransform2D` or `Mat3`):
     *
     * | Node holds | `transform` is | Stored as |
     * |---|---|---|
     * | `NodeTransform2D` | `NodeTransform2D` | `transform` itself |
     * | `NodeTransform2D` | `Mat3` | decomposed into a `NodeTransform2D` that keeps the node's current anchor |
     * | `Mat3` | `Mat3` | `transform` itself |
     * | `Mat3` | `NodeTransform2D` | `transform.getMatrix()` |
     *
     * A 3D transform (`Mat4`, `NodeTransform3D`) is first projected to a `Mat3` (its x/y linear part and x/y
     * translation). Before any transform is set (while constructing), `transform` is stored as given.
     *
     * Two cases warn, once per node: a `Mat3` with shear given to a PRSA node (no `NodeTransform2D` reproduces it,
     * so the node's transform becomes that `Mat3`, and `prsa` will throw), and a `NodeTransform2D` with a non-zero
     * anchor given to a `Mat3` node (the anchor is folded into the translation). To change the representation on
     * purpose, use `convertTransformToPRSA()`/`convertTransformToMatrix()`, or `setTransformPRSA()`/`setTransformMat3()`.
     * @param transform The new transform.
     */
    setTransform(transform:TransformationInterface){
        const t:Mat3|NodeTransform2D = (transform instanceof Mat3 || transform instanceof NodeTransform2D)?
            transform : ANodeModel2D._ProjectToMat3(transform);
        const current = this._transform;
        if(current === undefined){
            this._transform = t;
        }else if(current instanceof NodeTransform2D){
            if(t instanceof NodeTransform2D){
                this._transform = t;
                return;
            }
            const decomposed = NodeTransform2D.TryFromMatrix(t, {anchor: current.anchor.clone()});
            if(decomposed !== undefined){
                this._transform = decomposed;
            }else{
                this._warnTransformOnce("typeChanged",
                    `setTransform() was given a Mat3 with shear, which a NodeTransform2D can't represent, so this ` +
                    `node's transform is now a Mat3 instead of a NodeTransform2D, and node.prsa will throw.`);
                this._transform = t;
            }
        }else{
            if(t instanceof NodeTransform2D){
                this._warnIfAnchorLost(t, "setTransform()");
                this._transform = t.getMatrix();
            }else{
                this._transform = t;
            }
        }
    }

    /**
     * Projects a 3D transform to a 2D one: the x/y block of its linear part, and its x/y translation. The z
     * translation is dropped, so the result is always an affine `Mat3`.
     * @param transform A 3D transform (`Mat4` or `NodeTransform3D`).
     */
    static _ProjectToMat3(transform:TransformationInterface):Mat3{
        let m3 = new Mat3();
        let m4 = transform.getMat4()
        m3.m00 = m4.m00;
        m3.m10 = m4.m10;
        m3.m01 = m4.m01;
        m3.m11 = m4.m11;
        m3.m02 = m4.m03;
        m3.m12 = m4.m13;
        return m3;
    }

    /**
     * Sets the transform and makes the node's representation `NodeTransform2D`, whatever it was. A `NodeTransform2D`
     * is stored as given. A `Mat3` is decomposed into a `NodeTransform2D` with anchor 0 (best effort if it has
     * shear), and a console warning is logged on every such call. A 3D transform is projected first. Unlike
     * `setTransform`, this changes the representation on purpose.
     * @param transform The new transform.
     */
    setTransformPRSA(transform:TransformationInterface){
        if(transform instanceof NodeTransform2D){
            this._transform = transform;
            return;
        }else if(transform instanceof Mat3) {
            console.warn("Converting Mat3 to NodeTransform2D: possible loss of information!");
            this._transform = NodeTransform2D.FromMatrix(transform);
        }else{
            this._transform = NodeTransform2D.FromMatrix(ANodeModel2D._ProjectToMat3(transform));
        }
    }

    /**
     * Sets the transform and makes the node's representation `Mat3`, whatever it was. A `NodeTransform2D` is stored
     * as its matrix, and a console warning is logged on every such call (even if its anchor is 0); a 3D transform is
     * projected. Unlike `setTransform`, this changes the representation on purpose.
     * @param transform The new transform.
     */
    setTransformMat3(transform:TransformationInterface){
        if(transform instanceof NodeTransform2D){
            console.warn("converting NodeTransform2D to Mat3: anchor information is lost!")
            this._transform = transform.getMatrix();
            return;
        }else if(transform instanceof Mat3) {
            this._transform = transform;
        }else{
            this._transform = ANodeModel2D._ProjectToMat3(transform);
        }
    }

    /**
     * The 2D bounding box of the node's vertices, with its `transform` set to the node's local transform only (not
     * the world transform).
     */
    getBounds(): BoundingBox2D {
        let b = this.verts.getBounds().getBoundsXY();
        b.transform = this.transform.getMatrix();
        return b;
    }

    /** Same as `getBounds()`: 2D bounds with the node's local transform (not the world transform). */
    getBounds2D(): BoundingBox2D {
        let b = this.verts.getBounds().getBoundsXY();
        b.transform = this.transform.getMatrix();
        return b;
    }

    /**
     * The 3D bounding box of the node's vertices, with its `transform` set to the node's local transform embedded as
     * a 2D homogeneous `Mat4` (not the world transform).
     */
    getBounds3D(): BoundingBox3D {
        let b = this.verts.getBounds();
        b.transform = this.transform.getMatrix().Mat4From2DH();
        return b;
    }

    /** Same as `getBounds()`: 2D bounds with the node's local transform (not the world transform). */
    getBoundsXY(): BoundingBox2D {
        return this.getBounds();
    }

    /**
     * Returns the transform from object coordinates (the coordinate system `verts` is defined in) to world
     * coordinates: the product of the local matrices of this node and its 2D node ancestors.
     * @returns The world matrix. For a node with no 2D node parent this can be the node's own `Mat3`: don't modify it.
     */
    getWorldTransform():Mat3{
        // No `instanceof ANodeModel3D` guard needed here: `AObjectNode._addChild` rejects mixing 2D and 3D
        // node models at parenting time (any depth, both directions -- see its `nodeSpace` check), so a 2D node's
        // parent, if it is itself a node model, can never be 3D by the time this runs.
        let parent = this.parent;
        if(parent instanceof ANodeModel2D){
            // return parent.getWorldTransform().getMat4().times(this.transform.getMat4());
            return parent.getWorldTransform().times(this.transform.getMatrix());
        }else{
            return this.transform.getMatrix();
        }
    }

}




