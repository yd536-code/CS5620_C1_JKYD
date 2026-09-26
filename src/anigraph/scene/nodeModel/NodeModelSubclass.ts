import {Mat4, TransformationInterface} from "../../math";
import {VertexArray} from "../../geometry";
import {ANodeModel} from "./ANodeModel";

/**
 * Generic middle layer between {@link ANodeModel} and the 2D/3D node classes. It fixes the node's transform type and
 * vertex-array type, stores the vertices in `geometry.verts`, and provides `getWorldRenderMatrix` and the
 * once-per-node transform warnings. Scene code subclasses {@link ANodeModel2D} or {@link ANodeModel3D}, not this.
 * @typeParam TransformType The node's transform type (`TransformationInterface2D` or `TransformationInterface3D`).
 * @typeParam VertexArrayType The node's vertex-array type (for example `VertexArray2D` or `VertexArray3D`).
 */
export abstract class ANodeModelSubclass<TransformType extends TransformationInterface, VertexArrayType extends VertexArray<any>> extends ANodeModel{

    /** Sets the node's transform, keeping its current representation (see `ANodeModel.setTransform`). */
    abstract setTransform(transform:TransformType):void;
    /** Resets the transform to identity in the class's default representation. */
    abstract setTransformToIdentity():void;
    /** The transform from this node's object coordinates to world coordinates. */
    abstract getWorldTransform():TransformationInterface;

    /**
     * The embedded world matrix: `embedTransform(this.getWorldTransform())`. Use this for a render object that is
     * placed in world coordinates rather than nested under its parent's render object.
     * @returns The embedded world transform. Do not modify it.
     */
    getWorldRenderMatrix():Mat4{
        return this.embedTransform(this.getWorldTransform());
    }

    /** The node's transform relative to its parent. */
    get transform():TransformType{
        return this._transform as TransformType;
    };
    /**
     * Same as `setTransform(t)`, so it follows `setTransform`'s rule of keeping the node's current representation.
     * Code that means to change the representation (the `convertTransformTo...` methods) assigns `_transform`
     * directly instead.
     */
    protected set transform(t:TransformType){
        this.setTransform(t);
    }

    /**
     * The kinds of transform-representation warning (see `_warnTransformOnce`) this node has already logged. A plain
     * field on purpose: it is not `@AObjectState` (a change would redraw every view) and it is not saved.
     */
    protected _transformWarningsLogged?:Set<string>;

    /**
     * Logs `message` as a console warning the first time this node hits a given kind of transform-representation
     * issue, and never again for that node and kind. Development builds only. Several scenes call `setTransform`
     * every frame, so a per-call warning would flood the console.
     * @param kind Which issue this is (for example `"typeChanged"` or `"anchorLost"`).
     * @param message The warning to log.
     */
    protected _warnTransformOnce(kind:string, message:string){
        if(process.env.NODE_ENV === "production"){
            return;
        }
        if(this._transformWarningsLogged === undefined){
            this._transformWarningsLogged = new Set<string>();
        }
        if(this._transformWarningsLogged.has(kind)){
            return;
        }
        this._transformWarningsLogged.add(kind);
        console.warn(`${this.constructor.name} "${this.name}": ${message} (Logged once per node.)`);
    }

    /** The node's vertex array (`geometry.verts`). After editing it in place, call `signalGeometryUpdate()`. */
    get verts(): VertexArrayType{
        return this._geometry.verts as VertexArrayType;
    }

    /** Replaces the vertex array without signaling a geometry update (used by constructors). */
    _setVerts(verts: VertexArrayType) {
        this._geometry.verts=verts;
    }
    /** Replaces the vertex array and signals a geometry update, so views rebuild their graphics. */
    setVerts(verts: VertexArrayType) {
        this._setVerts(verts);
        this.signalGeometryUpdate();
    }

    /**
     * @param verts The initial vertices, if any.
     * @param transform The initial transform, stored as given (no representation exists yet to keep). If omitted,
     * `setTransformToIdentity()` sets the class's default.
     */
    constructor(verts?:VertexArrayType, transform?:TransformType) {
        super();
        if(transform !== undefined){
            this.setTransform(transform);
            // this._transform = transform;
        }else{
            //setTransform can always take a TransformationInterface, so we can use it here regardless of TransformType
            // this.setTransform();
            this.setTransformToIdentity();
        }
        if(verts !== undefined){
            this._setVerts(verts);
        }
    }

    // /**
    //  * Returns the transform from object coordinates (the coordinate system where this.verts is
    //  * defined) to world coordinates
    //  * @returns {TransformType}
    //  */
    // getWorldTransform():Matrix{
    //     let parent = this.parent;
    //     if(parent && parent instanceof ANodeModelSubclass){
    //         // return parent.getWorldTransform().getMat4().times(this.transform.getMat4());
    //         return parent.getWorldTransform().times(this.transform.getMatrix());
    //
    //     }else{
    //         return this.transform.getMatrix();
    //     }
    // }



}
