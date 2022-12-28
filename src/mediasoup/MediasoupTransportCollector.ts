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

const logger = createLogger(`MediasoupTransportCollector`);

export type MediasoupTransportCollectorConfig = {
    /**
     * Indicate if we want to poll the webrtc transport stats
     *
     * DEFAULT: false,
     */
    pollWebRtcTransportStats?: (transportId: string) => boolean;

    /**
     * Indicate if we want to poll the plain rtp transport stats
     *
     * DEFAULT: false,
     */
    pollPlainRtpTransportStats?: (transportId: string) => boolean;

    /**
     * Indicate if we want to poll the pipe transport stats
     *
     * DEFAULT: false,
     */
    pollPipeTransportStats?: (transportId: string) => boolean;

    /**
     * Indicate if we want to poll the direct transport stats
     *
     * DEFAULT: false,
     */
    pollDirectTransportStats?: (transportId: string) => boolean;

    /**
     * Indicate if we want to poll the producer stats
     *
     * DEFAULT: false,
     */
    pollProducerStats?: (producerId: string) => boolean;

    /**
     * Indicate if we want to poll the consumer stats
     *
     * DEFAULT: false,
     */
    pollConsumerStats?: (consumerId: string) => boolean;

    /**
     * Indicate if we want to poll the dataProducer stats
     *
     * DEFAULT: false,
     */
    pollDataProducerStats?: (dataProducerId: string) => boolean;

    /**
     * Indicate if we want to poll the data consumer stats
     *
     * DEFAULT: false,
     */
    pollDataConsumerStats?: (dataConsumerId: string) => boolean;

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
        this._internal = this._config.transportType === "pipe-transport" || this._config.transportType === "PipeTransport";

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

    public get hasStatsWriter(): boolean {
        return !!this._statsWriter;
    }

    public setStatsWriter(value: StatsWriter | null) {
        if (this._statsWriter && value !== null) {
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
            const dataProducerCollectorConfig: MediasoupDataProducerCollectorConfig = {
                pollStats: this._config.pollDataProducerStats,
                appendix: this._config.sctpChannelAppendix,
            };

            const dataProducerCollector = new MediasoupDataProducerCollector(
                collectorsFacade,
                producer,
                this._transport.id,
                this._internal,
                dataProducerCollectorConfig
            );
            if (!dataProducerCollector.hasStatsWriter) {
                dataProducerCollector.setStatsWriter(this._statsWriter);
            }
            this._parent.add(dataProducerCollector);
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
            if (!producerCollector.hasStatsWriter) {
                producerCollector.setStatsWriter(this._statsWriter);
            }
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
            if (!consumerCollector.hasStatsWriter) {
                consumerCollector.setStatsWriter(this._statsWriter);
            }
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
            const dataConsumerCollectorConfig: MediasoupDataConsumerCollectorConfig = {
                pollStats: this._config.pollDataConsumerStats,
                appendix: this._config.sctpChannelAppendix,
            };

            const dataConsumerCollector = new MediasoupDataConsumerCollector(
                collectorsFacade,
                consumer,
                this._transport.id,
                this._internal,
                dataConsumerCollectorConfig
            );
            if (!dataConsumerCollector.hasStatsWriter) {
                dataConsumerCollector.setStatsWriter(this._statsWriter);
            }
            this._parent.add(dataConsumerCollector);
        };
        this._transport.observer.on("newdataconsumer", result);
        return result;
    }

    private _collectWithoutStats(): void {
        this._statsWriter?.updateTransport(
            {
                transportId: this._transport.id,
                internal: this._internal,
                noReport: true,
            },
            this._config.transportAppendix ?? {}
        );
    }

    private _createCollectorsFacade(): Collectors {
        const collectors = this._parent;
        /* eslint-disable @typescript-eslint/no-this-alias */
        const collector = this;
        return new (class implements Collectors {
            add(collector: Collector): boolean {
                return collectors.add(collector);
            }
            remove(collectorId: string): boolean {
                return collectors.remove(collectorId);
            }
            get closed(): boolean {
                return collector._closed;
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
            logger.warn(`No StatsWriter added to (${this.id})`);
            return;
        }
        switch (this._config.transportType) {
            case "WebRtcTransport":
            case "webrtc-transport":
                await this._collectFromWebRtcTransport();
                break;
            case "PipeTransport":
            case "pipe-transport":
                await this._collectFromPipeTransport();
                break;
            case "PlainTransport":
            case "plain-rtp-transport":
                await this._collectFromPlainRtpTransport();
                break;
            case "DirectTransport":
            case "direct-transport":
                await this._collectFromDirectTransport();
                break;
        }
    }

    private async _collectFromWebRtcTransport() {
        if (this._config.pollWebRtcTransportStats === undefined || this._config.pollWebRtcTransportStats(this._transport.id) === false) {
            this._collectWithoutStats();
            return;
        }
        const transportId = this._transport.id;
        const polledStats = await this._transport.getStats();
        if (polledStats.length < 1) {
            this._collectWithoutStats();
            return;
        }
        for (const msStats of polledStats) {
            const stats = msStats as MediasoupWebRtcTransportStats;
            const {
                localIp: localAddress,
                protocol,
                localPort,
                remoteIp: remoteAddress,
                remotePort,
            } = stats.iceSelectedTuple ?? {};
            const transportStats: SfuTransport = {
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
            this._statsWriter?.updateTransport(transportStats, this._config.transportAppendix ?? {});
        }
    }

    private async _collectFromDirectTransport() {
        if (this._config.pollDirectTransportStats === undefined || this._config.pollDirectTransportStats(this._transport.id) === false) {
            this._collectWithoutStats();
            return;
        }
        const transportId = this._transport.id;
        const polledStats = await this._transport.getStats();
        if (polledStats.length < 1) {
            this._collectWithoutStats();
            return;
        }
        for (const msStats of polledStats) {
            const stats = msStats as MediasoupDirectTransport;
            const transportStats: SfuTransport = {
                transportId,
                noReport: false,
                rtpBytesReceived: stats.rtpBytesReceived,
                rtpBytesSent: stats.rtpBytesSent,
                rtxBytesReceived: stats.rtxBytesReceived,
                rtxBytesSent: stats.rtxBytesSent,
            };
            this._statsWriter?.updateTransport(transportStats, this._config.transportAppendix ?? {});
        }
    }

    private async _collectFromPipeTransport() {
        if (this._config.pollPipeTransportStats === undefined || this._config.pollPipeTransportStats(this._transport.id) === false) {
            this._collectWithoutStats();
            return;
        }
        const transportId = this._transport.id;
        const polledStats = await this._transport.getStats();
        if (polledStats.length < 1) {
            this._collectWithoutStats();
            return;
        }
        for (const msStats of polledStats) {
            const stats = msStats as MediasoupPipeTransport;
            const {
                localIp: localAddress,
                protocol,
                localPort,
                remoteIp: remoteAddress,
                remotePort,
            } = stats.tuple ?? {};
            const transportStats: SfuTransport = {
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
            this._statsWriter?.updateTransport(transportStats, this._config.transportAppendix ?? {});
        }
    }

    private async _collectFromPlainRtpTransport() {
        if (this._config.pollPlainRtpTransportStats === undefined || this._config.pollPlainRtpTransportStats(this._transport.id) === false) {
            this._collectWithoutStats();
            return;
        }
        const transportId = this._transport.id;
        const polledStats = await this._transport.getStats();
        if (polledStats.length < 1) {
            this._collectWithoutStats();
            return;
        }
        for (const msStats of polledStats) {
            const stats = msStats as MediasoupPlainTransport;
            const {
                localIp: localAddress,
                protocol,
                localPort,
                remoteIp: remoteAddress,
                remotePort,
            } = stats.tuple ?? {};
            const transportStats = {
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
            this._statsWriter?.updateTransport(transportStats, this._config.transportAppendix ?? {});
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
        this._statsWriter?.removeTransport(this._transport.id);
        this._transport.observer.removeListener("newconsumer", this._newConsumerListener);
        this._transport.observer.removeListener("newproducer", this._newProducerListener);
        this._transport.observer.removeListener("newdataconsumer", this._newDataConsumerListener);
        this._transport.observer.removeListener("newdataproducer", this._newDataProducerListener);
    }
}
