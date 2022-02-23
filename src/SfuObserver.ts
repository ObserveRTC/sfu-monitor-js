import { ExtensionStat } from "@observertc/schemas"
import { Collector } from "./Collector";
import { EventsRegister, EventsRelayer } from "./EventsRelayer";
import { Sampler, SamplerConfig, defaultConfig as samplerDefaultConfig } from "./Sampler";
import { Sender, SenderConfig } from "./Sender";
import { Timer } from "./utils/Timer";
import { StatsReader, StatsStorage } from "./entries/StatsStorage";
import { Accumulator, AccumulatorConfig } from "./Accumulator";
import { LogLevelDesc } from "loglevel";
import { createLogger } from "./utils/logger";

const logger = createLogger(`SfuObserver`);

export type SfuObserverConfig = {
    /**
     * By setting it, the observer calls the added statsCollectors periodically
     * and pulls the stats.
     * 
     * DEFAULT: undefined
     */
    collectingPeriodInMs?: number;
    /**
     * By setting it, the observer make samples periodically.
     * 
     * DEFAULT: undefined
     */
    samplingPeriodInMs?: number;
    /**
     * By setting it, the observer sends the samples periodically.
     * 
     * DEFAULT: undefined
     */
    sendingPeriodInMs?: number;

    /**
     * By setting it stats items and entries are deleted if they are not updated.
     * 
     * DEFAULT: undefined
     */
    statsExpirationTimeInMs?: number;

    /**
     * Sampling Component Related configurations
     * 
     */
    sampler: SamplerConfig;

    /**
     * Sending Component Related congurations
     * 
     * default: undefined, means no sample is sent
     */
    sender?: SenderConfig;

    /**
     * If the sender component is configured, 
     * accumulator sets the buffer between sampling and sending.
     */
    accumulator?: AccumulatorConfig,
};

type ConstructorConfig = SfuObserverConfig;

const defaultConfig: ConstructorConfig = {
    // samplingPeriodInMs: 5000,
    // sendingPeriodInMs: 10000,
    sampler: samplerDefaultConfig,
}

export interface ISfuObserver {
    readonly stats: StatsReader;

    readonly events: EventsRegister;

    addExtensionStats(stats: ExtensionStat): void;

    setMarker(marker: string): void;

    /**
     * Collect Stats
     */
    collect(): Promise<void>;
    /**
     * Make client sample from a collected stats
     */
    sample(): Promise<void>;
    /**
     * Explicit command to send samples
     */
    send(): Promise<void>; 

    readonly closed: boolean;
    close(): void;
}

export class SfuObserver implements ISfuObserver {
     /**
     * Sets the level of logging of the module
     */
    public static setLogLevel(level: LogLevelDesc) {
        logger.setLevel(level);
    }
    /**
     * Create ClientObserver
     * @param config the passed config
     */
    public static create(config?: SfuObserverConfig): SfuObserver {
        const appliedConfig = config ? Object.assign(defaultConfig, config) : defaultConfig;
        return new SfuObserver(appliedConfig);
    }

    private _closed = false;
    private _config: ConstructorConfig;
    private _collectors: Map<string, Collector> = new Map();
    private _sampler: Sampler;
    private _sender?: Sender;
    private _timer?: Timer;
    private _eventer: EventsRelayer;
    private _statsStorage: StatsStorage;
    private _accumulator: Accumulator;
    private constructor(config: ConstructorConfig) {
        this._config = config;
        this._statsStorage = new StatsStorage();
        this._accumulator = Accumulator.create(config.accumulator);
        this._eventer = EventsRelayer.create();
        this._sampler = this._makeSampler();
        this._sender = this._makeSender();
        this._timer = this._makeTimer();
    }
    
    public get sfuId() : string {
        /* eslint-disable @typescript-eslint/no-non-null-assertion */
        return this._sampler.sfuId!;
    }

    public get events(): EventsRegister {
        return this._eventer;
    }

    public get stats(): StatsReader {
        return this._statsStorage;
    }

