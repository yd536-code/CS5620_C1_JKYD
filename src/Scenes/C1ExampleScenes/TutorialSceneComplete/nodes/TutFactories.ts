import {
    AMeshModel2D,
    AssetManager,
    ASVGLModel2D,
    ATexture,
    Color,
    Polygon2D,
    SVGLAsset,
    V2,
    VertexArray2D
} from "../../../../anigraph";
import {PolygonModel2D} from "../../../../anigraph/starter/nodes/polygon2D";

/**
 * Small functions that build plain engine nodes (`PolygonModel2D`, `AMeshModel2D`, `ASVGLModel2D`) for the tutorial
 * scene. None of these nodes has behavior of its own, so none needs a class of its own: see "You don't always need
 * your own class" in the Drawing page of the docs.
 */
export class TutFactories{
    /** The image drawn by {@link TexturedQuad} (step 6.4). Paths are relative to `public/`. */
    static ImagePath = "./images/LabCatSitsSquareSmall.jpg";

    /** The SVG drawn by {@link SVG} (step 6.6). */
    static SVGPath = "./images/svg/LabCatVectorHead.svg";

    /** The loaded SVG file. Set by {@link PreloadAssets}. */
    static LabCatSVG: SVGLAsset;

    /**
     * Loads the files these factories need: the texture (step 6.4) and the SVG (step 6.6). The scene model calls
     * this from its own `PreloadAssets`, so everything is loaded before `initScene` builds the nodes.
     */
    static async PreloadAssets(){
        await AssetManager.loadTexture(TutFactories.ImagePath, TutFactories.ImagePath);
        TutFactories.LabCatSVG = await SVGLAsset.Load(TutFactories.SVGPath);
    }

    /**
     * A regular polygon, with its vertices listed **clockwise** (a negative angle step), as polygons must be.
     * @param nSides number of sides
     * @param radius distance from the center to each vertex
     * @param color the color of every vertex
     * @param startAngle angle of the first vertex, in radians
     */
    static RegularPolygon(nSides: number, radius: number, color: Color, startAngle: number = Math.PI/2): Polygon2D{
        const polygon = Polygon2D.CreateForRendering(true);
        for(let i=0;i<nSides;i++){
            const theta = startAngle - i*2*Math.PI/nSides;
            polygon.addVertex(V2(Math.cos(theta), Math.sin(theta)).times(radius), color);
        }
        return polygon;
    }

    /**
     * A flat-colored polygon node with a basic (one-color) material.
     * @param verts the polygon's outline
     * @param color the material's color
     */
    static FlatPolygon(verts: Polygon2D, color: Color): PolygonModel2D{
        const polygon = new PolygonModel2D(verts);
        polygon.setMaterial(AssetManager.CreateBasicMaterial(color));
        return polygon;
    }

    /**
     * Step 2.2: a flat-colored square, used by the group nodes.
     * @param size the length of each side
     * @param color its color
     */
    static Square(size: number, color: Color): PolygonModel2D{
        return TutFactories.FlatPolygon(TutFactories.RegularPolygon(4, size*Math.SQRT1_2, color, Math.PI/4), color);
    }

    /** Step 4.2: a triangle, placed in the scene with a `Mat3`. */
    static Triangle(): PolygonModel2D{
        const color = Color.FromString("#e4572e");
        return TutFactories.FlatPolygon(TutFactories.RegularPolygon(3, 0.9, color), color);
    }

    /** Step 4.3: a small dark octagon, placed at another node's world position every frame. */
    static Marker(): PolygonModel2D{
        const color = Color.FromString("#111111");
        return TutFactories.FlatPolygon(TutFactories.RegularPolygon(8, 0.09, color), color);
    }

    /**
     * Step 6.2: a triangle mesh. A white center vertex (index 0) and six rim vertices, colored red, yellow, green,
     * cyan, blue and magenta, with one triangle from the center to each edge of the rim. Colors blend across each
     * triangle, and you chose the triangles, unlike a polygon, which three.js splits into triangles itself.
     */
    static Fan(): AMeshModel2D{
        const nRim = 6;
        const radius = 1.2;
        const positions = [V2(0, 0)];
        const colors = [Color.White()];
        for(let i=0;i<nRim;i++){
            const theta = -i*2*Math.PI/nRim;
            positions.push(V2(Math.cos(theta), Math.sin(theta)).times(radius));
            // GetSpun rotates a color's hue around the color wheel by an angle, in radians.
            colors.push(Color.FromString("#ff0000").GetSpun(i*2*Math.PI/nRim));
        }
        const verts = VertexArray2D.FromLists(positions, colors);
        for(let i=1;i<=nRim;i++){
            const next = (i === nRim) ? 1 : i+1;
            verts.addTriangleIndices([0, i, next]);
        }
        const mesh = new AMeshModel2D(verts);
        mesh.setMaterial(AssetManager.Create2DRGBAMaterial());
        return mesh;
    }

    /**
     * Step 6.4: a square mesh with texture coordinates, drawn with a textured material, and scaled to the image's
     * aspect ratio so it doesn't look squished.
     * @param height the quad's height, in world units
     */
    static TexturedQuad(height: number = 2): AMeshModel2D{
        const texture: ATexture = AssetManager.getTexture(TutFactories.ImagePath);
        const quad = new AMeshModel2D(VertexArray2D.SquareXYUV());
        quad.setMaterial(AssetManager.Create2DTextureMaterial(texture));
        const aspect = (texture.height > 0) ? texture.width/texture.height : 1;
        quad.prsa.scale = V2(height*aspect, height);
        return quad;
    }

    /** Step 6.6: the Lab Cat SVG, as a plain `ASVGLModel2D`. */
    static SVG(): ASVGLModel2D{
        const svg = new ASVGLModel2D(TutFactories.LabCatSVG);
        svg.prsa.scale = V2(1.5, 1.5);
        return svg;
    }
}
