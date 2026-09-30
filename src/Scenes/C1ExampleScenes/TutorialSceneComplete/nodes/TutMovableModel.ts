import {ASerializable, AssetManager, Color, V2, Vec2} from "../../../../anigraph";
import {PolygonModel2D} from "../../../../anigraph/starter/nodes/polygon2D";
import {TutFactories} from "./TutFactories";

/**
 * Steps 8.1 and 8.2: a small square that moves with the W, A, S and D keys.
 *
 * Step 8.1 moves it one fixed step on each key-down event, which stutters, because key events follow the
 * operating system's key repeat rather than the frame rate. Step 8.2 (below) replaces that with held-key motion:
 * key events only record which way to go, and `timeUpdate` moves the square by `velocity * dt` every frame.
 */
@ASerializable("TutMovableModel")
export class TutMovableModel extends PolygonModel2D{
    /** How fast the square moves, in world units per second. */
    static Speed = 4;

    /** The current velocity, set by the keys. */
    velocity: Vec2 = V2(0, 0);

    /** The time of the last `timeUpdate`, for computing `dt`. */
    lastTime?: number;

    constructor(){
        super();
        const color = Color.FromString("#d62f5c");
        this.setVerts(TutFactories.RegularPolygon(4, 0.4, color, Math.PI/4));
        this.setMaterial(AssetManager.CreateBasicMaterial(color));
    }

    /**
     * Key down sets the velocity in that key's direction. Lowercase, so Shift or Caps Lock doesn't break the keys.
     * @param key the key's name (`KeyboardEvent.key`)
     */
    onKeyDown(key: string){
        const speed = TutMovableModel.Speed;
        switch(key.toLowerCase()){
            case "w": this.velocity.y = speed; break;
            case "s": this.velocity.y = -speed; break;
            case "d": this.velocity.x = speed; break;
            case "a": this.velocity.x = -speed; break;
        }
    }

    /**
     * Key up stops only the motion that still points in the released key's direction, so holding d, pressing a,
     * then releasing d keeps the square moving left.
     * @param key the key's name (`KeyboardEvent.key`)
     */
    onKeyUp(key: string){
        switch(key.toLowerCase()){
            case "w": this.velocity.y = Math.min(0, this.velocity.y); break;
            case "s": this.velocity.y = Math.max(0, this.velocity.y); break;
            case "d": this.velocity.x = Math.min(0, this.velocity.x); break;
            case "a": this.velocity.x = Math.max(0, this.velocity.x); break;
        }
    }

    /**
     * Moves by `velocity * dt`.
     * @param t the current time, in seconds
     * @param args anything else the caller passes
     */
    timeUpdate(t: number, ...args: any[]){
        super.timeUpdate(t, ...args);
        const dt = (this.lastTime === undefined) ? 0 : Math.min(t - this.lastTime, 0.05);
        this.lastTime = t;
        if(this.velocity.L2() > 0){
            this.prsa.position = this.prsa.position.plus(this.velocity.times(dt));
        }
    }
}
