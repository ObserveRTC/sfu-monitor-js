import { CustomSfuEvent, ExtensionStat } from "@observertc/schemas";
import { EventsRegister } from "./EventsRelayer";
import { SamplesSentCallback, SenderConfig } from "./Sender";
import { StatsReader } from "./entries/StatsStorage";
import { createLogger } from "./utils/logger";
import { Collectors } from "./Collectors";
import {
    MediasoupConsumer,
    MediasoupDataConsumer,
    MediasoupDataProducer,
    MediasoupProducer,
    MediasoupRouter,
    MediasoupSurrogate,
    MediasoupTransport,
    MediasoupTransportType,
    MediasoupWorker,
} from "./mediasoup/MediasoupTypes";
import {
    MediasoupTransportCollector,
    MediasoupTransportCollectorConfig,
} from "./mediasoup/MediasoupTransportCollector";
import { MediasoupRouterCollector, MediasoupRouterCollectorConfig } from "./mediasoup/MediasoupRouterCollector";
import {
    MediasoupWorkerCollectorConfig,
    MediasoupWorkerCollector as MediasoupWorkerCollector,
} from "./mediasoup/MediasoupWorkerCollector";
import { MediasoupConsumerCollector, MediasoupConsumerCollectorConfig } from "./mediasoup/MediasoupConsumerCollector";
import { MediasoupProducerCollector, MediasoupProducerCollectorConfig } from "./mediasoup/MediasoupProducerCollector";
import {
    MediasoupDataProducerCollector,
    MediasoupDataProducerCollectorConfig,
} from "./mediasoup/MediasoupDataProducerCollector";
import {
    MediasoupDataConsumerCollector,
    MediasoupDataConsumerCollectorConfig,
} from "./mediasoup/MediasoupDataConsumerCollector";
import { SfuMonitor, SfuMonitorConfig } from "./SfuMonitor";
import {
    MediasoupSurrogateCollectorConfig,
    MediasoupSurrogateCollector,
} from "./mediasoup/MediasoupSurrogateCollector";
import { SfuMonitorImpl } from "./SfuMonitorImpl";
import { MonitorMetrics } from "./MonitorMetrics";

const logger = createLogger("MediasoupMonitor");

export type MediasoupMonitorConfig = SfuMonitorConfig & {
    mediasoup?: MediasoupSurrogate;
    mediasoupCollectors?: MediasoupSurrogateCollectorConfig;
};

export class MediasoupMonitor implements SfuMonitor {
    public static create(config?: MediasoupMonitorConfig): MediasoupMonitor {
        const sfuMonitor = SfuMonitorImpl.create(config);
        const result = new MediasoupMonitor(sfuMonitor);
        if (config?.mediasoup) {
            result.watchAll(config.mediasoup, config.mediasoupCollectors);
        }
        return result;
    }

    private _closed = false;
    private _monitor: SfuMonitor;

    private constructor(monitor: SfuMonitor) {
        this._monitor = monitor;
    }

    public get collectors(): Collectors {
        return this._monitor.collectors;
    }

    public get storage(): StatsReader {
        return this._monitor.storage;
    }

    public get events(): EventsRegister {
        return this._monitor.events;
    }

    public get metrics(): MonitorMetrics {
        return this._monitor.metrics;
    }

    public get connected(): boolean {
        return this._monitor.connected;
    }

    public addExtensionStats(stats: ExtensionStat): void {
        this._monitor.addExtensionStats(stats);
    }

    public connect(config: SenderConfig): void {
        this._monitor.connect(config);
    }

    public setMarker(marker: string): void {
        this._monitor.setMarker(marker);
    }

    public collect(): Promise<void> {
        return this._monitor.collect();
    }

    public sample(): void {
        this._monitor.sample();
    }

    public send(callback?: SamplesSentCallback): void {
        return this.send(callback);
    }

    public get closed(): boolean {
        return this._closed;
    }

    public close(): void {
        if (this._closed) {
            logger.warn(`Attempted to close a monitor twice`);
            return;
        }
        this._closed = true;

        this._monitor.close();
    }

    public addCustomSfuEvent(event: CustomSfuEvent): void {
        this._monitor.addCustomSfuEvent(event);
    }

    public watchAll(
        mediasoup: MediasoupSurrogate,
        config?: MediasoupSurrogateCollectorConfig
    ): MediasoupSurrogateCollector {
        const result = new MediasoupSurrogateCollector(this._monitor.collectors, mediasoup, config);
        this._monitor.collectors.add(result);
        return result;
    }

    public watchWorker(worker: MediasoupWorker, config?: MediasoupWorkerCollectorConfig): MediasoupWorkerCollector {
        const result = new MediasoupWorkerCollector(this._monitor.collectors, worker, config);
        this._monitor.collectors.add(result);
        return result;
    }

    public watchRouter(router: MediasoupRouter, config?: MediasoupRouterCollectorConfig): MediasoupRouterCollector {
        const result = new MediasoupRouterCollector(this._monitor.collectors, router, config);
        this._monitor.collectors.add(result);
        return result;
    }

    public watchWebRtcTransport(transport: MediasoupTransport, config?: MediasoupTransportCollectorConfig) {
        return this._watchTransprot(transport, "webrtc-transport", config);
    }

    public watchPlainRtpTransport(transport: MediasoupTransport, config?: MediasoupTransportCollectorConfig) {
        return this._watchTransprot(transport, "plain-rtp-transport", config);
    }

    public watchPipeTransport(transport: MediasoupTransport, config?: MediasoupTransportCollectorConfig) {
        return this._watchTransprot(transport, "pipe-transport", config);
    }

    public watchDirectTransport(transport: MediasoupTransport, config?: MediasoupTransportCollectorConfig) {
        return this._watchTransprot(transport, "direct-transport", config);
    }

    public watchConsumer(
        consumer: MediasoupConsumer,
        transportId: string,
        internal: boolean,
        config?: MediasoupConsumerCollectorConfig
    ) {
        const result = new MediasoupConsumerCollector(
            this._monitor.collectors,
            consumer,
            transportId,
            internal,
            config
        );
        this._monitor.collectors.add(result);
        return result;
    }

    public watchProducer(
        producer: MediasoupProducer,
        transportId: string,
        internal: boolean,
        config?: MediasoupProducerCollectorConfig
    ) {
        const result = new MediasoupProducerCollector(
            this._monitor.collectors,
            producer,
            transportId,
            internal,
            config
        );
        this._monitor.collectors.add(result);
        return result;
    }

    public watchDataConsumer(
        consumer: MediasoupDataConsumer,
        transportId: string,
        internal: boolean,
        config?: MediasoupDataConsumerCollectorConfig
    ) {
        const result = new MediasoupDataConsumerCollector(
            this._monitor.collectors,
            consumer,
            transportId,
            internal,
            config
        );
        this._monitor.collectors.add(result);
        return result;
    }

    public watchDataProducer(
        producer: MediasoupDataProducer,
        transportId: string,
        internal: boolean,
        config?: MediasoupDataProducerCollectorConfig
    ) {
        const result = new MediasoupDataProducerCollector(
            this._monitor.collectors,
            producer,
            transportId,
            internal,
            config
        );
        this._monitor.collectors.add(result);
        return result;
    }

    private _watchTransprot(
        transport: MediasoupTransport,
        transportType: MediasoupTransportType,
        config?: MediasoupTransportCollectorConfig
    ): MediasoupTransportCollector {
        const result = new MediasoupTransportCollector(this._monitor.collectors, transport, {
            ...(config ?? {}),
            transportType,
        });
        this._monitor.collectors.add(result);
        return result;
    }
}
