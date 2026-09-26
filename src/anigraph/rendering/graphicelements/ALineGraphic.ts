import {ALineSegmentsGraphic} from "./ALineSegmentsGraphic";
import {LineGeometry} from "three/examples/jsm/lines/LineGeometry";
import {Line2} from "three/examples/jsm/lines/Line2";
import {ALabel} from "../../base";
import {VertexArray} from "../../geometry";
import {Color} from "../../math";
import * as THREE from "three";
import {AMaterial} from "../material";

/**
 * A connected polyline drawn with wide lines (`Line2` / `LineGeometry`), where each vertex connects to the next.
 * Compare {@link ALineSegmentsGraphic}, where each pair of vertices is a separate segment.
 */
@ALabel("ALineGraphic")
export class ALineGraphic extends ALineSegmentsGraphic{
    /** The `LineGeometry`. */
    get geometry():LineGeometry{
        return this._geometry as LineGeometry;
    }
    /** The `Line2` object. */
    get threejs():Line2{
        return this._element as Line2;
    }
    /** Creates an empty `LineGeometry` (a connected polyline). */
    _createLineGeometry() {
        this._geometry = new LineGeometry();
    }

    /**
     * Sets per-vertex colors from a flat RGBA list `[r1, g1, b1, a1, r2, ...]`, converting it to the start/end color
     * pairs used for each segment of the polyline.
     */
    setColors(rgba: number[]|Float32Array) {
        // converts [ r1, g1, b1, a1,  r2, g2, b2, a2, ... ] to (start, end) pairs format
        const length = rgba.length - 4;
        const colors = new Float32Array(2 * length);

        for (let i = 0; i < length; i += 4) {
            colors[2 * i] = rgba[i];
            colors[2 * i + 1] = rgba[i + 1];
            colors[2 * i + 2] = rgba[i + 2];
            colors[2 * i + 3] = rgba[i + 3];

            colors[2 * i + 4] = rgba[i + 4];
            colors[2 * i + 5] = rgba[i + 5];
            colors[2 * i + 6] = rgba[i + 6];
            colors[2 * i + 7] = rgba[i + 7];

        }
        super.setColors(colors);
    }

    // setPositions( positions: number[]|Float32Array) {
    //     // converts [ r1, g1, b1,  r2, g2, b2, ... ] to pairs format
    //     const length = positions.length - 3;
    //     const points = new Float32Array( 2 * length );
    //     for ( let i = 0; i < length; i += 3 ) {
    //         points[ 2 * i ] = positions[ i ];
    //         points[ 2 * i + 1 ] = positions[ i + 1 ];
    //         points[ 2 * i + 2 ] = positions[ i + 2 ];
    //         points[ 2 * i + 3 ] = positions[ i + 3 ];
    //         points[ 2 * i + 4 ] = positions[ i + 4 ];
    //         points[ 2 * i + 5 ] = positions[ i + 5 ];
    //     }
    //     super.setPositions( points );
    //     return this;
    // }



    /**
     * Creates a polyline graphic.
     * @param verts Vertices (and optional per-vertex colors).
     * @param material Line material or color.
     * @param lineWidth Optional line width.
     */
    static Create(verts?:VertexArray<any>, material?:Color|THREE.Color|THREE.Material|THREE.Material[]|AMaterial, lineWidth?:number){
        // let newElement = new this(verts, material);
        // newElement.init();
        let newElement = new this();
        newElement.init(verts, material);
        if(lineWidth !== undefined){
            newElement.setLineWidth(lineWidth);
        }
        return newElement;
    }

}

