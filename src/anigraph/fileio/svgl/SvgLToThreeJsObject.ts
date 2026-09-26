import * as THREE from "three";
import type { SvgLNode, SVGLParsedData } from "./SVGLLoader";
import { SVGLLoader, SVGLPath } from "./SVGLLoader";

/**
 * Sets the scale and rotation of `object` from the 4x4 homogeneous matrix `m4`, and adds the matrix's translation
 * to the object's current position (the translation is added, not assigned).
 * @param object Three.js object to modify
 * @param m4 4x4 homogeneous matrix
 */
export function setAttributesFromMatrix(
  object: THREE.Object3D,
  m4: THREE.Matrix4
) {
  object.position.add(new THREE.Vector3().setFromMatrixPosition(m4));
  object.scale.copy(new THREE.Vector3().setFromMatrixScale(m4));
  object.rotation.copy(
    new THREE.Euler().setFromRotationMatrix(
      new THREE.Matrix4().extractRotation(m4)
    )
  );
}

/**
 * Shifts `object`'s position so that the center of its bounding box moves to the origin.
 */
export function moveObjectToWorldCenter(object: THREE.Object3D) {
  let center = new THREE.Vector3();
  let boundingBox = new THREE.Box3().setFromObject(object);
  boundingBox.getCenter(center);
  object.position.sub(center);
}

/**
 * Creates the meshes for one parsed SVG path: one mesh per filled shape (if the path has a fill) and one mesh per
 * stroked subpath (if it has a stroke), each with a `THREE.MeshBasicMaterial` in the path's color.
 * @returns the fill meshes followed by the stroke meshes
 */
export function createMeshesFromPath(path: SVGLPath) {
  const meshes: THREE.Mesh[] = [];
  addFillMeshes(meshes);
  addStrokeMeshes(meshes);
  return meshes;

  function addFillMeshes(meshes: THREE.Mesh[]) {
    const fillColor = path.userData.style.fill;
    if (fillColor !== undefined && fillColor !== "none") {
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setStyle(fillColor),
        opacity: path.userData.style.fillOpacity,
        // Only turn on blending when the fill is actually see-through.
        transparent:
          path.userData.style.fillOpacity !== undefined &&
          path.userData.style.fillOpacity < 1,
        side: THREE.DoubleSide,
        depthWrite: true,
        wireframe: false,
      });

      const shapes: THREE.Shape[] = SVGLLoader.createShapes(path);

      for (let j = 0; j < shapes.length; j++) {
        const shape = shapes[j];
        const geometry = new THREE.ShapeGeometry(shape);
        const mesh = new THREE.Mesh(geometry, material);
        meshes.push(mesh);
      }
    }
  }
  function addStrokeMeshes(meshes: THREE.Mesh[]) {
    const strokeColor = path.userData.style.stroke;

    if (strokeColor !== undefined && strokeColor !== "none") {
      // const material = new THREE.MeshBasicMaterial({
      //   color: new THREE.Color().setStyle(strokeColor),
      //   opacity: path.userData.style.strokeOpacity,
      //   transparent:
      //     path.userData.style.strokeOpacity &&
      //     path.userData.style.strokeOpacity < 1
      //       ? true
      //       : false,
      //   side: THREE.DoubleSide,
      //   depthWrite: false,
      //   wireframe: false,
      // });
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setStyle(strokeColor),
        opacity: path.userData.style.strokeOpacity,
        transparent:
          path.userData.style.strokeOpacity &&
          path.userData.style.strokeOpacity < 1
            ? true
            : false,
        side: THREE.DoubleSide,
        depthWrite: true,
        wireframe: false,
      });

      for (let j = 0, jl = path.subPaths.length; j < jl; j++) {
        const subPath = path.subPaths[j];

        const geometry = SVGLLoader.pointsToStroke(
          subPath.getPoints(),
          path.userData.style
        );

        if (geometry) {
          const mesh = new THREE.Mesh(geometry, material);

          meshes.push(mesh);
        }
      }
    }
  }
}

/**
 * Converts a flat position list (x1,y1,z1,x2,y2,...)
 * into an array of vertices [[x1,y1,z1],[x2,y2,z2],...].
 * @example
 * const vertices = verticesFromPositionList(positions)
 * // e.g. vertices = [[1,2,0], [2,3,0]]
 */
