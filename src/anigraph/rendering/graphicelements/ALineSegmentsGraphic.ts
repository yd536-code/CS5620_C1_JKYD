import {AGraphicElement} from "../graphicobject";
import {Color} from "../../math";
import {VertexArray, VertexArray3D} from "../../geometry";
import {LineSegmentsGeometry} from "three/examples/jsm/lines/LineSegmentsGeometry";
import {LineSegments2} from "three/examples/jsm/lines/LineSegments2";
import * as THREE from "three";
import {AMaterial, AGLLineMaterial} from "../material";
import {ALabel} from "../../base";
import {LineGeometry} from "three/examples/jsm/lines/LineGeometry";
import {Line2} from "three/examples/jsm/lines/Line2";

/**
 * Wide line segments drawn with Three.js's `Line2` and a line material (usually Three.js's `LineMaterial`, from
 * `ALineMaterialModel`; typed here as {@link AGLLineMaterial}, which has the same properties), so line width works
 * on all platforms. Vertices are taken in pairs: vertices 0-1 form one segment, 2-3 the next, and so on. Per-vertex
 * colors are used if the vertex array has a color attribute (and the material uses vertex colors).
 */
@ALabel("ALineSegmentsGraphic")
export class ALineSegmentsGraphic extends AGraphicElement {
    /** The line geometry. */
    get geometry(): LineGeometry {
        return this._geometry as LineGeometry;
    }

    // get color() {
    //     return this.material.color;
    // }

    // setColor(color: Color) {
    //     this.material.color = color.asThreeJS();
    // }

    // getColor() {
    //     return Color.FromThreeJS(this.color);
    // }

    /** The material's line width. */
    get lineWidth() {
        return this.material.linewidth;
    }

    /** Sets the material's line width. */
    setLineWidth(lineWidth: number) {
        this.material.linewidth = lineWidth;
    }

    /** Does nothing beyond the base class. */
    onMaterialUpdate(newMaterial: AMaterial) {
        super.onMaterialUpdate(newMaterial);
    }

    /**
     * Swaps in `newMaterial`'s Three.js material, if it is a line material (`LineMaterial` or {@link AGLLineMaterial}).
     * Any other material (e.g. a mesh material forwarded from the node model to every graphic in a view) is ignored,
     * because `Line2` can only draw with a line material.
     */
    onMaterialChange(newMaterial: AMaterial) {
        const threeMaterial: any = newMaterial?.threejs;
        if (threeMaterial && (threeMaterial.isLineMaterial || threeMaterial.type === 'LineMaterial')) {
            this.setMaterial(threeMaterial);
        }
    }

    /** The Three.js line object. */
    get threejs(): LineSegments2 {
        return this._element as LineSegments2;
    }

    /** The line material. */
    get material(): AGLLineMaterial {
        return this._material as AGLLineMaterial;
    }

    /**
     * Creates a line-segments graphic. Called on a subclass (e.g. `MyLines.Create(...)`), it creates that subclass.
     * @param verts Segment endpoints, in pairs.
     * @param material Line material or color.
     * @param lineWidth Optional line width.
     */
    static Create(verts?: VertexArray<any>, material?: Color | THREE.Color | THREE.Material | THREE.Material[] | AMaterial, lineWidth?: number) {
        let newElement = new this();
        newElement.init(verts, material);
        if (lineWidth !== undefined) {
            newElement.setLineWidth(lineWidth);
        }
        return newElement;
    }

    /** Creates an empty `LineSegmentsGeometry` (separate segments). {@link ALineGraphic} overrides this. */
    _createLineGeometry() {
        this._geometry = new LineSegmentsGeometry();
        // this._geometry = new LineGeometry();
    }

    // _createLineGeometry(){
    //     this._geometry = new THREE.BufferGeometry();
    // }

    /** Sets any given geometry/material and creates the line object. Throws if it already exists. */
    init(geometry?: LineSegmentsGeometry | LineGeometry | VertexArray<any>, material?: Color | THREE.Color | THREE.Material | THREE.Material[] | AMaterial) {
        if (this._element) {
            throw new Error(`Tried to call init on GraphicElement that already has _element ${this._element}`);
        }
        this._initIfNotAlready(geometry, material);
    }

