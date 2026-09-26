import {AMeshModel2D, AssetManager, ATexture, V2, VertexArray2D} from "../../../../anigraph";

/**
 * # A textured quad
 *
 * An image drawn on a square. `VertexArray2D.SquareXYUV()` is a unit square (from -0.5 to 0.5 in x and y) whose
 * vertices also have texture coordinates ("UVs"), which say which point of the image each vertex shows. The textured
 * material then paints the image across the square.
 *
 * The image fills the whole square whatever its shape, so a non-square image looks squished unless you scale the
 * square to the image's aspect ratio (width / height), as `Create` does.
 */
export class TexturedQuad{
    /** The path of the image, which is also the name it is stored under in the AssetManager. */
    static ImagePath = "./images/LabCatSitsSquareSmall.jpg";

    /**
     * Loads the image. The scene model calls this from its `PreloadAssets`, before the scene is built.
     */
    static async PreloadAssets(){
        await AssetManager.loadTexture(TexturedQuad.ImagePath, TexturedQuad.ImagePath);
    }

    /**
     * Creates the quad, scaled to the image's aspect ratio.
     * @param height the quad's height, in world units
     */
    static Create(height: number = 3): AMeshModel2D{
        const texture: ATexture = AssetManager.getTexture(TexturedQuad.ImagePath);
        const quad = new AMeshModel2D(VertexArray2D.SquareXYUV());
        quad.setMaterial(AssetManager.Create2DTextureMaterial(texture));
        const aspect = (texture.height > 0) ? texture.width/texture.height : 1;
        quad.prsa.scale = V2(height*aspect, height);
        return quad;
    }
}
