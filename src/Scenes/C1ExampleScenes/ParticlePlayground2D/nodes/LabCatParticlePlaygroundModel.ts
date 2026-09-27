import {
    AGroupNodeModel2D,
    AppState,
    ASerializable,
    AssetManager,
    ASVGLModel2D,
    Color,
    GetAppState,
    SVGLAsset,
    V2,
    Vec2
} from "../../../../anigraph";
import {PlaygroundParticle} from "./PlaygroundParticle";
import {PlaygroundParticleSystemModel} from "./PlaygroundParticleSystemModel";

/** The most particles that can be visible at once. */
const N_PARTICLES = 200;

/** The name the particle texture is stored under in the AssetManager. */
const PARTICLE_TEXTURE_NAME = "GradientParticle";

/**
 * With the motionState checkbox off, each w/a/s/d press moves Lab Cat as far as it would travel in this many seconds
 * of held-key motion at the current move speed.
 */
const DIRECT_MOVE_STEP_SECONDS = 0.1;

/**
 * # The particle playground
 *
 * This one model holds everything the playground does:
 * - `emitter`: Lab Cat, which you move with the WASD keys. Particles are emitted from Lab Cat's position.
 * - `particleSystem`: the particles themselves.
 * - the per-frame update (`timeUpdate`), which moves Lab Cat (with the motionState checkbox on) and then calls
 *   `updateParticles`.
 * - the keyboard handlers (`onKeyDown`/`onKeyUp`), which the scene controller forwards key presses to.
 * - the control-panel sliders (`SetAppState`).
 *
 * **You write `fire()` and `updateParticles()`.** They ship as minimal versions that show how the pieces connect.
 *
 * ## How a particle gets emitted
 * 1. Pressing `x` calls `fire()`, which marks a particle by setting its `t0` to -1.
 * 2. On the next frame, `updateParticles()` sees `t0 === -1` and calls `emit()` on that particle.
 * 3. `emit()` places the particle at Lab Cat's position, records the current time in `t0`, and makes it visible.
 *
 * Why not emit straight from `fire()`? Key presses arrive whenever the user presses a key, between frames. Marking
 * the particle and emitting it during the frame update means every particle is emitted at a known frame time.
 *
 * ## Coordinates
 * This model is a group node: it draws nothing itself, and `emitter` and `particleSystem` are its children. Both
 * children therefore share one coordinate system. Moving Lab Cat changes the emitter's transform, not the group's,
 * so particles that were already emitted stay where they are when Lab Cat moves.
 */
@ASerializable("LabCatParticlePlaygroundModel")
export class LabCatParticlePlaygroundModel extends AGroupNodeModel2D{
    /** Names of this model's control-panel entries. Use these with `GetAppState().getState(...)`. */
    static ControlKeys = {
        ParticleColor: "ParticleColor",
        ParticleSize: "ParticleSize",
        MoveSpeed: "LabCatMoveSpeed",
        // On: w/a/s/d start Lab Cat moving and releasing them stops it. Off: each press moves Lab Cat one step.
        MotionState: "motionState",
        // Two general-purpose sliders for your own experiments. Use them for anything you like (a speed, a lifespan,
        // a gravity strength...), and rename them once you know what they control.
        Variable1: "variable1",
        Variable2: "variable2",
    }

    /** The Lab Cat graphic, loaded once by `PreloadAssets()`. */
    static LabCatSVG: SVGLAsset;

    /** Lab Cat. Particles are emitted from its position. */
    emitter: ASVGLModel2D;

    /** The particles. `this.particleSystem.particles` is the array of `PlaygroundParticle`s. */
    particleSystem: PlaygroundParticleSystemModel;

    /** The time of the current frame, set by `timeUpdate()`. `emit()` records it as the particle's `t0`. */
    time: number = 0;

    /** The time of the previous frame, used to compute how much time passed between frames. */
    lastTime?: number;

    /**
     * Lab Cat's velocity, in world units per second. With the motionState checkbox on, the WASD keys set it (see
     * `onKeyDown`/`onKeyUp`), and `timeUpdate` moves Lab Cat by `velocity * dt` every frame. With it off, the keys
     * move Lab Cat directly instead (see `onKeyDown`).
     */
    emitterVelocity: Vec2 = V2(0, 0);

