import {AGroupNodeModel2D, ASerializable, Color, V2} from "../../../../anigraph";
import {PolygonModel2D} from "../../../../anigraph/starter/nodes/polygon2D";
import {TutFactories} from "./TutFactories";

@ASerializable("TutGroupModel")
export class TutGroupModel extends AGroupNodeModel2D {
    static Speed = 0.5;
    direction: number;
    squares: PolygonModel2D[] = [];

    constructor(direction: number = 1, color: Color = Color.FromString("#29a36a")) {
        super();
        this.direction = direction;
        for (const x of [-1, 1]) {
            const square = TutFactories.Square(0.7, color);
            square.prsa.position = V2(x, 0);
            this.addChild(square);
            this.squares.push(square);
        }
    }

    timeUpdate(t: number, ...args: any[]){
        super.timeUpdate(t, ...args);
        this.prsa.rotation = this.direction * TutGroupModel.Speed * t;
    }

    recolor() {
        const color = Color.Random();
        for (const square of this.squares)
            square.material.setValue("color", color.asThreeJS());
    }
}