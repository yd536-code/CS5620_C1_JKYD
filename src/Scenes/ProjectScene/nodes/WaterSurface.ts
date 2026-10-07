export interface WaterSample {
    height: number;
    normal: { x: number; y: number };
    velocityX: number;
    velocityY: number;
}

export type SampleWater = (x: number) => WaterSample;