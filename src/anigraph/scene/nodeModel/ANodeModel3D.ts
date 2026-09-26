import {Mat3, Mat4, NodeTransform2D, NodeTransform3D, Precision, TransformationInterface} from "../../math";
import {VertexArray3D, BoundingBox2D, BoundingBox3D, HasBounds} from "../../geometry";
import {ANodeModelSubclass} from "./NodeModelSubclass";
import {ASerializable} from "../../base/aserial";
import type {TransformationInterface3D}  from "../../math";

/**
 * Base class for 3D node models: nodes with 3D vertices (`VertexArray3D`) and a 3D transform.
 *
 * A 3D node's transform is a {@link NodeTransform3D} (PRSA: position, rotation as a quaternion, scale, anchor) by
 * default, or a `Mat4` if you choose one. Edit a PRSA transform through `prsa`, which is the node's own live
 * transform:
 * ```ts
 * node.prsa.position = V3(0, 0, 1);   // moves the node; its views redraw automatically
 * ```
 * `prsa` throws on a node whose transform is a `Mat4`; `transformIsPRSA` tells which it is, and
 * `convertTransformToPRSA()`/`convertTransformToMatrix()` switch between them. `setTransform(t)` keeps the node's
 * current representation.
 */
@ASerializable("ANodeModel3D")
export class ANodeModel3D extends ANodeModelSubclass<TransformationInterface3D, VertexArray3D> implements HasBounds {
    /** Tags every 3D node model as belonging to the 3D space, so `AObjectNode._addChild` rejects parenting it to (or under) a 2D node. */
    get nodeSpace(){return '3D' as const;}

    /**
     * @param verts The node's vertices. Defaults to an empty `VertexArray3D`.
     * @param transform The initial transform, stored as given (a `Mat4` makes a matrix node). Defaults to an
     * identity `NodeTransform3D`.
     * @param args Ignored here; accepted so subclasses can forward extra arguments.
     */
    constructor(verts?:VertexArray3D, transform?:TransformationInterface3D, ...args:any) {
        super(verts, transform);
        if(verts === undefined){
            this._setVerts(new VertexArray3D());
        }
    }

    /** Same as `getBounds3D()`: 3D bounds with the node's local transform (not the world transform). */
    getBounds(): BoundingBox3D {
        return this.getBounds3D();
    }

    /** The z component of `transform.getPosition()` (for a PRSA transform, its `position.z`). */
    get zValue(){
        return this.transform.getPosition().z;
    }

    /** The x/y bounds of the node's vertex positions after applying the node's local transform. */
    getBounds2D(): BoundingBox2D {
        let tpoint = new VertexArray3D()
        tpoint.position = this.verts.position.GetTransformedByMatrix(this.transform.getMat4());
        return tpoint.getBounds().getBoundsXY();
    }

    /**
     * The bounding box of the node's geometry set, with its `transform` set to the node's local transform only (not
     * the world transform).
     */
    getBounds3D(): BoundingBox3D {
        // let b = this.verts.getBounds();
        let b = this.geometry.getBounds()
        b.transform = this.transform.getMat4();
        return b;
    }

    /** The x/y part of `getBounds3D()`. */
    getBoundsXY(): BoundingBox2D {
        return this.getBounds3D().getBoundsXY();
    }

    /**
     * Resets the transform to an identity `NodeTransform3D`. The constructor calls it when no transform is given, so
     * `NodeTransform3D` is the default representation for 3D nodes.
     */
    setTransformToIdentity(){
        // this._transform = Mat4.Identity();
        this._transform = new NodeTransform3D();
    }

    /**
     * A 3D node's transform is already a 4x4 matrix, so embedding returns it as is.
     * @param transform A `Mat4` or `NodeTransform3D`.
     * @returns The matrix to apply to this node's render object.
     * @throws Error if the transform is a 2D (`Mat3`) transform: it is ambiguous whether it means a 2D homogeneous
     * or a 3D linear transform, so convert it explicitly (`Mat4From2DH()` or `Mat4Linear()`) first.
     */
    embedTransform(transform:TransformationInterface):Mat4{
        const m = transform.getMatrix();
        if(m instanceof Mat3){
            throw new Error("A 3D node cannot embed a 2D (Mat3) transform. Convert it explicitly with Mat4From2DH() or Mat4Linear().");
        }
        return m as Mat4;
    }

