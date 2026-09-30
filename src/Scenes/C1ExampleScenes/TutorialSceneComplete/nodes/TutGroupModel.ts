import {AGroupNodeModel2D, ASerializable, Color, V2} from "../../../../anigraph";
import {PolygonModel2D} from "../../../../anigraph/starter/nodes/polygon2D";
import {TutFactories} from "./TutFactories";

/**
 * Step 2.2: a group node. It draws nothing itself; it holds two squares and turns them around its own origin.
 * The group's rotation does the turning, and the squares' own positions only say how far out they sit.
 *
 * Because this is a subclass of `AGroupNodeModel2D` with its own `@ASerializable` label, the controller needs its
 * own spec for it (`addModelViewSpec(TutGroupModel, AGroupNodeView)`); the built-in group spec doesn't apply.
 */
@ASerializable("TutGroupModel")
export class TutGroupModel extends AGroupNodeModel2D{
    /** How fast groups turn, in radians per second. */
    static Speed = 0.5;

    /** 1 to turn counterclockwise, -1 for clockwise. */
    direction: number;

    /** The squares this group was built with. A square that is reparented (step 2.5) stays in this list. */
    squares: PolygonModel2D[] = [];

    /**
     * @param direction 1 to turn counterclockwise, -1 for clockwise
     * @param color the squares' color
     */
    constructor(direction: number = 1, color: Color = Color.FromString("#29a36a")){
        super();
        this.direction = direction;
        for(const x of [-1, 1]){
            const square = TutFactories.Square(0.7, color);
            square.prsa.position = V2(x, 0);
            this.addChild(square);
            this.squares.push(square);
        }
    }

    /**
     * Step 3.3: gives this group's squares a random new color. The scene model subscribes this to the shape's Ping
     * event; the group itself never refers to the shape.
     */
    recolor(){
        const color = Color.Random();
        for(const square of this.squares){
            square.material.setValue("color", color.asThreeJS());
        }
    }

    /**
     * Turns as a function of time (step 2.2).
     * @param t the current time, in seconds
     * @param args anything else the caller passes
     */
    timeUpdate(t: number, ...args: any[]){
        super.timeUpdate(t, ...args);
        this.prsa.rotation = this.direction*TutGroupModel.Speed*t;
    }
}