    /**
     * Adds this model's sliders and color picker to the control panel. Add your own controls here, for example a
     * lifespan slider for your particles. `addSliderIfMissing(name, initialValue, min, max, step)` adds a slider.
     *
     * This is static, and the scene model calls it from `initAppState`, because controls should exist before the
     * control panel is first drawn: controls added later (for example, from this model's constructor) may not fit in
     * the panel. `initAppState` runs before the panel is drawn and before any playground exists, so the function
     * can't belong to an instance.
     * @param appState the app state passed to the scene model's `initAppState`
     */
    static SetAppState(appState: AppState){
        appState.addColorControl(LabCatParticlePlaygroundModel.ControlKeys.ParticleColor, Color.FromString("#00ff88"));
        appState.addSliderIfMissing(LabCatParticlePlaygroundModel.ControlKeys.ParticleSize, 0.5, 0.01, 3, 0.01);
        appState.addSliderIfMissing(LabCatParticlePlaygroundModel.ControlKeys.MoveSpeed, 5, 0, 20, 0.1);
        appState.addCheckboxControl(LabCatParticlePlaygroundModel.ControlKeys.MotionState, false);
        appState.addSliderIfMissing(LabCatParticlePlaygroundModel.ControlKeys.Variable1, 0.5, 0, 1, 0.001);
        appState.addSliderIfMissing(LabCatParticlePlaygroundModel.ControlKeys.Variable2, 0.5, 0, 1, 0.001);
    }

    /**
     * Loads the files this model needs: the particle shader, the particle texture and the Lab Cat graphic.
     * The scene model calls this from its own `PreloadAssets()`, before the scene is built.
     */
    static async PreloadAssets(){
        await AssetManager.loadShaderMaterialModel(AssetManager.DEFAULT_MATERIALS.INSTANCED_TEXTURE2D_SHADER);
        await AssetManager.loadShaderMaterialModel(AssetManager.DEFAULT_MATERIALS.PARTICLE_TEXTURE_2D_SHADER);
        await AssetManager.loadTexture("./images/gradientParticle.png", PARTICLE_TEXTURE_NAME);
        LabCatParticlePlaygroundModel.LabCatSVG = await SVGLAsset.Load("./images/svg/LabCatVectorHead.svg");
    }

    /**
     * Creates Lab Cat and the particle system and adds them as children of this model.
     * Call `PreloadAssets()` before constructing one of these.
     *
     * The children can be added here, before this model is in the scene: adding a node to the scene adds its whole
     * subtree, so both children get views when the scene model adds the playground.
     */
    constructor(){
        super();

        // Lab Cat. A positive zValue draws it in front of the particles.
        this.emitter = new ASVGLModel2D(LabCatParticlePlaygroundModel.LabCatSVG);
        this.emitter.zValue = 0.01;

        // The particle system, with N_PARTICLES hidden particles. A negative zValue draws it behind Lab Cat.
        this.particleSystem = new PlaygroundParticleSystemModel();
        this.particleSystem.initParticles(N_PARTICLES);
        this.particleSystem.zValue = -0.01;

        // The particle material draws each particle as the particle texture multiplied by the particle's color.
        // "opacityInMatrix" lets each particle's color alpha control its opacity.
        let particleMaterial = AssetManager.CreateShaderMaterial(AssetManager.DEFAULT_MATERIALS.PARTICLE_TEXTURE_2D_SHADER);
        particleMaterial.setUniform("opacityInMatrix", true);
        particleMaterial.setTexture("diffuse", AssetManager.getTexture(PARTICLE_TEXTURE_NAME));
        this.particleSystem.setMaterial(particleMaterial);

        this.addChild(this.emitter);
        this.addChild(this.particleSystem);

        // Switching between motion modes stops any motion that is under way.
        this.subscribeToAppState(LabCatParticlePlaygroundModel.ControlKeys.MotionState, ()=>{
            this.emitterVelocity = V2(0, 0);
        });
    }

    /**
     * Lab Cat's current position. This is the emitter's own position object, so don't store it in a particle without
     * cloning it first (see `emit()`).
     */
    get emitterPosition(): Vec2 {
        return this.emitter.prsa.position;
    }

    /**
     * **Student code.** Called when the user presses `x`. Mark a particle to be emitted on the next frame by setting
     * its `t0` to -1; `updateParticles()` then emits it.
     *
     * This minimal version always picks the first particle, so only one particle is ever visible. Your version should
     * choose which particle to use, for example by cycling through the particles in order.
     */
    fire(){
        this.particleSystem.particles[0].t0 = -1;
    }

    /**
     * Emits one particle: puts it at Lab Cat's position, records the emission time, gives it the color and size set in
     * the control panel, and makes it visible.
     * @param particle
     */
    emit(particle: PlaygroundParticle){
        const appState = GetAppState();

        // clone() matters here. `emitterPosition` is Lab Cat's own Vec2 object. Without clone(), the particle would
        // share that object with Lab Cat (and with every other particle emitted this way), and would move whenever
        // Lab Cat moves.
        particle.position = this.emitterPosition.clone();
        particle.position0 = this.emitterPosition.clone();
        particle.t0 = this.time;

        // Color is cloned for the same reason: getState returns the control panel's own Color object.
        particle.color = (appState.getState(LabCatParticlePlaygroundModel.ControlKeys.ParticleColor) as Color).clone();
        particle.size = appState.getState(LabCatParticlePlaygroundModel.ControlKeys.ParticleSize);
        particle.visible = true;
    }

