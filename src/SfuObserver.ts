import EventEmitter = require("events");
import { Comlink } from "./Comlink";
import { SfuSampleProvider } from "./SfuSampleProvider";
import { factory } from "./ConfigLog4j";
 
const logger = factory.getLogger("SfuObserver");

const ON_STARTED_EVENT_NAME = "onStarted";
const ON_STOPPED_EVENT_NAME = "onStopped";
const ON_ERROR_EVENT_NAME = "onError";

interface Builder {
    withComlink(comlink: Comlink): this;
    withSampleProvider(sampleProvider: SfuSampleProvider): this;
    withIntervalInMs(intervalInMs: number): this;
    build(): SfuObserver;
}

export class SfuObserver {
    public static builder(): Builder {
        let _comlink: Comlink | null = null;
        let _sampleProvider: SfuSampleProvider | null = null;
        let _intervalInMs = 5000;
        return {
            withComlink(comlink: Comlink): Builder {
                _comlink = comlink;
                return this;
            },
        
            withSampleProvider(sampleProvider: SfuSampleProvider): Builder {
                _sampleProvider = sampleProvider;
                return this;
            },

            withIntervalInMs(intervalInMs: number): Builder {
                if (!Number.isFinite(intervalInMs) || intervalInMs < 500 || 30000 < intervalInMs) {
                    throw new Error("Polling interval must be integer between 500 and 30000");
                }
                _intervalInMs = intervalInMs;
                return this;
            },

            build() {
                if (_comlink === null) {
                    throw new Error("Comlink cannot be null");
                }
                if (_sampleProvider === null) {
                    throw new Error("Sample Provider cannot be null");
                }
                const result = new SfuObserver(_comlink, _sampleProvider, _intervalInMs);
                return result;
            }
        }
    }


    private _emitter: EventEmitter;
    private _comlink: Comlink;
    private _sampleProvider: SfuSampleProvider;
    private _intervalInMs: number;
    private _timer: NodeJS.Timer | null = null;
    private _marker: string | null = null;

    private constructor(comlink: Comlink, sampleProvider: SfuSampleProvider, intervalInMs: number) {
        this._emitter = new EventEmitter();
        this._comlink = comlink;
        this._sampleProvider = sampleProvider;
        this._intervalInMs = intervalInMs;
    }

    public get intervalInMs() {
        return this._intervalInMs;
    }

    onStopped(listener: () => void): SfuObserver {
        this._emitter.addListener(ON_STOPPED_EVENT_NAME, listener);
        return this;
    }

    onStarted(listener: () => void): SfuObserver {
        this._emitter.addListener(ON_STARTED_EVENT_NAME, listener);
        return this;
    }

    onError(listener: (event: Event) => void): SfuObserver {
        this._emitter.addListener(ON_ERROR_EVENT_NAME, listener);
        return this;
    }

    start(): void {
        this._timer = setInterval(() => {
            try {
                const sample = this._sampleProvider.getSample();
                if (this._marker !== null) {
                    sample.marker = this._marker;
                }
                this._comlink.send(sample);
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

    markSamples(marker?: string): void {
        if (marker === null || marker === undefined) {
            this._marker = null;
            return;
        }
        this._marker = marker;
    }
}