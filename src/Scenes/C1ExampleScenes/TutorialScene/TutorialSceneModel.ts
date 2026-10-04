import {ASceneModel2D} from "../../../anigraph/starter/Scene2D/ASceneModel2D";
import {
    AppState,
    V2,
    Color,
    ANodeModel2D,
    Mat3,
    V3,
    AssetManager,
    AMeshModel2D,
    ASVGLModel2D,
    LineModel2D
} from "../../../anigraph";
import {TutFactories, TutShapeModel, TutGroupModel, TutPivotModel, TutLineModel} from "./nodes";
import {PolygonModel2D} from "../../../anigraph/starter/nodes/polygon2D";

/**
 * The tutorial scene's model. It starts out empty: each method below is where a step of the C1 tutorial adds code.
 * The scene model builds the scene out of node models, passes time and input on to them, and handles anything that
 * involves several nodes at once. Anything about a single node goes in that node's model class, in `./nodes`.
 */
export class TutorialSceneModel extends ASceneModel2D{

    static BackgroundOptions = { Plain: "plain", Image: "image"}
    static BackgroundTextureName = "TutorialBackground";

    /**
     * 1st: adds control-panel controls. Runs before assets load and before the panel is first drawn.
     * Step 3.1 of the tutorial adds the first control here.
     * @param appState the app state, which holds the value of every control
     */
    traveler!: PolygonModel2D;  // in initScene: this.traveler = this.groupA.squares[0];
    initAppState(appState: AppState){
        super.initAppState(appState);
        appState.addButton("MoveSquare", ()=>this.moveTraveler());
        TutShapeModel.SetAppState(appState);    // Control keys
        appState.addButton("Ping", ()=>this.shape?.ping()); // node not existed yet. Check when clicked

        appState.setSelectionControl("Background", TutorialSceneModel.BackgroundOptions.Plain,
            Object.values(TutorialSceneModel.BackgroundOptions));

        TutLineModel.SetAppState(appState);
    }
    moveTraveler() {
        const newParent = (this.traveler.parent === this.groupA)
                        ? this.modelGraph : this.groupA;
        const oldWorld = this.traveler.getWorldTransform();
        this.traveler.reparent(newParent);
        const newParentWorld= (newParent instanceof ANodeModel2D)
                        ? newParent.getWorldTransform() : Mat3.Identity();
        this.traveler.setTransform(newParentWorld.getInverse().times(oldWorld));
    }
    /**
     * 2nd: loads files (images, SVGs, sounds). Always call `super` first: it loads the standard materials.
     * Step 6.1 of the tutorial loads the first file here.
     */
    async PreloadAssets(): Promise<void> {
        await super.PreloadAssets();
        await AssetManager.loadTexture("./images/SpaceBG.jpg", TutorialSceneModel.BackgroundTextureName);
        await TutFactories.PreloadAssets();
    }

    /**
     * 3rd: builds the scene, adding each top-level node with `this.addNode(node)`.
     * Step 1.1 of the tutorial adds your first node here.
     */
    shape!:  TutShapeModel;
    groupA!: TutGroupModel;
    nested!: PolygonModel2D;
    groupB!: TutGroupModel;
    pivot!:  TutPivotModel;
    triangle!: PolygonModel2D;
    marker!: PolygonModel2D;
    fan!:    AMeshModel2D;
    quad!:   AMeshModel2D;
    svg!:    ASVGLModel2D;
    line!:   LineModel2D;
    async initScene(){
        this.shape = new TutShapeModel();
        this.addNode(this.shape);

        this.groupA = new TutGroupModel();
        this.groupA.prsa.position = V2(5,2);
        this.addNode(this.groupA);

        this.groupA.subscribe(this.shape.addPingListener(()=>this.groupA.recolor()));

        this.traveler = this.groupA.squares[0];

        this.nested = TutFactories.Square(0.35, Color.FromString("#1b5e20"));
        this.nested.prsa.position = V2(0.8, 0);
        this.groupA.squares[1].addChild(this.nested);

        this.nested.addTag("highlight");
        for (const node of this.getNodesWithTag("highlight"))
            node.material.setValue("color", Color.White().asThreeJS())

        this.groupB = new TutGroupModel(-1, Color.FromString("#2e86c1"));
        this.groupB.prsa.position = V2(5,-2);
        this.addNode(this.groupB);

        this.pivot = new TutPivotModel();
        this.pivot.prsa.position = V2(-5, 3);
        // this.pivot.prsa.scale = V2(2, 1);
        this.addNode(this.pivot);

        this.triangle = TutFactories.Triangle();
        this.triangle.setTransform(
            Mat3.Translation2D(V2(-5,0)).times(Mat3.Rotation(Math.PI/6))
        );
        this.triangle.prsa.scale = V2(1.2, 1.2);    // prsa works evern after transform
        this.addNode(this.triangle);

        this.marker = TutFactories.Marker();
        this.marker.zValue = 0.2;
        this.addNode(this.marker);

        this.fan = TutFactories.Fan();
        this.fan.prsa.position = V2(-6.5, -4);
        this.addNode(this.fan);

        this.quad = TutFactories.CreateQuad();
        this.quad.prsa.position = V2(-3, -4);
        this.addNode(this.quad);

        this.svg = TutFactories.SVG();
        this.svg.prsa.position = V2(-2.5, -3.5);
        this.addNode(this.svg);

        this.line = new TutLineModel();
        this.line.prsa.position = V2(6, -5.5);
        this.addNode(this.line);
    }

    /**
     * Called once per frame by the scene controller. Node `timeUpdate`s are not called automatically: call each one
     * from here. Step 2.1 of the tutorial adds the first call.
     * @param t the current time, in seconds
     */
    timeUpdate(t: number){
        this.shape.timeUpdate(t);
        for (const group of this.getNodesOfType(TutGroupModel))
            group.timeUpdate(t);
        this.marker.prsa.position = this.nested.getWorldTransform().times(V2(0,0));

        this.pivot.timeUpdate(t);
    }
}
