import {AGroupNodeModel2D, AssetManager, ASerializable, Color, Polygon2D, V2} from "../../../../anigraph";
import {PolygonModel2D} from "../../../../anigraph/starter/nodes/polygon2D";
import {MoonModel} from "./MoonModel";

/**
 * # A rotating, scaled group with moons in it
 *
 * A group node with a planet at its center and a ring of moons around it, all as children. The group turns every
 * frame, which carries the moons around. It is also scaled up, so its children are drawn bigger than their own
 * size: a moon inside the orbit looks bigger than the same moon outside it.
 *
 * A group node draws nothing itself; the controller pairs it with `AGroupNodeView`.
 */
@ASerializable("ADOrbitModel")
export class OrbitModel extends AGroupNodeModel2D{
    /** How fast the group turns, in radians per second. */
    static Speed = 0.4;

    /** How much the group scales its children. */
    static Scale = 1.5;

    /** How far the moons start from the center, in the group's own coordinates. */
    static MoonDistance = 4;

    /** The planet at the center. */
    planet: PolygonModel2D;

    /**
     * Creates the planet and five moons as children of this group.
     */
    constructor(){
        super();
        this.prsa.scale = OrbitModel.Scale;

        // The planet: a larger 12-sided polygon at the group's center, listed clockwise.
        const planetVerts = Polygon2D.CreateForRendering(false);
        for(let i=0;i<12;i++){
            const theta = -i*2*Math.PI/12;
            planetVerts.addVertex(V2(Math.cos(theta), Math.sin(theta)).times(1.5));
        }
        this.planet = new PolygonModel2D(planetVerts);
        this.planet.setMaterial(AssetManager.CreateBasicMaterial(Color.FromString("#f2a900")));
        this.addChild(this.planet);

        const nMoons = 5;
        const base = Color.FromString("#3a7bd5");
        for(let i=0;i<nMoons;i++){
            const theta = i*2*Math.PI/nMoons;
            const position = V2(Math.cos(theta), Math.sin(theta)).times(OrbitModel.MoonDistance);
            this.addChild(new MoonModel(position, 3 + i, base.GetSpun(i*2*Math.PI/nMoons)));
        }
    }

    /**
     * The per-frame update: turn. The children move because they are children.
     * @param t the current time, in seconds
     */
    timeUpdate(t: number, ...args: any[]){
        super.timeUpdate(t, ...args);
        this.prsa.rotation = OrbitModel.Speed*t;
    }
}