    /**
     * Sets the node's transform, keeping the node's current representation (`NodeTransform3D` or `Mat4`):
     *
     * | Node holds | `transform` is | Stored as |
     * |---|---|---|
     * | `NodeTransform3D` | `NodeTransform3D` | `transform` itself |
     * | `NodeTransform3D` | `Mat4` | decomposed into a `NodeTransform3D` that keeps the node's current anchor |
     * | `Mat4` | `Mat4` | `transform` itself |
     * | `Mat4` | `NodeTransform3D` | `transform.getMat4()` |
     *
     * Before any transform is set (while constructing), `transform` is stored as given.
     *
     * Two cases warn, once per node: a `Mat4` whose linear part isn't a rotation times a scale, given to a PRSA node
     * (the node's transform becomes that `Mat4`, and `prsa` will throw), and a `NodeTransform3D` with a non-zero
     * anchor given to a `Mat4` node (the anchor is folded into the translation). To change the representation on
     * purpose, use `convertTransformToPRSA()`/`convertTransformToMatrix()`.
     * @param transform The new transform.
     * @throws Error if `transform` is 2D (`Mat3` or `NodeTransform2D`): it is ambiguous whether a `Mat3` means a 2D
     * homogeneous or a 3D linear transform, so convert it explicitly (`Mat4From2DH()` or `Mat4Linear()`) first.
     */
    setTransform(transform: TransformationInterface): void {
        if(transform instanceof Mat3 || transform instanceof NodeTransform2D){
            throw new Error(
                `A 3D node's transform must be a Mat4 or NodeTransform3D, but setTransform() was given a ` +
                `${transform instanceof Mat3 ? "Mat3" : "NodeTransform2D"}. Convert it explicitly first ` +
                `(Mat4From2DH() or Mat4Linear() for a Mat3, NodeTransform3D() for a NodeTransform2D).`
            );
        }
        const t:Mat4|NodeTransform3D = (transform instanceof Mat4 || transform instanceof NodeTransform3D)?
            transform : transform.getMat4();
        const current = this._transform;
        if(current === undefined){
            this._transform = t;
        }else if(current instanceof NodeTransform3D){
            if(t instanceof NodeTransform3D){
                this._transform = t;
                return;
            }
            const decomposed = NodeTransform3D.TryFromMatrix(t, {anchor: current.anchor.clone()});
            if(decomposed !== undefined){
                this._transform = decomposed;
            }else{
                this._warnTransformOnce("typeChanged",
                    `setTransform() was given a Mat4 whose linear part isn't a rotation times a scale (or that isn't ` +
                    `affine), which a NodeTransform3D can't represent, so this node's transform is now a Mat4 instead ` +
                    `of a NodeTransform3D, and node.prsa will throw.`);
                this._transform = t;
            }
        }else{
            if(t instanceof NodeTransform3D){
                this._warnIfAnchorLost(t, "setTransform()");
                this._transform = t.getMat4();
            }else{
                this._transform = t;
            }
        }
    }

    /**
     * True if this node's transform is a `NodeTransform3D` (PRSA), so `prsa` can be used. False if it is a `Mat4`.
     */
    get transformIsPRSA():boolean{
        return this._transform instanceof NodeTransform3D;
    }

    /**
     * The node's live PRSA transform (position, rotation, scale, anchor). Editing it edits the node: with
     * `autoTransformUpdate` on (the default), `node.prsa.position = V3(1, 2, 3)` redraws the node's views right away.
     *
     * A node's transform is a `NodeTransform3D` unless something made it a `Mat4`: constructing it with a `Mat4`,
     * `convertTransformToMatrix()`, or `setTransform()` with a matrix that isn't a rotation times a scale (which logs
     * a warning). A camera model can also end up holding a `Mat4` if its wrapped camera's pose is set to one
     * directly (`camera.pose = someMat4`), since that path doesn't go through `setTransform`. Then there is no live
     * PRSA to edit, and this throws rather than hand back a copy whose edits would be lost. Check `transformIsPRSA`
     * first, or call `convertTransformToPRSA()`.
     * @returns The node's own `NodeTransform3D` (not a copy).
     * @throws Error if the node's transform is a `Mat4`.
     */
    get prsa():NodeTransform3D{
        if(this._transform instanceof NodeTransform3D){
            return this._transform;
        }
        throw new Error(
            `This node's transform is a ${this._transform instanceof Mat4 ? "Mat4" : this._transform?.constructor?.name}, ` +
            `so it has no live PRSA. Call convertTransformToPRSA() first (or use getTransformAsPRSA() for a copy).`
        );
    }

