import EventEmitter = require("events");
import { Comlink } from "./Comlink";
import { SfuSampleProvider } from "./SfuSampleProvider";
import { factory } from "./ConfigLog4j";
import { SfuSampleBuilder } from "./SfuSampleBuilder";
import { SfuSample } from "./SfuSample";

const logger = factory.getLogger("SfuObserver");

const ON_STARTED_EVENT_NAME = "onStarted";
const ON_STOPPED_EVENT_NAME = "onStopped";
const ON_ERROR_EVENT_NAME = "onError";
const ON_SAMPLE_EVENT_NAME = "onSample";

export class SfuSampleRelayer {
    private _emitter: EventEmitter;
    private _sampleProvider: SfuSampleProvider;
    private _intervalInMs: number;
    private _timer: NodeJS.Timer | null = null;

    constructor(sampleProvider: SfuSampleProvider, intervalInMs: number) {
        this._emitter = new EventEmitter();
        this._sampleProvider = sampleProvider;
        this._intervalInMs = intervalInMs;
    }

    public get intervalInMs() {
        return this._intervalInMs;
    }

    onStopped(listener: () => void): SfuSampleRelayer {
        this._emitter.addListener(ON_STOPPED_EVENT_NAME, listener);
        return this;
    }

    onStarted(listener: () => void): SfuSampleRelayer {
        this._emitter.addListener(ON_STARTED_EVENT_NAME, listener);
        return this;
    }

    onError(listener: (event: Event) => void): SfuSampleRelayer {
        this._emitter.addListener(ON_ERROR_EVENT_NAME, listener);
        return this;
    }

    onSample(listener: (sample: SfuSample) => void): SfuSampleRelayer {
        this._emitter.addListener(ON_SAMPLE_EVENT_NAME, listener);
        return this;
    }

    start(): void {
        this._timer = setInterval(() => {
            try {
                const sampleBuilder = this._sampleProvider.getSample();
                this._emitter.emit(ON_SAMPLE_EVENT_NAME, sampleBuilder);
            } catch (error) {
                logger.error("An error occurred while observing sample");
                this._emitter.emit(ON_ERROR_EVENT_NAME, error);
                this.stop();
            }
        }, this._intervalInMs);
        this._emitter.emit(ON_STARTED_EVENT_NAME);
    }

    stop(): void {
        if (this._timer !== null) {
            clearInterval(this._timer);
        }
        this._emitter.emit(ON_STOPPED_EVENT_NAME);
    }
}