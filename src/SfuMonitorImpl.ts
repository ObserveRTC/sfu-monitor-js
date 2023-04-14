import { CustomSfuEvent, ExtensionStat, Samples } from "@observertc/sample-schemas-js";
import { Sampler } from "./Sampler";
import { Timer } from "./utils/Timer";
import { StatsReader, StatsStorage } from "./entries/StatsStorage";
import { Accumulator } from "./Accumulator";
import { createLogger } from "./utils/logger";
import { SfuMonitor, SfuMonitorConfig, SfuMonitorEventsMap } from "./SfuMonitor";
import { EventEmitter } from "events";
import { MonitorMetrics } from "./MonitorMetrics";
import { setLogLevel } from "./utils/logger";
import { Collector } from "./Collector";
import { MediasoupCollector, MediasoupCollectorConfig, MediasoupCollectorImpl } from "./mediasoup/MediasoupCollector";
import { PromiseFetcher } from "./utils/PromiseFetcher";
import { v4 as uuid } from 'uuid';
import { AuxCollector, AuxCollectorImpl } from "./AuxCollector";
import { SFU_EVENT } from "./utils/common";

const logger = createLogger(`SfuMonitor`);

const supplyDefaultConfig = () => {
    const defaultConfig: SfuMonitorConfig = {
        sfuId: uuid(),
        logLevel: 'warn',
        tickingTimeInMs: 1000,
        pollingBatchPaceTimeInMs: 0,
    };
    return defaultConfig;
};

export class SfuMonitorImpl implements SfuMonitor {
    public static create(config?: Partial<SfuMonitorConfig>): SfuMonitor {
        const appliedConfig = Object.assign(supplyDefaultConfig(), config ?? {});
        const result = new SfuMonitorImpl(appliedConfig);
        setLogLevel(config?.logLevel ?? "silent");
        if (config?.maxListeners !== undefined) {
            result._emitter.setMaxListeners(config.maxListeners);
        }
        logger.info(`Created`, appliedConfig);
        return result;
    }

    private _closed = false;
    private _collectors = new Map<string, Collector>();
    private _emitter = new EventEmitter();
    private _sampler: Sampler;
    private _metrics = new MonitorMetrics();
    private _timer?: Timer;
    private _statsStorage: StatsStorage;
    private _accumulator: Accumulator;
    
    private constructor(
        public readonly config: SfuMonitorConfig
    ) {
        this._statsStorage = new StatsStorage(
            this.config.createSfuEvents ? event => this.addCustomSfuEvent(event) : undefined
        );
        this._accumulator = Accumulator.create(config.accumulator);
        this._sampler = new Sampler(
            this.config.sfuId,
            this._statsStorage,
        )
        this._createTimer();
    }
    
    public addTransportOpenedEvent(transportId: string, timestamp?: number): void {
        this.addCustomSfuEvent({
            name: SFU_EVENT.SFU_TRANSPORT_OPENED,
            timestamp: timestamp ?? Date.now(),
            transportId,
        });
    }

    public addTransportClosedEvent(transportId: string, timestamp?: number): void {
        this.addCustomSfuEvent({
            name: SFU_EVENT.SFU_TRANSPORT_CLOSED,
            timestamp: timestamp ?? Date.now(),
            transportId,
        });
    }

    public addRtpStreamAdded(transportId: string, rtpPadId: string, sfuStreamId: string, sfuSinkId?: string, timestamp?: number): void {
        this.addCustomSfuEvent({
            name: SFU_EVENT.SFU_RTP_STREAM_ADDED,
            timestamp: timestamp ?? Date.now(),
            transportId,
            sfuStreamId,
            sfuSinkId,
            value: rtpPadId,
        });
    }

    public addRtpStreamRemoved(transportId: string, rtpPadId: string, sfuStreamId: string, sfuSinkId?: string, timestamp?: number): void {
        this.addCustomSfuEvent({
            name: SFU_EVENT.SFU_RTP_STREAM_REMOVED,
            timestamp: timestamp ?? Date.now(),
            transportId,
            sfuStreamId,
            sfuSinkId,
            value: rtpPadId,
        });
    }

    public get sfuId(): string {
        /* eslint-disable @typescript-eslint/no-non-null-assertion */
        return this._sampler.sfuId!;
    }

    public get storage(): StatsReader {
        return this._statsStorage;
    }

    public get metrics(): MonitorMetrics {
        return this._metrics;
    }

    public on<K extends keyof SfuMonitorEventsMap>(event: K, listener: (data: SfuMonitorEventsMap[K]) => void): this {
        this._emitter.on(event, listener);
        return this;
    }

    public once<K extends keyof SfuMonitorEventsMap>(event: K, listener: (data: SfuMonitorEventsMap[K]) => void): this {
        this._emitter.once(event, listener);
        return this;
    }
    
    public off<K extends keyof SfuMonitorEventsMap>(event: K, listener: (data: SfuMonitorEventsMap[K]) => void): this {
        this._emitter.off(event, listener);
        return this;
    }