    /**
     * **Student code.** Called once per frame with the current time `t` and the time since the previous frame `dt`.
     * It should:
     * 1. emit every particle whose `t0` is -1 (see `fire()`), and
     * 2. update every visible particle: its motion, lifespan, color, size, and so on.
     *
     * This minimal version only does step 1, so emitted particles stay still forever.
     * @param t the current time, in seconds
     * @param dt the time since the previous frame, in seconds (0 on the first frame). Use it for anything that
     *   should happen at a steady rate, such as emitting a number of particles per second.
     */
    updateParticles(t: number, dt: number){
        // Reading the control panel: getState(name) returns the slider's current value. Read the values once per
        // frame, here at the top, rather than once per particle. They aren't used yet; they're here for your code.
        const appState = GetAppState();
        const variable1: number = appState.getState(LabCatParticlePlaygroundModel.ControlKeys.Variable1);
        const variable2: number = appState.getState(LabCatParticlePlaygroundModel.ControlKeys.Variable2);

        for(const particle of this.particleSystem.particles){
            if(particle.t0 === -1){
                this.emit(particle);
            }
            // TODO: update visible particles here. For example, `t - particle.t0` is how long a particle has existed.
        }

        // Tells the particle view that the particles changed, so it redraws them.
        this.particleSystem.signalParticlesUpdated();
    }

    /** Whether the motionState checkbox is on (w/a/s/d set a velocity) or off (w/a/s/d move Lab Cat directly). */
    get motionState(): boolean {
        return !!GetAppState().getState(LabCatParticlePlaygroundModel.ControlKeys.MotionState);
    }

    /**
     * Keyboard input, forwarded from the scene controller.
     * - w/a/s/d, with motionState on: set Lab Cat's velocity along that key's direction, at the speed set in the
     *   control panel. Up/down and left/right are separate, so holding w and d together moves Lab Cat diagonally.
     * - w/a/s/d, with motionState off: move Lab Cat one step in that key's direction.
     * - x: fire a particle.
     * Keys are lowercased so that the controls still work with Shift or Caps Lock on.
     * @param key the `key` value of the keyboard event, for example "w"
     */
    onKeyDown(key: string){
        const speed: number = GetAppState().getState(LabCatParticlePlaygroundModel.ControlKeys.MoveSpeed);
        if(this.motionState){
            switch(key.toLowerCase()){
                case "w": this.emitterVelocity.y = speed; break;
                case "s": this.emitterVelocity.y = -speed; break;
                case "d": this.emitterVelocity.x = speed; break;
                case "a": this.emitterVelocity.x = -speed; break;
            }
        }else{
            const step = speed * DIRECT_MOVE_STEP_SECONDS;
            let offset: Vec2 | undefined;
            switch(key.toLowerCase()){
                case "w": offset = V2(0, step); break;
                case "s": offset = V2(0, -step); break;
                case "d": offset = V2(step, 0); break;
                case "a": offset = V2(-step, 0); break;
            }
            if(offset){
                this.emitter.prsa.position = this.emitter.prsa.position.plus(offset);
            }
        }
        if(key.toLowerCase() === "x"){
            this.fire();
        }
    }

    /**
     * Keyboard input, forwarded from the scene controller. Releasing w/a/s/d stops Lab Cat's motion in that key's
     * direction. With motionState off, releasing a key does nothing.
     *
     * Each case only stops motion that still points in the released key's direction. Say you hold d, then press a
     * without letting go of d, then release d: the velocity already points left (a set it), and releasing d must not
     * stop it.
     * @param key the `key` value of the keyboard event
     */
    onKeyUp(key: string){
        if(!this.motionState){
            return;
        }
        switch(key.toLowerCase()){
            case "w": this.emitterVelocity.y = Math.min(0, this.emitterVelocity.y); break;
            case "s": this.emitterVelocity.y = Math.max(0, this.emitterVelocity.y); break;
            case "d": this.emitterVelocity.x = Math.min(0, this.emitterVelocity.x); break;
            case "a": this.emitterVelocity.x = Math.max(0, this.emitterVelocity.x); break;
        }
    }

    /**
     * The per-frame update. Moves Lab Cat by its velocity, then updates the particles, passing on the time since the
     * previous frame.
     * @param t the current time, in seconds
     */
    timeUpdate(t: number, ...args: any[]){
        super.timeUpdate(t, ...args);

        // How much time passed since the last frame (0 on the first frame).
        const dt = (this.lastTime === undefined) ? 0 : t - this.lastTime;
        this.lastTime = t;

        // Move Lab Cat: new position = old position + velocity * (time passed).
        if(this.emitterVelocity.L2() > 0){
            const transform = this.emitter.prsa;
            transform.position = transform.position.plus(this.emitterVelocity.times(dt));
            // Changing the transform already redraws the view, so this call is harmless. It would be needed if the
            // emitter's autoTransformUpdate were off (for batching many transform changes into one redraw).
            this.emitter.signalTransformUpdate();
        }

        // Record the frame time for emit(), then update the particles.
        this.time = t;
        this.updateParticles(t, dt);
    }
}