    /**
     * Converts this node's transform to a `NodeTransform3D` in place, so that `prsa` works. Does nothing if it
     * already is one. The result has anchor 0 (a matrix has no anchor to keep), and its matrix is the same as
     * before, unless the `Mat4`'s linear part isn't a rotation times a scale: then the closest PRSA is used, which
     * changes how the node looks, and a warning is logged (once per node).
     */
    convertTransformToPRSA(){
        if(this._transform instanceof NodeTransform3D){
            return;
        }
        const m = this._transform.getMat4();
        let t = NodeTransform3D.TryFromMatrix(m);
        if(t === undefined){
            this._warnTransformOnce("lossyToPRSA",
                `convertTransformToPRSA(): this node's Mat4 isn't a rotation times a scale, so no NodeTransform3D ` +
                `reproduces it. Using the closest one, which changes how the node looks.`);
            t = new NodeTransform3D();
            t._setWithMatrix(m, undefined, undefined, undefined);
        }
        // Assign _transform directly: `setTransform` would keep the current representation.
        this._transform = t;
    }

    /**
     * Converts this node's transform to a `Mat4` in place. Does nothing if it already is one. The matrix is exact,
     * but it folds the anchor into the translation, so converting back gives anchor 0. If the anchor is non-zero,
     * a warning is logged (once per node).
     */
    convertTransformToMatrix(){
        if(this._transform instanceof Mat4){
            return;
        }
        const t = this._transform as NodeTransform3D;
        this._warnIfAnchorLost(t, "convertTransformToMatrix()");
        // Assign _transform directly: `setTransform` would keep the current representation.
        this._transform = t.getMat4();
    }

    /**
     * Warns (once per node) if converting `t` to a matrix loses its anchor, i.e. the anchor is non-zero.
     * @param t The PRSA transform being converted.
     * @param where The call doing the conversion, for the message.
     */
    protected _warnIfAnchorLost(t:NodeTransform3D, where:string){
        if(t.anchor.L2() > Precision.epsilon){
            this._warnTransformOnce("anchorLost",
                `${where}: this node's transform is a Mat4, so the NodeTransform3D's anchor ` +
                `(${t.anchor.x}, ${t.anchor.y}, ${t.anchor.z}) is folded into the matrix's translation. The matrix ` +
                `is exact, but the anchor can't be recovered from it.`);
        }
    }

    /**
     * @deprecated Use `prsa` to edit the node's transform, or `transform.getMat4()` to read it. This always returns
     * a **copy**: a clone of the `NodeTransform3D` if the transform is one, or a `NodeTransform3D` decomposed from the
     * `Mat4` if it isn't. Editing the copy does not change the node.
     * @returns A copy of the current transform as a `NodeTransform3D`.
     */
    getTransformAsPRSA():NodeTransform3D{
        if(this.transform instanceof NodeTransform3D){
            return this.transform.clone();
        }else{
            return NodeTransform3D.FromMatrix(this.transform as Mat4);
        }
    }

    /** @deprecated Use `convertTransformToMatrix()` instead. */
    setTransformToMat4(){
        this.convertTransformToMatrix();
    }

    /**
     * Returns the transform from object coordinates (the coordinate system `verts` is defined in) to world
     * coordinates: the product of the local matrices of this node and its node ancestors.
     * @returns The world matrix. For a node with no node parent this can be the node's own `Mat4`: don't modify it.
     */
    getWorldTransform():Mat4{
        let parent = this.parent;
        if(parent && parent instanceof ANodeModelSubclass){
            return parent.getWorldTransform().getMat4().times(this.transform.getMat4());
        }else{
            return this.transform.getMat4();
        }
    }

}



