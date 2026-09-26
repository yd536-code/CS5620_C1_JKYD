import {AGroupNodeModel2D, ANodeModel2D, ASerializable, BezierTween, V2, Vec2} from "../../../../anigraph";
import {AudioManager} from "../../../../anigraph/audio/AAudioManager";

/** The path of the sound played when an exhibit is clicked. It is also the name the sound is stored under. */
const POP_SOUND = "./sounds/Pop1.wav";

/**
 * # One exhibit in the gallery
 *
 * A group node that holds one thing to look at (its `content`) and places it on the gallery's grid. It draws
 * nothing itself.
 *
 * When you click an exhibit it plays a pop and pulses: it grows and shrinks back over a fraction of a second. The
 * pulse scales this group node, and because the content is a child of the group, the content scales with it. That is
 * the scene graph at work: a child's transform is relative to its parent's.
 *
 * The pulse is an animation the node runs itself, with its own `addTimedAction`: `onPicked()` starts a timed action
 * that sets the exhibit's scale every frame for the length of the pulse, eased by a `BezierTween`.
 */
@ASerializable("ExhibitModel")
export class ExhibitModel extends AGroupNodeModel2D{
    /** The name of the pulse's timed action, used to cancel a pulse that's still running when a new one starts. */
    static PulseHandle = "Pulse";

    /** How long a pulse lasts, in seconds. */
    static PulseDuration = 0.8;

    /** How much bigger the exhibit gets at the peak of a pulse (0.3 = 30% bigger). */
    static PulseAmount = 0.3;

    /** Eases the pulse: it starts fast and settles gently. `eval(x)` maps progress in [0,1] to eased progress. */
    static PulseTween = new BezierTween(0.2, 0.8, 0.4, 1.0);

    /** The node this exhibit shows. */
    content?: ANodeModel2D;

    /**
     * Loads the sound that clicking an exhibit plays. The scene model calls this from its `PreloadAssets`.
     */
    static async PreloadAssets(){
        await AudioManager.LoadSound(POP_SOUND, POP_SOUND);
    }

    /**
     * @param content the node to show. It becomes a child of this exhibit.
     * @param position where to put the exhibit, in world coordinates
     */
    constructor(content?: ANodeModel2D, position?: Vec2){
        super();
        if(content){
            this.content = content;
            this.addChild(content);
        }
        if(position){
            this.prsa.position = position.clone();
        }
    }

    /**
     * Called when the user clicks this exhibit (or its content). Plays a pop and starts a pulse.
     *
     * `addTimedAction(callback, duration, onDone, tween, handle)` calls `callback(progress)` every frame for `duration`
     * seconds, with `progress` going from 0 to 1, reshaped by the tween. The last call is always with progress
     * exactly 1, so the pulse ends at scale 1. A click during a pulse restarts it: the running pulse is canceled
     * first, because `addTimedAction` doesn't start an action while another with the same handle is running.
     */
    onPicked(){
        AudioManager.playSound(POP_SOUND);
        if(this.hasSubscription(ExhibitModel.PulseHandle)){
            this.unsubscribe(ExhibitModel.PulseHandle);
        }
        this.addTimedAction(
            (progress: number)=>this.setPulse(progress),
            ExhibitModel.PulseDuration,
            undefined,
            ExhibitModel.PulseTween,
            ExhibitModel.PulseHandle
        );
    }

    /**
     * The per-frame update. The exhibit itself has nothing to update (its pulse is a timed action), so it just lets
     * its content update itself.
     * @param t the current time, in seconds
     */
    timeUpdate(t: number, ...args: any[]){
        super.timeUpdate(t, ...args);
        this.content?.timeUpdate(t, ...args);
    }

    /**
     * Sets this exhibit's scale for a point in its pulse.
     * @param progress how far through the pulse, from 0 to 1 (already eased)
     */
    setPulse(progress: number){
        // sin(pi * x) rises from 0 to 1 and falls back to 0 as x goes from 0 to 1.
        const scale = 1 + ExhibitModel.PulseAmount*Math.sin(Math.PI*progress);
        this.prsa.scale = V2(scale, scale);
        this.signalTransformUpdate();
    }
}
