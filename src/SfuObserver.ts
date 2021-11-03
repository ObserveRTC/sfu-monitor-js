import EventEmitter = require("events");
import { Comlink } from "./Comlink";
import { SfuSample } from "./SfuSample";

export interface SfuObserver {
    onError(listener: (event: Event) => void): this;
    onSample(listener: (sample: SfuSample) => void): this;
    start(): this;
    stop(): this;
    markSamples(marker?: string): this;
    sendExtensionStats(payloadType: string, payload: string) : this;
    watchTransport(transport: any): this;
}