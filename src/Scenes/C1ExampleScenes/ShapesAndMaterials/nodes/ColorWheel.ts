import {AMeshModel2D, AssetManager, Color, Polygon2D, V2, Vec2, VertexArray2D} from "../../../../anigraph";
import {PolygonModel2D} from "../../../../anigraph/starter/nodes/polygon2D";

/**
 * # Polygons vs. triangle meshes
 *
 * Two ways to draw the same colorful star, built from the same vertex positions and colors:
 * - `ColorWheel.CreatePolygon()` lists the star's outline and lets three.js split the inside into triangles
 *   ("tessellate" it). You don't choose the triangles, so colors blend across them in ways you don't control.
 * - `ColorWheel.CreateMesh()` adds a white vertex in the center and says exactly which triangles to draw: a fan
 *   from the center to each pair of neighboring outline vertices. Colors blend smoothly out from the white center.
 *
 * Both return plain engine node models (`PolygonModel2D`, drawn by `PolygonView2D`, and `AMeshModel2D`, drawn by
 * `AMeshView2D`). You don't need your own class when an engine class already does the job.
 */
export class ColorWheel{
    /** Number of points on the star. */
    static NPoints = 8;

    /** Distance from the center to the star's points, and to the notches between them. */
    static OuterRadius = 1.6;
    static InnerRadius = 0.8;

    /** The color of the first point. The other points' colors go around the color wheel from here. */
    static BaseColor = Color.FromString("#ff3355");

    /**
     * The star's outline: alternating outer points and inner notches, going **clockwise** (polygons drawn by
     * `APolygonGraphic2D` must list their vertices clockwise, or per-vertex colors come out scrambled).
     * @returns the positions and colors, as two arrays of the same length
     */
    static Outline(): {positions: Vec2[], colors: Color[]}{
        const positions: Vec2[] = [];
        const colors: Color[] = [];
        const nVerts = 2*ColorWheel.NPoints;
        for(let i=0;i<nVerts;i++){
            // A negative angle step goes clockwise.
            const theta = -i*2*Math.PI/nVerts;
            const radius = (i%2 === 0) ? ColorWheel.OuterRadius : ColorWheel.InnerRadius;
            positions.push(V2(Math.cos(theta), Math.sin(theta)).times(radius));
            // GetSpun rotates a color's hue around the color wheel by an angle, in radians.
            colors.push(ColorWheel.BaseColor.GetSpun(i*2*Math.PI/nVerts));
        }
        return {positions, colors};
    }

    /**
     * The star as a polygon: just its outline. three.js decides how to fill it in.
     */
    static CreatePolygon(): PolygonModel2D{
        const outline = ColorWheel.Outline();
        const polygon = new PolygonModel2D(Polygon2D.FromLists(outline.positions, outline.colors));
        // The RGBA material colors each pixel by blending the colors of the vertices of its triangle.
        polygon.setMaterial(AssetManager.Create2DRGBAMaterial());
        return polygon;
    }

    /**
     * The star as a triangle mesh: a white center vertex (index 0), the outline vertices (indices 1 to n), and one
     * triangle from the center to each edge of the outline.
     */
    static CreateMesh(): AMeshModel2D{
        const outline = ColorWheel.Outline();
        const verts = VertexArray2D.FromLists(
            [V2(0, 0), ...outline.positions],
            [Color.White(), ...outline.colors]
        );
        const n = outline.positions.length;
        for(let i=1;i<=n;i++){
            // The triangle (center, vertex i, the next vertex). The last one wraps around to vertex 1.
            const next = (i === n) ? 1 : i+1;
            verts.addTriangleIndices([0, i, next]);
        }
        const mesh = new AMeshModel2D(verts);
        mesh.setMaterial(AssetManager.Create2DRGBAMaterial());
        return mesh;
    }
}