export function verticesFromPositionList(
  positions: THREE.BufferAttribute | THREE.InterleavedBufferAttribute
): number[][] {
  const vertices = [];
  let index = 0;
  while (index < positions.array.length) {
    const vertex = [];
    for (let i = 0; i < 3; i++) {
      vertex.push(positions.array[index]);
      index++;
    }
    vertices.push(vertex);
  }
  return vertices;
}

/**
 * Moves the vertices of `mesh` so they are centered on its local origin, and sets `mesh.position` to the old
 * center so the mesh stays in the same place in its parent's coordinates. Only x and y are centered.
 * In effect: `vertices -= center; mesh.position = center`.
 */
export function makeOriginCenterForMesh(mesh: THREE.Mesh) {
  const center = getCenter(mesh);
  centerWithoutMove(mesh, center);
}

/** Returns the center of `mesh`'s geometry bounding box, in the mesh's local coordinates. */
export function getCenter(mesh: THREE.Mesh): THREE.Vector3 {
  mesh.geometry.computeBoundingBox();
  let center = new THREE.Vector3();
  mesh.geometry.boundingBox!.getCenter(center);
  return center;
}

/**
 * Subtracts `center` from the x and y of every vertex of `mesh`, then sets `mesh.position` to
 * `(center.x, center.y, 0)` so the mesh stays in place in its parent's coordinates (assuming its position was
 * zero before). Replaces the mesh's position attribute with a new one.
 */
export function centerWithoutMove(mesh: THREE.Mesh, center: THREE.Vector3) {
  /**
   * @return [vertex1, vertex2,...] or [[x1,y1,z1],[x2,y2,z2],...]
   * @example return [[1,2,0], [2,3,0]]
   */
  function getVertices(mesh: THREE.Mesh) {
    const positions = mesh.geometry.getAttribute("position");
    const vertices = verticesFromPositionList(positions);
    return vertices;
  }
  const vertices = getVertices(mesh);
  // center vertices
  vertices.forEach((vertex) => {
    vertex[0] -= center.x;
    vertex[1] -= center.y;
  });
  mesh.geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices.flat(), 3)
  );
  // update position of matrix to make sure it doesn't move
  mesh.position.set(center.x, center.y, 0);
  mesh.updateMatrix();
  // make sure future references of bounding box is correct
  mesh.geometry.computeBoundingBox();
}

/**
 * Moves the local origin of `group` to the center of its bounding box while keeping its children in place.
 * In effect: `eachChild.position -= center; group.position += center`.
 */
export function makeOriginCenterForGroup(group: THREE.Group) {
  let center = new THREE.Vector3();
  let boundingBox = new THREE.Box3().setFromObject(group);
  boundingBox.getCenter(center);
  for (const child of group.children) {
    child.position.sub(center);
  }
  group.position.add(center);
}

/** Converts a 2D homogeneous `Matrix3` into the equivalent `Matrix4` that acts on the xy-plane. */
function matrix4FromMatrix3(matrix3: THREE.Matrix3): THREE.Matrix4 {
  function from1Dto2DArray(list: number[]) {
    let m: number[][] = [[], [], []];
    let index = 0;
    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < 3; i++) {
        m[i].push(list[index]);
        index++;
      }
    }
    return m;
  }
  const m = from1Dto2DArray(matrix3.toArray());
  const m4 = [
    [m[0][0], m[0][1], 0, m[0][2]],
    [m[1][0], m[1][1], 0, m[1][2]],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
  return new THREE.Matrix4().fromArray(m4.flat()).transpose();
}

/**
 * Loads an SVG file and returns a hierarchy of Three.js objects for it, centered on the origin, scaled by 0.3,
 * and flipped in y.
 * @param svgUrl URL of the SVG file
 * @example
 * const obj = await SvgLToThreeJsObject('./sbsp.svg');
 */
export async function SvgLToThreeJsObject(
  svgUrl: string
): Promise<THREE.Object3D> {
  const svgParsedData = await loadSvgLData(svgUrl);
  const svgRootThreeJSObject = generateThreeJSGroupForSVGL(svgParsedData);
  moveObjectToWorldCenter(svgRootThreeJSObject);
  svgRootThreeJSObject.scale.multiplyScalar(0.3);
  svgRootThreeJSObject.scale.y *= -1;
  return svgRootThreeJSObject;
}