    public addExtensionStats(stats: ExtensionStat): void {
        this._sampler.addExtensionStats(stats);
    }

    public addCustomSfuEvent(event: CustomSfuEvent): void {
        this._sampler.addSfuCustomEvent(event);
    }

    public setMarker(marker: string): void {
        this._sampler.setMarker(marker);
    }

    public createMediasoupCollector(config: MediasoupCollectorConfig): MediasoupCollector {
        const collectors = this._collectors;
        const collector = new class extends MediasoupCollectorImpl {
            protected onClose(): void {
                collectors.delete(collector.id);
            }
        }(
            config,
            this._statsStorage,
        );
        this._collectors.set(collector.id, collector);
        return collector;
    }

    public createAuxCollector(): AuxCollector {
        const collectors = this._collectors;
        const collector = new class extends AuxCollectorImpl {
            protected onClose(): void {
                collectors.delete(collector.id);
            }
        }(
            this._statsStorage,
        );
        this._collectors.set(collector.id, collector);
        return collector;
    }


    public async collect(): Promise<void> {
        const pollingBatchPaceTimeInMs = this.config.pollingBatchPaceTimeInMs ?? 0;
        const started = Date.now();

        // collect
        const promiseFetcher = PromiseFetcher.builder()
            .withBatchSize(this.config.pollingBatchSize ?? 0)
            .withPace(pollingBatchPaceTimeInMs, pollingBatchPaceTimeInMs + 1)
            .onCatchedError((err) => {
                logger.warn(`Error occurred while collecting`, err);
            });
        for (const collector of Array.from(this._collectors.values())) {
            const fetchers = collector.createFetchers();
            for (const fetcher of fetchers) {
                promiseFetcher.withPromiseSuppliers(fetcher);
            }
        }
        await promiseFetcher.build().fetch();

        const elapsedInMs = Date.now() - started;

        this._statsStorage.clean();

        const { collectingPeriodInMs } = this.config;
        if (collectingPeriodInMs) {
            if (collectingPeriodInMs < elapsedInMs) {
                logger.warn(
                    `Collecting from collector took ${elapsedInMs} and Collecting period is ${collectingPeriodInMs}!`
                );
            } else if (collectingPeriodInMs / 2 < elapsedInMs) {
                logger.debug(
                    `Collecting from collector took ${elapsedInMs} and Collecting period is ${collectingPeriodInMs}!`
                );
            }
        }
        logger.debug(`Collecting took `, elapsedInMs);
        this._metrics.setCollectingTimeInMs(elapsedInMs);
    }

    public sample(): void {
        const sfuSample = this._sampler.make();
        const sendEventKey: keyof SfuMonitorEventsMap = 'send';
        if (this._emitter.listenerCount(sendEventKey)) {
            this._accumulator.addSfuSample(sfuSample);
        }
        this._emit('sample-created', {
            sfuSample
        });
        this._metrics.setLastSampled(Date.now());
    }

    public send(): void {
        const samples: Samples[] = [];
        this._accumulator.drainTo((sfuSamples) => {
            if (!sfuSamples) return;
            samples.push(sfuSamples);
        });
        this._emit('send', {
            samples
        });
        this._metrics.setLastSent(Date.now());
    }

    public get closed() {
        return this._closed;
    }

    public close(): void {
        if (this._closed) {
            logger.warn(`Attempted to close twice`);
            return;
        }
        try {
            if (this._timer) {
                this._timer.clear();
            }
            this._sampler.close();
        } finally {
            this._closed = true;
            logger.info(`Closed`);
        }
    }


    private _emit<K extends keyof SfuMonitorEventsMap>(event: K, data: SfuMonitorEventsMap[K]): boolean {
        return this._emitter.emit(event, data);
    }


    private _createTimer(): void {
        const { collectingPeriodInMs, samplingPeriodInMs, sendingPeriodInMs } = this.config;
        if (this._timer) {
            logger.warn(`Attempted to recreate timer.`);
            return;
        }
        if (!collectingPeriodInMs && !samplingPeriodInMs && !sendingPeriodInMs) {
            return;
        }
        const result = new Timer(this.config.tickingTimeInMs);
        if (collectingPeriodInMs && 0 < collectingPeriodInMs) {
            result.add({
                type: "collect",
                asyncProcess: this.collect.bind(this),
                fixedDelayInMs: collectingPeriodInMs,
                context: "Collect Stats",
            });
        }
        if (samplingPeriodInMs && 0 < samplingPeriodInMs) {
            result.add({
                type: "sample",
                process: this.sample.bind(this),
                fixedDelayInMs: samplingPeriodInMs,
                context: "Creating Sample",
            });
        }
        if (sendingPeriodInMs && 0 < sendingPeriodInMs) {
            result.add({
                type: "send",
                process: this.send.bind(this),
                fixedDelayInMs: sendingPeriodInMs,
                context: "Sending Samples",
            });
        }
        this._timer = result;
    }
}
