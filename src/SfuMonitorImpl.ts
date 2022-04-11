import { ExtensionStat, Samples } from "@observertc/schemas"
import { Collector } from "./Collector";
import { EventsRegister, EventsRelayer } from "./EventsRelayer";
import { Sampler, supplyDefaultConfig as supplySamplerDefaultConfig } from "./Sampler";
import { Sender, SenderConfig } from "./Sender";
import { Timer } from "./utils/Timer";
import { StatsReader, StatsStorage } from "./entries/StatsStorage";
import { Accumulator } from "./Accumulator";
import { createLogger } from "./utils/logger";
import { SfuMonitor, SfuMonitorConfig } from "./SfuMonitor";
import EventEmitter from "events";

const logger = createLogger(`SfuMonitor`);

type ConstructorConfig = SfuMonitorConfig;

const supplyDefaultConfig = () => {
    const defaultConfig: ConstructorConfig = {
        // samplingPeriodInMs: 5000,
        // sendingPeriodInMs: 10000,
        sampler: supplySamplerDefaultConfig(),
    }
    return defaultConfig;
}

const NO_SENDER_FOR_SENDING_FLAG = "noSenderForSending";

export class SfuMonitorImpl implements SfuMonitor {
    public static create(config?: SfuMonitorConfig): SfuMonitor {
        if (config?.maxListeners !== undefined) {
            EventEmitter.setMaxListeners(config.maxListeners);
        }
        const appliedConfig = config ? Object.assign(supplyDefaultConfig(), config) : supplyDefaultConfig();
        return new SfuMonitorImpl(appliedConfig);
    }
    private _closed = false;
    private _config: ConstructorConfig;
    private _collectors: Map<string, Collector> = new Map();
    private _sampler: Sampler;
    private _sender?: Sender;
    private _timer?: Timer;
    private _flags: Set<string> = new Set();
    private _eventer: EventsRelayer;
    private _statsStorage: StatsStorage;
    private _accumulator: Accumulator;
    private constructor(config: ConstructorConfig) {
        this._config = config;
        this._statsStorage = new StatsStorage();
        this._accumulator = Accumulator.create(config.accumulator);
        this._eventer = EventsRelayer.create();
        this._sampler = this._makeSampler();
        this._createSender();
        this._createTimer();
    }
    
    public get sfuId() : string {
        /* eslint-disable @typescript-eslint/no-non-null-assertion */
        return this._sampler.sfuId!;
    }

    public get events(): EventsRegister {
        return this._eventer;
    }

    public get storage(): StatsReader {
        return this._statsStorage;
    }

    public get connected(): boolean {
        return this._sender?.closed == false;
    }

    public addStatsCollector(collector: Collector): void {
        if (this._collectors.has(collector.id)) {
            throw new Error(`Collector with id ${collector.id} has already been added`);
        }
        collector.setStatsWriter(this._statsStorage);
        this._collectors.set(collector.id, collector);
        logger.info(`Collector ${collector.id} has been added`);
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
        logger.info(`Collector ${collector.id} has been removed`);
    }

    public addExtensionStats(stats: ExtensionStat): void {
        this._sampler.addExtensionStats(stats);
    }

    public setMarker(marker: string): void {
        this._sampler.setMarker(marker);
    }

    public connect(config: SenderConfig) {
        if (this._sender) {
            logger.info(`A sender has already been configured, it will be forcefully closed`);
            this._sender.close();
        }
        this._config.sender = config;
        this._createSender();
    }

    public async collect(): Promise<void> {
        const collectors = Array.from(this._collectors.values());
        const started = Date.now();
        for (const collector of collectors) {
            await collector.collect();
        }
        this._eventer.emitStatsCollected();

        if (this._config.statsExpirationTimeInMs) {
            const expirationThresholdInMs = Date.now() - this._config.statsExpirationTimeInMs;
            this._statsStorage.trim(expirationThresholdInMs);
        }
        const elapsedInMs = Date.now() - started;
        const { collectingPeriodInMs } = this._config;
        if (collectingPeriodInMs) {
            if (collectingPeriodInMs < elapsedInMs) {
                logger.warn(`Collecting from collector took ${elapsedInMs} and Collecting period is ${collectingPeriodInMs}!`);
            } else if (collectingPeriodInMs / 2 < elapsedInMs) {
                logger.info(`Collecting from collector took ${elapsedInMs} and Collecting period is ${collectingPeriodInMs}!`);
            }
        }
        logger.debug(`Collecting took `, elapsedInMs);
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
            if (this._flags.has(NO_SENDER_FOR_SENDING_FLAG)) {
                return;
            }
            this._flags.add(NO_SENDER_FOR_SENDING_FLAG);
            logger.warn(`Cannot send samples, because no Sender is available`);
            return;
        }
        const queue: Samples[] = [];
        this._accumulator.drainTo(samples => {
            if (!samples) return;
            queue.push(samples);
        });
        for (const samples of queue) {
            this._sender.send(samples);
        }
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

    private _createSender(): void {
        const { sender: senderConfig } = this._config;
        if (!senderConfig) {
            return;
        }
        this._sender = Sender.create(senderConfig)
            .onError(err => {
                logger.warn(`Sender component is closed due to error`, err);
                this._sender = undefined;
                this._eventer.emitSenderDisconnected();
            })
            .onClosed(() => {
                this._sender = undefined;
            });
        this._flags.delete(NO_SENDER_FOR_SENDING_FLAG);
    }

    private _createTimer(): void {
        const {
            collectingPeriodInMs,
            samplingPeriodInMs,
            sendingPeriodInMs,
        } = this._config;
        if (this._timer) {
            logger.warn(`Attempted to recreate timer.`)
            return;
        }
        if (!collectingPeriodInMs && !samplingPeriodInMs && !sendingPeriodInMs) {
            return;
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
        this._timer = result;
    }
}