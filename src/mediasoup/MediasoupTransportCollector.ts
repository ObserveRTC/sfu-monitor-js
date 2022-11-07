import { StatsWriter } from "../entries/StatsStorage";
import { Collector } from "../Collector";
import { createLogger } from "../utils/logger";
import { Collectors } from "../Collectors";
import { MediasoupConsumerCollector, MediasoupConsumerCollectorConfig } from "./MediasoupConsumerCollector";
import { MediasoupProducerCollector, MediasoupProducerCollectorConfig } from "./MediasoupProducerCollector";
import {
    MediasoupDirectTransport,
    MediasoupNewConsumerListener,
    MediasoupNewDataConsumerListener,
    MediasoupNewDataProducerListener,
    MediasoupNewProducerListener,
    MediasoupPipeTransport,
    MediasoupPlainTransport,
    MediasoupTransport,
    MediasoupTransportType,
    MediasoupWebRtcTransportStats,
} from "./MediasoupTypes";
import { SfuTransport } from "@observertc/schemas";
import { MediasoupDataProducerCollector, MediasoupDataProducerCollectorConfig } from "./MediasoupDataProducerCollector";
import { MediasoupDataConsumerCollector, MediasoupDataConsumerCollectorConfig } from "./MediasoupDataConsumerCollector";
import { Appendix } from "../entries/StatsEntryInterfaces";

const logger = createLogger(`MediasoupTransport`);

export type MediasoupTransportCollectorConfig = {
    /**
     * Indicate if we want to poll the transport stats
     *
     * DEFAULT: false,
     */
    pollTransportStats?: () => boolean;

    /**
     * Indicate if we want to poll the producer stats
     *
     * DEFAULT: false,
     */
    pollProducerStats?: () => boolean;

    /**
     * Indicate if we want to poll the consumer stats
     *
     * DEFAULT: false,
     */
    pollConsumerStats?: () => boolean;

    /**
     * Indicate if we want to poll the dataProducer stats
     *
     * DEFAULT: false,
     */
    pollDataProducerStats?: () => boolean;

    /**
     * Indicate if we want to poll the data consumer stats
     *
     * DEFAULT: false,
     */
    pollDataConsumerStats?: () => boolean;

    /**
     * Add custom arbitrary data to the transport entries
     * in the StatsStorage can be accessed via StatsReader
     */
    transportAppendix?: Appendix;

    /**
     * Add custom arbitrary data to the inbound rtp pad entries
     * in the StatsStorage can be accessed via StatsReader
     */
    inboundRtpApppendix?: Appendix;

    /**
     * Add custom arbitrary data to the outbound rtp pad entries
     * in the StatsStorage can be accessed via StatsReader
     */
    outboundRtpAppendix?: Appendix;

    /**
     * Add custom arbitrary data to the sctp channel entries
     * in the StatsStorage can be accessed via StatsReader
     */
    sctpChannelAppendix?: Appendix;

    /**
     * The type of the transport attempted to watch
     */
    transportType: MediasoupTransportType;
};

export class MediasoupTransportCollector implements Collector {
    public readonly id;
    private _parent: Collectors;
    private _closed = false;
    private _config: MediasoupTransportCollectorConfig;
    private _statsWriter?: StatsWriter;
    private _transport: MediasoupTransport;
    private _internal;
    private _newProducerListener: MediasoupNewProducerListener;
    private _newConsumerListener: MediasoupNewConsumerListener;
    private _newDataProducerListener: MediasoupNewDataProducerListener;
    private _newDataConsumerListener: MediasoupNewDataConsumerListener;
    public constructor(parent: Collectors, transport: MediasoupTransport, config: MediasoupTransportCollectorConfig) {
        this.id = `mediasoup-transport-${transport.id}`;
        this._parent = parent;
        this._transport = transport;
        this._config = config;
        this._internal = this._config.transportType === "pipe-transport";

        const transportId = this._transport.id;
        this._transport.observer.once("close", () => {
            this.close();
            logger.debug(`Transport ${transportId} is removed from watch`);
        });
        const collectorsFacade = this._createCollectorsFacade();
        this._newProducerListener = this._createNewProducerListener(collectorsFacade);
        this._newConsumerListener = this._createNewConsumerListener(collectorsFacade);
        this._newDataProducerListener = this._createNewDataProducerListener(collectorsFacade);
        this._newDataConsumerListener = this._createNewDataConsumerListener(collectorsFacade);

        logger.debug(`Transport ${transportId} is watched`);
    }

