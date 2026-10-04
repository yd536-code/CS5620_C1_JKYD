import {
    Polygon2D,
    Color,
    V2,
    AssetManager,
    AMeshModel2D,
    VertexArray2D,
    ATexture,
    SVGLAsset, ASVGLModel2D
} from "../../../../anigraph";
import {PolygonModel2D} from "../../../../anigraph/starter/nodes/polygon2D";
import {TexturedQuad} from "../../ShapesAndMaterials/nodes";

export class TutFactories {
    // Polygon w/ Clockwise vertices
    static RegularPolygon(nSides: number, radius: number, color: Color,
                          startAngle: number = Math.PI/2) : Polygon2D {
        const polygon = Polygon2D.CreateForRendering(true);
        for (let i = 0; i < nSides; ++i) {  // Loop through all sides
            const theta = startAngle - i * 2 * Math.PI / nSides;
            polygon.addVertex(V2(Math.cos(theta), Math.sin(theta)).times(radius), color);
        }
        return polygon;
    }

    static FlatPolygon(verts: Polygon2D, color: Color) : PolygonModel2D {
        const polygon = new PolygonModel2D(verts);
        polygon.setMaterial(AssetManager.CreateBasicMaterial(color));
        return polygon;
    }
    static Square(size: number, color: Color): PolygonModel2D {
        return TutFactories.FlatPolygon(
            TutFactories.RegularPolygon(4, size*Math.SQRT1_2, color, Math.PI/4)
            , color
        );
    }
    static Triangle(): PolygonModel2D {
        const color = Color.FromString("#e4572e");
        return TutFactories.FlatPolygon(
            TutFactories.RegularPolygon(3, 0.9, color), color
        );
    }
    static Marker(): PolygonModel2D {
        const color = Color.FromString("#111111");
        return TutFactories.FlatPolygon(
            TutFactories.RegularPolygon(8, 0.09, color), color
        );
    }
    static Fan(): AMeshModel2D {
        const positions = [V2(0,0)];
        const colors = [Color.White()];
        for (let i = 0; i < 6; ++i) {
            const theta = -i * 2*Math.PI / 6;
            positions.push(V2(Math.cos(theta), Math.sin(theta)).times(1.2));
            colors.push(Color.FromString("#ff0000").GetSpun(i * 2*Math.PI / 6));
        }
        const verts = VertexArray2D.FromLists(positions, colors);
        for (let i = 0; i <= 6; ++i)
            verts.addTriangleIndices([0, i, (i === 6) ? 1 : i+1]);
        const mesh = new AMeshModel2D(verts);
        mesh.setMaterial(AssetManager.Create2DRGBAMaterial());
        return mesh;
    }
    static Fan1(): PolygonModel2D {
        const positions = [V2(0,0)];
        const colors = [Color.White()];

        const polygon = Polygon2D.CreateForRendering(true);
        for (let i = 0; i < 6; ++i) {
            const theta = -i * 2*Math.PI / 6;
            polygon.addVertex(V2(Math.cos(theta), Math.sin(theta)).times(1.2));
        }
        const polygonModel = new PolygonModel2D(polygon);
        polygonModel.setMaterial(AssetManager.CreateBasicMaterial(Color.FromString("#ff0000")));
        return polygonModel;
    }

    static ImagePath = "./images/LabCatSitsSquareSmall.jpg";
    static CreateQuad(height: number = 3): AMeshModel2D {
        const texture: ATexture = AssetManager.getTexture(TexturedQuad.ImagePath);
        const quad = new AMeshModel2D(VertexArray2D.SquareXYUV());
        quad.setMaterial(AssetManager.Create2DTextureMaterial(texture));
        const aspect = (texture.height > 0)
                ? texture.width / texture.height : 1;
        quad.prsa.scale = V2(height*aspect, height);
        return quad;
    }

    static LabCatSVG: SVGLAsset;
    static SVG(): ASVGLModel2D {
        const svg = new ASVGLModel2D(TutFactories.LabCatSVG);
        svg.prsa.scale = V2(1.5,1.5);
        return svg;
    }

    static async PreloadAssets() {
        await AssetManager.loadTexture(TutFactories.ImagePath, TutFactories.ImagePath);
        TutFactories.LabCatSVG = await SVGLAsset.Load("./images/svg/LabCatVectorHead.svg");
    }
}