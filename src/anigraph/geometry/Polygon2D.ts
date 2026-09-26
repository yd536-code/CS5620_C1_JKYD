// import {
//     Color,
//     Mat3,
//     Mat4,
//     V2,
//     Vec2,
//     VertexArray2D,
//     VertexAttributeArray2D,
//     VertexAttributeArray3D,
//     VertexIndexArray
// } from "../index";

import {Color, V2, Vec2, Mat3, Mat4} from "../math"

import {VertexArray2D} from "./VertexArray2D";
import {VertexAttributeArray2D, VertexPositionArray2DH} from "./VertexAttributeArray";
import {LineSegment} from "./LineSegment";

const DefaultTextureMatrix =Mat4.From2DMat3(Mat3.Scale2D(0.5).times(Mat3.Translation2D(1.0, 1.0)));

/**
 * A 2D polygon: a {@link VertexArray2D} whose vertices, in order, trace the polygon's boundary (the last vertex
 * connects back to the first).
 */
export class Polygon2D extends VertexArray2D{

    /** Returns the square with corners at `(±scale, ±scale)`, counterclockwise from `(-scale, -scale)`. */
    static Square(scale:number=1){
        return this.FromLists([
            V2(-1,-1).times(scale),
            V2(1,-1).times(scale),
            V2(1, 1).times(scale),
            V2(-1, 1).times(scale)
        ]);
    }

    /**
     * Creates a new uv attribute and fills it by transforming each vertex position by `mat`.
     * @param mat Maps positions to texture coordinates. The default maps `[-1, 1]` in x and y to `[0, 1]`.
     */
    setTextureMatrix(mat?:Mat4){
        mat = mat? mat:DefaultTextureMatrix;
        this.initUVAttribute();
        let uvVals:Vec2[] = [];
        for (let i=0;i<this.length;i++) {
            let position = this.position.getAt(i);
            let p4t = mat.times(position.Point3DH).getHomogenized();
            uvVals.push(V2(p4t.x, p4t.y));
        }
        this.uv.pushArray(uvVals);
    }

    /**
     * Returns a square of side `scale` centered at the origin, with uv coordinates from 0 to `wraps`. Unlike
     * {@link VertexArray2D.SquareXYUV}, it has no triangle indices.
     */
    static SquareXYUV(scale:number=1, wraps:number=1){
        let verts = new Polygon2D();
        verts.position= new VertexPositionArray2DH();
        verts.position.push(V2(-0.5,-0.5).times(scale))
        verts.position.push(V2(0.5,-0.5).times(scale))
        verts.position.push(V2(0.5,0.5).times(scale))
        verts.position.push(V2(-0.5,0.5).times(scale))
        verts.uv = new VertexAttributeArray2D()
        verts.uv.push(V2(0,0).times(wraps));
        verts.uv.push(V2(1,0).times(wraps));
        verts.uv.push(V2(1,1).times(wraps));
        verts.uv.push(V2(0,1).times(wraps));
        return verts;
    }


    /**
     * Returns a `width` by `height` rectangle centered at the origin, with every vertex set to `color`
     * (default green).
     */
    static ColoredRectangle(width:number=1,height:number=1, color?:Color){
        let rval = this.CreateForRendering();
        let wh = width*0.5;
        let hh = height*0.5;
        rval.addVertices([
            V2(-wh,-hh),
            V2(wh,-hh),
            V2(wh, hh),
            V2(-wh, hh)
        ],
            color??Color.Green()
        );
        return rval;
    }

    /**
     * Returns a copy of the polygon with vertices that have been transformed by the provided matrix.
     * @param {Mat3 | Mat4} m
     * @returns {this}
     */
    GetTransformedBy(m:Mat3|Mat4){
        let rval = this.clone();
        rval.ApplyMatrix(m);
        return rval;
    }


    /**
     * Returns the position of the vertex corresponding to the provided index
     * @param index - the index of the vertex you want
     * @returns {Vec2}
     */
    vertexAt(index:number):Vec2{
        return this.getPoint2DAt(index);
    }

    //##############################################################################################
    //#########################Below here students should implement#################################
    //##############################################################################################

    /**
     * Returns the edge corresponding to the provided index, as a {@link LineSegment} from vertex `index` to the next
     * vertex. The last edge wraps around to vertex 0.
     * You can get the ith vertex in the polygon boundary with `this.vertexAt(i)` and the number of vertices with `this.nVerts`.
     * @param index
     * @returns {LineSegment}
     */
    edgeAt(index:number):LineSegment{
        // TODO: Replace with your code
        // throw new Error("Not Implemented")
        let startVertex = this.vertexAt(index);
        let endVertex =this.vertexAt((index+1)%this.nVerts);
        return new LineSegment(startVertex, endVertex);

    }

    /**
     * Returns all intersections with the provided line segment.
     * Returns a list of all intersection locations, which is empty if no intersections exist.
     * @param segment
     * @returns {Vec2[]}
     */
    getIntersectionsWithSegment(segment:LineSegment):Vec2[]{
        // TODO: Replace with your code
        // throw new Error("Not Implemented")
        let rIntersects:Vec2[]=[];
        for(let i=0;i<this.nVerts;i++){
            let edge = this.edgeAt(i);
            let intersect = edge.intersect(segment);
            if(intersect instanceof Vec2){
                rIntersects.push(intersect);
            }
        }
        return rIntersects;
    }

    /**
     * Detects intersections with the provided polygon.
     * Returns a list of all intersection locations, which is empty if no intersections exist.
     * @param other
     * @returns {Vec2[]}
     */
    getIntersectionsWithPolygon(other:Polygon2D): Vec2[]{
        // TODO: Replace with your code
        // throw new Error("Not Implemented")
        let rIntersects:Vec2[]=[];
        for(let i=0;i<this.nVerts;i++){
            let edge = this.edgeAt(i);
            let intersects = other.getIntersectionsWithSegment(edge);
            rIntersects = [...rIntersects, ...intersects];
        }
        return rIntersects;
    }

    /**
     * Same as `VertexArray2D.CreateForRendering` except that texture coordinates are off by default
     * (`hasTextureCoords = false`, where the parent's default is `true`). Returns an instance of the class it is
     * called on.
     * @param hasColors Whether to allocate a color attribute.
     * @param hasTextureCoords Whether to allocate a uv attribute.
     * @param hasNormals Whether to allocate a normal attribute.
     * @returns A new empty polygon set up for rendering.
     */
    static CreateForRendering(
        hasColors: boolean = true,
        hasTextureCoords: boolean = false,
        hasNormals: boolean = false,
    ): Polygon2D {
        return super.CreateForRendering(hasColors, hasTextureCoords, hasNormals) as Polygon2D;
    }


}



