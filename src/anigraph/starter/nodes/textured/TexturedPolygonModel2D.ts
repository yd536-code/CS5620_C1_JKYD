import {PolygonModel2D} from "../polygon2D";
import {Mat3, Mat4, TransformationInterface, V2, Vec2} from "../../../math";
import {AShaderMaterial, ATexture} from "../../../rendering";
import {AObject} from "../../../base";
import {Polygon2D} from "../../../geometry";

const DefaultTextureMatrix =Mat4.From2DMat3(Mat3.Scale2D(0.5).times(Mat3.Translation2D(1.0, 1.0)));
// Mat4.From2DMat3(
//     Mat3.Translation2D(V2(0.5,0.5)).times(
//         Mat3.Scale2D(0.5)
//     )
// )
// const DefaultTextureMatrix =Mat4.From2DMat3(
//     Mat3.Translation2D(1.0, 1.0).times(Mat3.Scale2D(0.5))
// );

/**
 * A {@link PolygonModel2D} with texture coordinates. Each vertex's uv is its position transformed by
 * `textureMatrix`; the default maps positions in `[-1, 1]` to uvs in `[0, 1]`. The texture itself is set on the
 * model's material with `setTexture`.
 */
export class TexturedPolygonModel2D extends PolygonModel2D{
    _textureMatrix:Mat4 = DefaultTextureMatrix;
    /** The matrix that maps vertex positions to texture coordinates. Set it with `setTextureMatrix`. */
    get textureMatrix(){return this._textureMatrix;}

    /**
     * Sets `textureMatrix` and recomputes every vertex's uv from its position, then signals a geometry update.
     * Call it again if you change the vertices.
     */
    setTextureMatrix(mat:Mat4){
        this._textureMatrix=mat;
        this.verts.initUVAttribute();
        let uvVals:Vec2[] = [];
        for (let i=0;i<this.verts.length;i++) {
            let position = this.verts.position.getAt(i);
            let p4t = mat.times(position.Point3DH).getHomogenized();
            uvVals.push(V2(p4t.x, p4t.y));
            // uvVals.push(V2(1, 1));
        }
        this.verts.uv.pushArray(uvVals);
        this.signalGeometryUpdate()
    }

    get material():AShaderMaterial{
        return this._material as AShaderMaterial;
    }


    /**
     * Adds a listener for this node's `TEXTURE_UPDATE` event. AniGraph never signals that event itself (`setTexture`
     * doesn't), so the callback only runs when your code calls `signalEvent` with it. Like every event listener, the
     * callback runs synchronously, inside the call that signals the event.
     * @param callback called with this node when the event is signaled
     * @param handle optional name for the listener; reusing a handle replaces the earlier listener
     * @returns a callback switch; call `deactivate()` on it to remove the listener
     */
    addTextureUpdateListener(callback:(self:AObject)=>void, handle?:string){
        return this.addEventListener(TexturedPolygonModel2D.NodeModelEvents.TEXTURE_UPDATE, callback, handle);
    }

    /**
     * @param verts the polygon
     * @param transform the initial transform
     * @param textureMatrix position-to-uv matrix; a `Mat3` is treated as a 2D homogeneous transform. Defaults to
     * mapping `[-1, 1]` to `[0, 1]`.
     */
    constructor(verts?:Polygon2D, transform?:TransformationInterface, textureMatrix?:Mat3|Mat4, ...args:any[]) {
        super(verts, transform);
        if(textureMatrix){
            if(textureMatrix instanceof Mat3){
                this.setTextureMatrix(textureMatrix.Mat4From2DH());
            }else{
                this.setTextureMatrix(textureMatrix);
            }
        }else{
            this.setTextureMatrix(DefaultTextureMatrix);
        }
    }

    /** Sets the material's `diffuse` texture. The material must be an `AShaderMaterial` with that texture slot. */
    setTexture(texture:ATexture){
        this.material.setTexture('diffuse', texture);
    }
}

