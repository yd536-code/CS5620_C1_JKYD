import {ASceneModel, Color, GetAppState, V2} from "../../anigraph";
import {PolygonModel2D} from "../../anigraph/starter/nodes/polygon2D";
import {AssetManager} from "../../anigraph/fileio/AAssetManager";


export default class ExampleFuncs {

    static createSimpleRGBTriangleNode(sceneModel: ASceneModel) {
        // let unitquad = new UnitQuadModel3D(AssetManager.materials.CreateMaterial(AssetManager.DEFAULT_MATERIALS.RGBA_SHADER, new Color(0.0,1.0,0.0)));
        let polygon = new PolygonModel2D();
        polygon.verts.initColorAttribute();
        let material = AssetManager.materials.createRGBAShaderMaterial();
        polygon.setMaterial(material);
        polygon.verts.addVertex(V2(), Color.FromRGBA(1.0, 0.0, 0.0, 1.0));
        polygon.verts.addVertex(V2(1, 1), Color.FromRGBA(0.0, 1.0, 0.0, 1.0));
        polygon.verts.addVertex(V2(1, 0), Color.FromRGBA(0.0, 0.0, 1.0, 1.0));
        return polygon
    }

    static addSimpleTriangle(sceneModel: ASceneModel) {
        let polygon = ExampleFuncs.createSimpleRGBTriangleNode(sceneModel);
        sceneModel.addNode(polygon);
        sceneModel.signalComponentUpdate();
        return polygon;
    }



}
