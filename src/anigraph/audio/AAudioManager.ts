import {Howl, HowlErrorCallback, HowlOptions} from 'howler';
import {AObject, ALabel} from "../base";

/**
 * Loads and plays sounds by name, using the [howler](https://howlerjs.com/) library. Use the shared instance,
 * {@link AudioManager}.
 * @internal
 */
@ALabel("AAudioManager")
export class AAudioManager extends AObject{
    _sounds!:{[name:string]:Howl}
    _initSounds(){
        this._sounds = {};
    }

    /** The loaded sounds, keyed by name. */
    get sounds(){
        return this._sounds;
    }

    constructor() {
        super();
        this._initSounds();
    }

    /**
     * Returns the sound loaded under `name` (`undefined` if there is none).
     * @param name
     */
    getSound(name:string):Howl{
        return this.sounds[name];
    }

    /** Plays the sound loaded under `name`. Throws if no sound has that name. */
    playSound(name:string):void{
        this.getSound(name).play();
    }

    /**
     * Loads a sound and stores it under `name` (replacing any sound already stored there).
     * Returns a promise that resolves when the sound has loaded and rejects if loading fails, so you can `await` it.
     * @param name name for tracking the sound
     * @param path path of the sound file. If not provided, assumed to be the same as name.
     * @param howlOptions extra Howl options, merged over the defaults (volume 1, preload)
     * @returns a promise for the sound finishing loading
     */
    LoadSound(name:string, path?:string, howlOptions?:HowlOptions){
        path = path? path:name;
        howlOptions = howlOptions? howlOptions : {
            src: path
        }
        return new Promise((resolve, reject) => {
            howlOptions = Object.assign(
                {
                    src: path,
                    volume: 1.0,
                    preload: true,
                    onplayerror: (soundID:number, error:HowlErrorCallback | undefined) =>
                        console.error("Can't play an audio file: " + error),
                    onloaderror: (soundID:number, error:HowlErrorCallback | undefined) =>
                        console.error('Error while loading an audio file: ' + error),
                },
                howlOptions,
                {
                    onload: resolve,
                    onloaderror: (soundId: number, error?: string) => reject(error),
                }
            );
            this._sounds[name] = new Howl(
                howlOptions,
            );
        });
    }
}

/** The shared audio manager. Load sounds with `AudioManager.LoadSound(name, path)` and play them with `playSound(name)`. */
export const AudioManager = new AAudioManager();


