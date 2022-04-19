import { SfuSample, Samples } from "@observertc/schemas"

export type AccumulatorConfig = {
    maxSfuSamples?: number;
    forwardIfEmpty?: boolean;
}


const supplyDefaultConfig = () => {
    const result: AccumulatorConfig = {
        forwardIfEmpty: false,
    };
    return result;
}

export type SamplesListener = (samples?: Samples) => void;

export class Accumulator  {
    public static create(config?: AccumulatorConfig) {
        const appliedConfig = Object.assign(supplyDefaultConfig(), config);
        return new Accumulator(appliedConfig);
    }

    // the first message constains the version of the schema
    private _samples: Samples = {};
    private _buffer: Samples[] = [];
    private _empty = true;
    private _config: AccumulatorConfig;
    public constructor(config: AccumulatorConfig) {
        this._config = config;
    }

    public get isEmpty(): boolean {
        return this._empty;
    }

    public drainTo(consumer: SamplesListener) {
        this._buffering();
        if (this._buffer.length < 1) {
            if (this._config.forwardIfEmpty) {
                consumer();
            }
            return;
        }
        const buffer = this._buffer;
        this._buffer = [];
        buffer.forEach(samples => {
            // samples.clientSamples = [];
            consumer(samples);
        });
    }

    public addSfuSample(sfuSample: SfuSample): void {
        let sfuSamples = this._samples.sfuSamples;
        if (!sfuSamples) {
            sfuSamples = [];
            this._samples.sfuSamples = sfuSamples;
        }
        sfuSamples.push(sfuSample);
        this._empty = false;
        if (this._config.maxSfuSamples && sfuSamples.length <= this._config.maxSfuSamples) {
            this._buffering();
        }
    }

    private _buffering() : void {
        if (this._empty) return;
        this._buffer.push(this._samples)
        this._samples = {};
        this._empty = true;
    }
}