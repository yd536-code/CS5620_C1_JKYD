import {AssetManager, ASerializable, Vec2, V2, Color} from "../../../anigraph";
import {AInstancedParticleSystemModel2D} from "../../../anigraph/starter/nodes/instancedparticlesystem2d/AInstancedParticleSystemModel2D";
import {FireParticle} from "./FireParticle";
import {AppState, GetAppState} from "../../../anigraph";


@ASerializable("FireModel")
export class FireModel extends AInstancedParticleSystemModel2D<FireParticle> {

    lastTime = -1;
    nextParticle = 0;
    burning = false;
    impactPhase = 0;
    burnTimeLeft = 0;
    emitterPos = V2(0,0);
    emitterEnd = V2(0, 0);
    emitTimer = 0;
    waterMovement = 0;

    constructor() {
        super();

        this.initParticles(400);

        //setting up the texture
        let material = AssetManager.CreateShaderMaterial(AssetManager.DEFAULT_MATERIALS.
        PARTICLE_TEXTURE_2D_SHADER);

        material.setUniform("opacityInMatrix", true);

        material.setTexture("diffuse", AssetManager.getTexture("FireParticleTexture"));

        this.setMaterial(material);
    }

    static SetAppState(appState: AppState) {
        appState.addSliderIfMissing("FireSize", 0.85, 0.05, 1.5, 0.01);
        appState.addSliderIfMissing("FireLifetime", 3, 0.1, 5, 0.1);
        appState.addSliderIfMissing("FireRate", 80, 1, 100, 1);
        appState.addSliderIfMissing("FireBurnDuration", 5, 0.5, 20, 0.5);
        appState.addSliderIfMissing("FireSpeed", 2, 0.1, 5, 0.1);
        appState.addCheckboxControl("FireAcrossDeck", false);
    }

    startBurning(){
        this.burning = true;
        this.burnTimeLeft = GetAppState().getState("FireBurnDuration");
        this.emitTimer = 0
        this.emitSparks();
    }

    initParticles(nParticles: number) {
        for (let i = 0; i < nParticles; i++) {
            this.addParticle(new FireParticle());
        }

        this.signalParticlesUpdated();
    }

    static async PreloadAssets(){
        await AssetManager.loadShaderMaterialModel(
            AssetManager.DEFAULT_MATERIALS.INSTANCED_TEXTURE2D_SHADER
        );

        await AssetManager.loadShaderMaterialModel(
            AssetManager.DEFAULT_MATERIALS.PARTICLE_TEXTURE_2D_SHADER
        );

        await AssetManager.loadTexture(
            "./images/gradientParticle.png",
            "FireParticleTexture"
        );
    }

    emit(position: Vec2){
        let particle = this.particles[this.nextParticle];

        this.nextParticle++;

        particle.isSpark = false;

        if(this.nextParticle >= this.particles.length) {
            this.nextParticle = 0;
        }

        //getting its size adding random
        let size = GetAppState().getState("FireSize");
        particle.size = size * (0.7 + Math.random() * 0.6);
        particle.startSize = particle.size;

        //getiting its lifetime adding random
        let lifetime: number = GetAppState().getState("FireLifetime");
        particle.lifespan = lifetime * (0.6 + Math.random() * 0.8);

        //getting the position of the fire, eather across the boat or in one spot
        //depends on the button
        let acrossDeck: boolean = GetAppState().getState("FireAcrossDeck");
        let amount = 0.5;

        if (acrossDeck) {
            amount = Math.random();
        }

        let deckDirection = this.emitterEnd.minus(position);
        particle.position = position.plus(deckDirection.times(amount));


        //getting speed from slider plus adding abit of random
        let speed: number = GetAppState().getState("FireSpeed");

        particle.velocity = V2(
            (Math.random() - 0.5) * 0.6,
            speed * (0.67 + Math.random() * 0.66)
        );

        particle.visible = true;

        particle.t0 = -1;

        this.signalParticlesUpdated();
    }

    // Create a burst of sparks from the middle of the deck.
    emitSparks() {
        for (let i = 0; i < 25; i++) {
            let particle = this.particles[this.nextParticle];

            this.nextParticle++;
            if (this.nextParticle >= this.particles.length) {
                this.nextParticle = 0;
            }

            particle.isSpark = true;
            particle.position = this.emitterPos.plus(this.emitterEnd).times(0.5);
            particle.velocity = V2(
                (Math.random() - 0.5) * 12,
                3 + Math.random() * 1.5
            );

            particle.size = 0.18 + Math.random() * 0.12;
            particle.startSize = particle.size;
            particle.lifespan = 2 + Math.random() * 0.6;
            particle.color = Color.FromString("#66ffff");
            particle.t0 = -1;
            particle.visible = true;
        }

        this.signalParticlesUpdated();
    }

    timeUpdate(t: number) {
        super.timeUpdate(t);

        if(this.lastTime == -1) {
            this.lastTime = t;
        }

        let dt = t - this.lastTime;
        this.lastTime = t;

        //check if it is burning now if so emit some particles
        if(this.burning) {
            //getting fire rate
            let rate: number = GetAppState().getState("FireRate");
            let interval = 1 /rate;

            this.emitTimer += dt;

            while(this.emitTimer >= interval){
                this.emit(this.emitterPos);
                this.emitTimer -= interval;
            }

            if(this.burning){
                this.burnTimeLeft -= dt;

                if(this.burnTimeLeft <= 0){
                    this.burning = false;
                }
            }
        }

        for(let particle of this.particles) {
            if(particle.visible){
                if (particle.t0 == -1){
                    particle.t0 = t;
                }

                let age = t - particle.t0;

                if(age >= particle.lifespan){
                    particle.visible = false;
                } else {
                    //if its sparks they slow down and fall
                    if (particle.isSpark) {
                        particle.velocity.y -= 6 * dt;
                    }

                    //changing the speed of the fire to be the speed of the water
                    particle.position.x += this.waterMovement;
                    //updating position
                    particle.position = particle.position.plus(
                        particle.velocity.times(dt)
                    );

                    //updating color and making it change slowly
                    let progress = age / particle.lifespan;

                    //if its spark do this
                    if(particle.isSpark){
                        particle.size = particle.startSize * (1-0.5*progress);
                        particle.color = Color.FromString("#fff2a0");
                    } else{
                        // Spread the smoke sideways during the second half of its life.
                        if (progress > 0.5) {
                            if (particle.velocity.x < 0) {
                                particle.velocity.x -= 0.4 * dt;
                            } else {
                                particle.velocity.x += 0.4 * dt;
                            }
                        }

                        //smoke spreads out good
                        particle.size = particle.startSize * (1 + progress);

                        //changing slowly to orange and then smoke
                        if (progress < 0.5) {
                            let amount = progress * 2;

                            particle.color.r = 1;
                            particle.color.g = 0.9 - 0.4 * amount;
                            particle.color.b = 0.4 - 0.3 * amount;
                        } else {
                            let amount = (progress - 0.5) * 2;

                            particle.color.r = 1 - 0.5 * amount;
                            particle.color.g = 0.5;
                            particle.color.b = 0.1 + 0.4 * amount;
                        }
                    }

                    //changing the color of the fire so in impactfram it looks right
                    if(this.impactPhase == 1){
                        particle.color = Color.Black();
                    } else if(this.impactPhase == 2){
                        particle.color = Color.White();
                    }

                    particle.color.a = 1 - progress;
                }
            }
        }

        this.signalParticlesUpdated()
    }
}
