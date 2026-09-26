import { VectorBase} from "../math";
import {ASerializable} from "../base/aserial";

/**
 * A flat list of vertex indices, `VertsPerElement` per element (3 for triangles, 2 for line segments). This is the
 * type of {@link VertexArray.indices}. It has its own `@ASerializable` decoration because subclasses don't inherit
 * serializability from {@link VectorBase}.
 */
@ASerializable("VertexIndexArray")
export class VertexIndexArray extends VectorBase {
  /** Number of indices per element (3 for triangles). */
  public VertsPerElement: number;
  /** @param vertsPerElement Indices per element (default 3). */
  constructor(vertsPerElement: number = 3) {
    super();
    this.VertsPerElement = vertsPerElement;
  }
  /**
   * Returns the vertex indices stored for element `i` (e.g., the three vertex indices of triangle `i`). For
   * triangles pushed as `push([4, 5, 6])` and then `push([7, 8, 9])`, `getAt(1)` returns `[7, 8, 9]`.
   */
  getAt(i: number): number[] {
    let rval: number[] = [];
    for (let j = 0; j < this.VertsPerElement; j++) {
      rval.push(this.elements[i * this.VertsPerElement + j]);
    }
    return rval;
  }

  /** Sets the indices of element `i`. */
  setAt(i: number, inds: number[]) {
    let startIndex = i * this.VertsPerElement;
    for (let j = 0; j < this.VertsPerElement; j++) {
      this.elements[startIndex + j] = inds[j];
    }
  }

  /** Number of elements (e.g., triangles): `elements.length / VertsPerElement`. */
  get nElements(): number {
    return this.elements.length / this.VertsPerElement;
  }

  /**
   * Same as `nElements`. This counts elements (e.g., triangles), not vertices.
   * @deprecated Use `nElements`.
   */
  get nVerts(): number {
    return this.nElements;
  }

  /**
   * Appends indices. `inds` is usually one element's worth, but any length is appended as-is (e.g.,
   * {@link VertexArray3D.Axis} pushes six line-segment indices at once).
   */
  push(inds: number[]) {
    let newinds = inds.slice();
    this.elements = this.elements.concat(newinds);
  }

  /** Returns a copy, including `VertsPerElement`. */
  clone() {
    let rval = super.clone();
    rval.VertsPerElement = this.VertsPerElement;
    return rval;
  }

  /** Copies the index buffer of a three.js geometry (empty if `index` is null). `VertsPerElement` is 3. */
  static FromThreeJS(index: THREE.BufferAttribute | null) {
    let iar = new VertexIndexArray();
    if (index) {
      iar.elements = Array.from(index.array);
    }
    return iar;
  }
}