    public addStatsCollector(collector: Collector): void {
        if (this._collectors.has(collector.id)) {
            throw new Error(`Collector with id ${collector.id} has already been added`);
        }
        collector.setStatsWriter(this._statsStorage);
        this._collectors.set(collector.id, collector);
    }

    public removeStatsCollector(collectorId: string): void {
        const collector = this._collectors.get(collectorId);
        if (!collector) {
            logger.info(`Attempted to remove a not existing collector ${collectorId}`);
            return;
        }
        if (!collector.closed) {
            collector.close();
        }
        collector.setStatsWriter(null);
        this._collectors.delete(collectorId);
    }

    public addExtensionStats(stats: ExtensionStat): void {
        this._sampler.addExtensionStats(stats);
    }

    public setMarker(marker: string): void {
        this._sampler.setMarker(marker);
    }

    public async collect(): Promise<void> {
        const collectors = Array.from(this._collectors.values());
        for (const collector of collectors) {
            await collector.collect();
        }
        this._eventer.emitStatsCollected();

        if (this._config.statsExpirationTimeInMs) {
            const expirationThresholdInMs = Date.now() - this._config.statsExpirationTimeInMs;
            this._statsStorage.trim(expirationThresholdInMs);
        }
    }

    public async sample(): Promise<void> {
        const sfuSample = this._sampler.make();
        if (this._sender) {
            this._accumulator.addSfuSample(sfuSample);    
        }
        this._eventer.emitSampleCreated(sfuSample);
    }

    public async send(): Promise<void> {
        if (!this._sender) {
            throw new Error(`Cannot send samples, because no Sender has been configured`);
        }
        const promises: Promise<void>[] = [];
        this._accumulator.drainTo(samples => {
            if (!samples) return;
            /* eslint-disable @typescript-eslint/no-non-null-assertion */
            const promise = this._sender!.send(samples);
            promises.push(promise);
        });
        await Promise.all(promises).catch(async err => {
            logger.warn(err);
            if (!this._sender) return;
            if (!this._sender.closed) {
                await this._sender.close();
            }
            this._sender = undefined;
        });
        this._eventer.emitSampleSent();
    }

    public get closed() {
        return this._closed;
    }

    public close(): void {
        if (this._closed) {
            logger.warn(`Attempted to close twice`);
            return;
        }
        this._closed = true;
        if (this._timer) {
            this._timer.clear();
        }
        this._sampler.close();
        if (this._sender && !this._sender.closed) {
            this._sender.close();
        }
    }

    private _makeSampler(): Sampler {
        const samplerConfig = this._config.sampler;
        const result = Sampler.builder()
            .withConfig(samplerConfig)
            .build();
        result.statsProvider = this._statsStorage;
        return result;
    }

    private _makeSender(): Sender | undefined {
        const senderConfig = this._config.sender;
        if (!senderConfig) {
            return undefined;
        }
        const result = Sender.create(senderConfig);
        return result;
    }

    private _makeTimer(): Timer | undefined {
        const {
            collectingPeriodInMs,
            samplingPeriodInMs,
            sendingPeriodInMs,
        } = this._config;
        if (!collectingPeriodInMs && !samplingPeriodInMs && !sendingPeriodInMs) {
            return undefined;
        }
        const result = new Timer();
        if (collectingPeriodInMs && 0 < collectingPeriodInMs) {
            result.add({
                type: "collect",
                process: this.collect.bind(this),
                fixedDelayInMs: collectingPeriodInMs,
                context: "Collect Stats"
            });
        }
        if (samplingPeriodInMs && 0 < samplingPeriodInMs) {
            result.add({
                type: "sample",
                process: this.sample.bind(this),
                fixedDelayInMs: samplingPeriodInMs,
                context: "Creating Sample"
            });
        }
        if (sendingPeriodInMs && 0 < sendingPeriodInMs) {
            result.add({
                type: "send",
                process: this.send.bind(this),
                fixedDelayInMs: sendingPeriodInMs,
                context: "Sending Samples"
            });
        }
        return result;
    }
}