/** Loads and parses the SVG file at `svgUrl`. */
async function loadSvgLData(svgUrl: string) {
  const loader = new SVGLLoader();
  const svgParsedData: SVGLParsedData = await loader.load(svgUrl);
  return svgParsedData;
}

/** Parses SVG text and returns a hierarchy of Three.js objects for it, centered on the origin and flipped in y. */
export function SvgLTextToThreeJsObject(svgText: string): THREE.Object3D {
  const svgParsedData = parseSVGL(svgText);
  const svgRootThreeJSObject = generateThreeJSGroupForSVGL(svgParsedData);
  moveObjectToWorldCenter(svgRootThreeJSObject);
  svgRootThreeJSObject.scale.multiplyScalar(1.0);
  svgRootThreeJSObject.scale.y *= -1;
  return svgRootThreeJSObject;
}

/**
 * Builds a hierarchy of Three.js objects from parsed SVG data, without centering, scaling, or flipping it. The
 * root has `matrixAutoUpdate` turned off. Used by {@link SVGLAsset}.
 */
export function ThreeJSObjectFromParsedSVGL(
  svgParsedData: SVGLParsedData
): THREE.Object3D {
  const svgRootThreeJSObject = generateThreeJSGroupForSVGL(svgParsedData);
  // moveObjectToWorldCenter(svgRootThreeJSObject);
  // svgRootThreeJSObject.scale.multiplyScalar(1.0);
  // svgRootThreeJSObject.scale.y *= -1;
  // svgRootThreeJSObject.updateMatrix();
  svgRootThreeJSObject.matrixAutoUpdate = false;
  return svgRootThreeJSObject;
}

/**
 * Reads a user-provided `File` (e.g. from a file input) as text. Resolves with the file's contents; rejects if the
 * file can't be read (with the reader's `DOMException` if it has one, otherwise the error event). Callers decide
 * how to tell the user, e.g. with a `.catch`.
 */
export function getSVGLTextFromFile(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target?.result);
    };
    reader.onerror = (event) => {
      reject(reader.error ?? event);
    };
    reader.readAsText(file);
  });
}

/** Parses SVG text with a new {@link SVGLLoader}. */
function parseSVGL(svgText: string) {
  const loader = new SVGLLoader();
  const svgParsedData: SVGLParsedData = loader.parse(svgText);
  return svgParsedData;
}

/** Builds the Three.js object for the root node of parsed SVG data. */
function generateThreeJSGroupForSVGL(svgData: SVGLParsedData): THREE.Object3D {
  const rootSvgNode = svgData.rootSvgNode;
  const svgThreeJsRootObject: THREE.Object3D =
    createThreeJSObject(rootSvgNode)[0];
  return svgThreeJsRootObject;
}

/**
 * Recursively builds Three.js objects for an SVG node. A node with children becomes a `THREE.Group`; a node with
 * a path (path, rect, circle, ...) becomes one or more meshes. Each object is named after the node's `id` (or
 * its tag name if it has none), centered on its own origin, and given the node's `localTransform`.
 * @param root the SVG node to convert
 * @returns `[group]`, the node's meshes, or `[]` if the node has neither children nor a path
 */
function createThreeJSObject(root: SvgLNode): THREE.Object3D[] {
  // treat root as a group if it has any children
  if (root.children.length > 0) {
    const group = new THREE.Group();
    group.name = root.id ?? root.node.nodeName;
    for (const child of root.children) {
      const childSceneArray = createThreeJSObject(child);
      if (childSceneArray) {
        childSceneArray.forEach((scene) => group.add(scene));
      }
    }
    makeOriginCenterForGroup(group);
    setAttributesFromMatrix(group, matrix4FromMatrix3(root.localTransform));
    return [group];
  } else if (root.originPath) {
    const meshes = createMeshesFromPath(root.originPath);
    meshes.forEach((mesh: THREE.Mesh) => {
      mesh.name = root.id ?? root.node.nodeName;
      makeOriginCenterForMesh(mesh);
      setAttributesFromMatrix(mesh, matrix4FromMatrix3(root.localTransform));
    });
    return meshes;
  } else return [];
}