    /**
     * Sets any given geometry (a line geometry is used directly; a vertex array goes through `setGeometry`) and
     * material, then creates the `Line2` object if both exist. Unlike the base class, it does not throw when one is
     * missing.
     */
    _initIfNotAlready(geometry?: LineSegmentsGeometry | LineGeometry | VertexArray<any>, material?: Color | THREE.Color | THREE.Material | THREE.Material[] | AMaterial) {
        if (geometry) {
            if (geometry instanceof LineSegmentsGeometry || geometry instanceof LineGeometry) {
                this._geometry = geometry;
            } else {
                // this._createLineGeometry();
                this.setGeometry(geometry);
            }
        }
        if (material) {
            this.setMaterial(material);
        }
        if (this.material && this.geometry) {
            // @ts-ignore
            this._element = new Line2(this.geometry, this.material);
            this._element.matrixAutoUpdate = false;
        }
    }


    /**
     * Sets the geometry. A `THREE.BufferGeometry` is used directly if none is set yet (otherwise it throws); a
     * `VertexArray3D` goes to `setLineVerts`; any other vertex array goes to `setVerts2D`.
     */
    setGeometry(geometry:THREE.BufferGeometry|VertexArray<any>){
        if(geometry instanceof THREE.BufferGeometry){
            if(this._geometry) {
                throw new Error(`called setGeometry with THREE.BufferGeometry when _geometry is already set...`);
            }else{
                this._geometry = geometry;
            }
        }else{
            if(!(geometry instanceof VertexArray3D)){
                // throw new Error(`cannot set geometry with non-VertexArray3D VertexArray... ${geometry}`);
                // @ts-ignore
                this.setVerts2D(geometry);
                return;
            }else {
                this.setLineVerts(geometry);
                return;
                // if (!this._geometry) {
                //     this._geometry = new THREE.BufferGeometry();
                // }
                // this._setBufferGeometry(geometry);
            }
        }
    }




    /** Sets segment colors from a flat RGBA list: 8 numbers per segment (start RGBA, then end RGBA). */
    setColors(rgba: number[] | Float32Array) {
        let colors: Float32Array;
        if (rgba instanceof Float32Array) {
            colors = rgba;
        } else {
            colors = new Float32Array(rgba);
        }
        const instanceColorBuffer = new THREE.InstancedInterleavedBuffer(colors, 8, 1); // rgba, rgba
        this.geometry.setAttribute('instanceColorStart', new THREE.InterleavedBufferAttribute(instanceColorBuffer, 4, 0)); // rgba
        this.geometry.setAttribute('instanceColorEnd', new THREE.InterleavedBufferAttribute(instanceColorBuffer, 4, 4)); // rgba
    }

    /**
     * Rebuilds the line geometry from a vertex array's positions (and colors, if present). Throws for a plain number
     * array. Works the same as `setLineVerts`.
     */
    setVerts2D(verts: VertexArray<any> | number[]) {
        let geometry = verts;
        if (Array.isArray(verts)) {
            // geometry = VertexArray2D.CreateLineSegments2D(verts);
            throw new Error("Setting verts from array not implemented yet")
        }

        if (this._geometry) {
            this._geometry.dispose();
        }
        this._createLineGeometry();
        if ((geometry as VertexArray<any>).nVerts > 0) {
            this.geometry.setPositions((geometry as VertexArray<any>).position.getElementsSlice());
            if((geometry as VertexArray<any>).color !== undefined && (geometry as VertexArray<any>).color.nVerts>0) {
                this.setColors((geometry as VertexArray<any>).color.getElementsSlice());
            }
        }

        if (this._element) {
            this.element.geometry = this._geometry;
        }
    }

    /** Rebuilds the line geometry from a vertex array's positions (and colors, if present). Throws for a plain number array. */
    setLineVerts(verts: VertexArray<any>|number[]) {
        let geometry = verts;
        if (Array.isArray(verts)) {
            // geometry = VertexArray2D.CreateLineSegments2D(verts);
            throw new Error("Setting verts from array not implemented yet")
        }

        if (this._geometry) {
            this._geometry.dispose();
        }
        this._createLineGeometry();
        if ((geometry as VertexArray<any>).nVerts > 0) {
            this.geometry.setPositions((geometry as VertexArray<any>).position.getElementsSlice());
            if((geometry as VertexArray<any>).color !== undefined && (geometry as VertexArray<any>).color.nVerts>0) {
                this.setColors((geometry as VertexArray<any>).color.getElementsSlice());
            }
        }

        if (this._element) {
            this.element.geometry = this._geometry;
        }
    }


}