    public setStatsWriter(value: StatsWriter | null) {
        if (this._statsWriter) {
            logger.warn(`StatsWriter has already been set`);
            return;
        }
        if (value === null) {
            this._statsWriter = undefined;
        } else {
            this._statsWriter = value;
        }
    }

    private _createNewDataProducerListener(collectorsFacade: Collectors) {
        const result: MediasoupNewDataProducerListener = (producer) => {
            if (!this._statsWriter) {
                logger.warn(`StatsWriter is undefined, thus cannot create corresponded collectors`);
                return;
            }
            const producerCollectorConfig: MediasoupDataProducerCollectorConfig = {
                pollStats: this._config.pollDataProducerStats,
                appendix: this._config.sctpChannelAppendix,
            };

            const producerCollector = new MediasoupDataProducerCollector(
                collectorsFacade,
                producer,
                this._transport.id,
                this._internal,
                producerCollectorConfig
            );
            this._parent.add(producerCollector);
        };
        this._transport.observer.on("newdataproducer", result);
        return result;
    }

    private _createNewProducerListener(collectorsFacade: Collectors) {
        const result: MediasoupNewProducerListener = (producer) => {
            if (!this._statsWriter) {
                logger.warn(`StatsWriter is undefined, thus cannot create corresponded collectors`);
                return;
            }
            const producerCollectorConfig: MediasoupProducerCollectorConfig = {
                pollStats: this._config.pollProducerStats,
                appendix: this._config.inboundRtpApppendix,
            };

            const producerCollector = new MediasoupProducerCollector(
                collectorsFacade,
                producer,
                this._transport.id,
                this._internal,
                producerCollectorConfig
            );
            this._parent.add(producerCollector);
        };
        this._transport.observer.on("newproducer", result);
        return result;
    }

    private _createNewConsumerListener(collectorsFacade: Collectors) {
        const result: MediasoupNewConsumerListener = (consumer) => {
            if (!this._statsWriter) {
                logger.warn(`StatsWriter is undefined, thus cannot create corresponded collectors`);
                return;
            }
            const consumerCollectorConfig: MediasoupConsumerCollectorConfig = {
                pollStats: this._config.pollConsumerStats,
                appendix: this._config.outboundRtpAppendix,
            };

            const consumerCollector = new MediasoupConsumerCollector(
                collectorsFacade,
                consumer,
                this._transport.id,
                this._internal,
                consumerCollectorConfig
            );
            consumerCollector.setStatsWriter(this._statsWriter);
            this._parent.add(consumerCollector);
        };
        this._transport.observer.on("newconsumer", result);
        return result;
    }

    private _createNewDataConsumerListener(collectorsFacade: Collectors) {
        const result: MediasoupNewDataConsumerListener = (consumer) => {
            if (!this._statsWriter) {
                logger.warn(`StatsWriter is undefined, thus cannot create corresponded collectors`);
                return;
            }
            const consumerCollectorConfig: MediasoupDataConsumerCollectorConfig = {
                pollStats: this._config.pollDataConsumerStats,
                appendix: this._config.sctpChannelAppendix,
            };

            const consumerCollector = new MediasoupDataConsumerCollector(
                collectorsFacade,
                consumer,
                this._transport.id,
                this._internal,
                consumerCollectorConfig
            );
            consumerCollector.setStatsWriter(this._statsWriter);
            this._parent.add(consumerCollector);
        };
        this._transport.observer.on("newdataconsumer", result);
        return result;
    }

    private async _collectWithoutStats(): Promise<void> {
        this._statsWriter?.updateTransport(
            {
                transportId: this._transport.id,
                internal: this._internal,
                noReport: true,
            },
            {}
        );
    }

    private _createCollectorsFacade(): Collectors {
        const collectors = this._parent;
        const isClosed = () => this._closed;
        return new (class implements Collectors {
            add(collector: Collector): boolean {
                return collectors.add(collector);
            }
            remove(collectorId: string): boolean {
                return collectors.remove(collectorId);
            }
            get closed(): boolean {
                return isClosed();
            }
            /* eslint-disable @typescript-eslint/no-explicit-any */
            [Symbol.iterator](): Iterator<Collector, any, undefined> {
                return collectors[Symbol.iterator]();
            }
        })();
    }

