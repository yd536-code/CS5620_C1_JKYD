export interface WaterSample {
    height: number;
    normal: { x: number; y: number };
    velocityY: number;
}

export type SampleWater = (x: number) => WaterSample;