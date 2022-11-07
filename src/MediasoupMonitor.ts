import { CustomSfuEvent, ExtensionStat } from "@observertc/schemas";
import { EventsRegister } from "./EventsRelayer";
import { SenderConfig } from "./Sender";
import { StatsReader } from "./entries/StatsStorage";
import { createLogger } from "./utils/logger";
import { SfuMonitor } from "./SfuMonitor";
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
import { createSfuMonitor, SfuMonitorConfig } from "./SfuMonitor";
import {
    MediasoupSurrogateCollectorConfig,
    MediasoupSurrogateCollector,
} from "./mediasoup/MediasoupSurrogateCollector";

const logger = createLogger("MediasoupMonitor");

export type MediasoupMonitorConfig = SfuMonitorConfig & {
    mediasoup: MediasoupSurrogate;
};

export class MediasoupMonitor implements SfuMonitor {
    public static create(config?: SfuMonitorConfig): MediasoupMonitor {
        const sfuMonitor = createSfuMonitor(config);
        return new MediasoupMonitor(sfuMonitor);
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

    public sample(): Promise<void> {
        return this._monitor.sample();
    }

    public send(): Promise<void> {
        return this.send();
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