    public async collect(): Promise<void> {
        if (this._closed) {
            logger.warn(`Attempted to collect from a closed collector.`);
            return;
        }
        if (this._parent.closed) {
            // if the corresponded collector is closed we need to close ourselves too
            this.close();
            return;
        }
        if (!this._statsWriter) {
            logger.debug(`No StatsWriter added to (${this.id})`);
            return;
        }
        if (this._config.pollTransportStats === undefined || this._config.pollTransportStats() === false) {
            return await this._collectWithoutStats();
        }
        const transportId = this._transport.id;
        const polledStats = await this._transport.getStats();
        for (const msStats of polledStats) {
            let transportStats: SfuTransport | undefined;
            if (this._config.transportType === "webrtc-transport") {
                const stats = msStats as MediasoupWebRtcTransportStats;
                const {
                    localIp: localAddress,
                    protocol,
                    localPort,
                    remoteIp: remoteAddress,
                    remotePort,
                } = stats.iceSelectedTuple ?? {};
                transportStats = {
                    transportId,
                    noReport: false,
                    dtlsState: stats.dtlsState,
                    iceState: stats.iceState,
                    sctpState: stats.sctpState,
                    iceRole: stats.iceRole,
                    localAddress,
                    localPort,
                    protocol,
                    remoteAddress,
                    remotePort,
                    rtpBytesReceived: stats.rtpBytesReceived,
                    rtpBytesSent: stats.rtpBytesSent,
                    // rtpPacketsReceived: stats.rtpPacketsReceived,
                    // rtpPacketsSent: stats.rtpPacketsSent,
                    // rtpPacketsLost: stats.rtpPacketsLost,
                    rtxBytesReceived: stats.rtxBytesReceived,
                    rtxBytesSent: stats.rtxBytesSent,
                    // rtxPacketsReceived: stats.rtxPacketsReceived,
                    // rtxPacketsSent: stats.rtxPacketsSent,
                    // rtxPacketsLost: stats.rtxPacketsLost,
                    // rtxPacketsDiscarded: stats.rtxPacketsDiscarded,
                    // sctpBytesReceived: stats.sctpBytesReceived,
                    // sctpBytesSent: stats.sctpBytesSent,
                    // sctpPacketsReceived: stats.sctpPacketsReceived,
                    // sctpPacketsSent: stats.sctpPacketsSent,
                };
            } else if (this._config.transportType === "plain-rtp-transport") {
                const stats = msStats as MediasoupPlainTransport;
                const {
                    localIp: localAddress,
                    protocol,
                    localPort,
                    remoteIp: remoteAddress,
                    remotePort,
                } = stats.tuple ?? {};
                transportStats = {
                    transportId,
                    noReport: false,
                    localAddress,
                    localPort,
                    protocol,
                    remoteAddress,
                    remotePort,
                    rtpBytesReceived: stats.rtpBytesReceived,
                    rtpBytesSent: stats.rtpBytesSent,
                    rtxBytesReceived: stats.rtxBytesReceived,
                    rtxBytesSent: stats.rtxBytesSent,
                };
            } else if (this._config.transportType === "direct-transport") {
                const stats = msStats as MediasoupDirectTransport;
                transportStats = {
                    transportId,
                    noReport: false,
                    rtpBytesReceived: stats.rtpBytesReceived,
                    rtpBytesSent: stats.rtpBytesSent,
                    rtxBytesReceived: stats.rtxBytesReceived,
                    rtxBytesSent: stats.rtxBytesSent,
                };
            } else if (this._config.transportType === "pipe-transport") {
                const stats = msStats as MediasoupPipeTransport;
                const {
                    localIp: localAddress,
                    protocol,
                    localPort,
                    remoteIp: remoteAddress,
                    remotePort,
                } = stats.tuple ?? {};
                transportStats = {
                    internal: true,
                    noReport: false,
                    transportId,
                    localAddress,
                    localPort,
                    protocol,
                    remoteAddress,
                    remotePort,
                    rtpBytesReceived: stats.rtpBytesReceived,
                    rtpBytesSent: stats.rtpBytesSent,
                    rtxBytesReceived: stats.rtxBytesReceived,
                    rtxBytesSent: stats.rtxBytesSent,
                };
            }
            if (transportStats) {
                this._statsWriter?.updateTransport(transportStats, this._config.transportAppendix ?? {});
            }
        }
    }
    public get closed(): boolean {
        return this._closed;
    }

    public close(): void {
        if (this._closed) {
            logger.info(`Attempted to close twice`);
            return;
        }
        this._closed = true;
        this._parent.remove(this.id);
        this._transport.observer.removeListener("newconsumer", this._newConsumerListener);
        this._transport.observer.removeListener("newproducer", this._newProducerListener);
        this._transport.observer.removeListener("newdataconsumer", this._newDataConsumerListener);
        this._transport.observer.removeListener("newdataproducer", this._newDataProducerListener);
    }
}
