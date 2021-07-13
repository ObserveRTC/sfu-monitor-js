import { SfuSample } from "./SfuSample";

export interface SfuSampleProvider {
    getSample(): SfuSample;
}
