import { StatsWriter } from "../entries/StatsStorage";
import { PromiseFetcher, PromiseSupplier } from "../utils/PromiseFetcher";
import { Collector } from "../Collector";
import { MediasoupConsumer, MediasoupConsumerPolledStats, MediasoupDataConsumer, MediasoupDataConsumerStats, MediasoupDataProducer, MediasoupDataProducerStats, MediasoupDirectTransport, MediasoupNewConsumerListener, MediasoupNewDataConsumerListener, MediasoupNewDataProducerListener, MediasoupNewProducerListener, MediasoupPipeTransport, MediasoupPlainTransport, MediasoupProducer, MediasoupProducerStats, MediasoupTransport, MediasoupTransportStats, MediasoupTransportType, MediasoupWebRtcTransportStats } from "./MediasoupTypes";
import { SfuInboundRtpPad, SfuOutboundRtpPad, SfuSctpChannel, SfuTransport } from "@observertc/schemas";
import { v4 as uuidv4 } from "uuid";
import { createLogger } from "../utils/logger";
import { AppData } from "../entries/StatsEntryInterfaces";

const logger = createLogger(`MediasoupCollector`);

export type MediasoupCollectorConfig = {
    /**
     * The custom provided id for the collector
     * If this is not given than the collector generates a random UUID.
     */
    id?: string;
    /**
     * Limits the number of stats pulled at once. When you have 100 inbound rtp and 1000 outbound rtp pad,
     * and the batchSize is 50, then the collector poll 50,50 stats for inbound rtp and then 50, 50, ...
     * for the outbound rtp.
     */
    batchSize?: number;
}

const supplyDefaultConfig = () => {
    const result: MediasoupCollectorConfig = {
        batchSize: 0,
    }
    return result;
}

export type MediasoupTransportWatchConfig = {
    /**
     * Flag indicate if the collector poll the getStats endpoint for
     * the transport and all of its producers, consumers.
     * 
     * DEFAULT: false,
     */
    pollStats?: boolean;

    /**
     * Indicate if we want to poll the transport stats
     * 
     * DEFAULT: false,
     */
    pollTransportStats?: boolean | number;

    /**
     * Indicate if we want to poll the producer stats
     * 
     * DEFAULT: false,
     */
    pollProducerStats?: boolean;

    /**
     * Indicate if we want to poll the consumer stats
     * 
     * DEFAULT: false,
     */
    pollConsumerStats?: boolean;

    /**
     * Indicate if we want to poll the dataProducer stats
     * 
     * DEFAULT: false,
     */
    pollDataProducerStats?: boolean;

    /**
     * Indicate if we want to poll the data consumer stats
     * 
     * DEFAULT: false,
     */
    pollDataConsumerStats?: boolean;

    /**
     * Add custom arbitrary data to the transport entries
     * in the StatsStorage can be accessed via StatsReader
     */
    customTransportData?: AppData;

     /**
     * Add custom arbitrary data to the inbound rtp pad entries
     * in the StatsStorage can be accessed via StatsReader
     */
    customInboundRtpData?: AppData;

    /**
     * Add custom arbitrary data to the outbound rtp pad entries
     * in the StatsStorage can be accessed via StatsReader
     */
    customOutboundRtpData?: AppData;

    /**
     * Add custom arbitrary data to the sctp channel entries
     * in the StatsStorage can be accessed via StatsReader
     */
    customSctpChannelData?: AppData;
}

const provideDefaultWatchConfig = () => {
    const result: MediasoupTransportWatchConfig = {
        pollStats: false,
        pollTransportStats: false,
        pollProducerStats: false,
        pollConsumerStats: false,
        pollDataProducerStats: false,
        pollDataConsumerStats: false,
    };
    return result;
} 

type GetStats<Stats, Types> = {
    // id: string;
    transportId: string;
    // remoteId?: string;
    // padIds?: Map<number, string>,
    // mediaType?: "audio" | "video";
    type: Types;
    polledStats?: Stats[];
    customData?: AppData;
}

type StatsSupplier<GetStats> = {
    // transportId: string,
    getStats: PromiseSupplier<GetStats>;
    dispose: () => void;
}

type TransportGetStats = GetStats<MediasoupTransportStats, MediasoupTransportType>;
type TransportStatsSupplier = StatsSupplier<TransportGetStats> & {
    activeConsumerIds: Set<string>,
    activeProducerIds: Set<string>,
    activeDataProducerIds: Set<string>,
    activeDataConsumerIds: Set<string>,
};
type ProducerGetStats = GetStats<MediasoupProducerStats, "inbound-rtp"> & {
    producerId: string,
    padIds: Map<number, string>,
    mediaType?: "audio" | "video",
};
type ProducerStatsSupplier = StatsSupplier<ProducerGetStats>;
type ConsumerGetStats = GetStats<MediasoupConsumerPolledStats, "inbound-rtp" | "outbound-rtp"> & {
    producerId: string,
    consumerId: string,
    padIds: Map<number, string>,
    mediaType?: "audio" | "video",
    customData?: AppData,
};
type ConsumerStatsSupplier = StatsSupplier<ConsumerGetStats>;
type DataProducerGetStats = GetStats<MediasoupDataProducerStats, "data-producer"> & {
    dataProducerId: string,
};
type DataProducerStatsSupplier = StatsSupplier<DataProducerGetStats>;
type DataConsumerGetStats = GetStats<MediasoupDataConsumerStats, "data-consumer"> & {
    dataConsumerId: string,
    dataProducerId: string,
};
type DataConsumerStatsSupplier = StatsSupplier<DataConsumerGetStats>;

const NO_REPORT_SSRC = 0xDEADBEEF;

export class MediasoupCollector implements Collector {
    public static create(config?: MediasoupCollectorConfig): MediasoupCollector {
        const appliedConfig = Object.assign(supplyDefaultConfig(), config);
        const collector = new MediasoupCollector(appliedConfig);
        return collector;
    }

    public readonly id: string;
    private _closed = false;
    private _config: MediasoupCollectorConfig;
    private _statsWriter?: StatsWriter;
    private _transports: Map<string, TransportStatsSupplier> = new Map();
    private _producers: Map<string, ProducerStatsSupplier> = new Map();
    private _consumers: Map<string, ConsumerStatsSupplier> = new Map();
    private _dataProducers: Map<string, DataProducerStatsSupplier> = new Map();
    private _dataConsumers: Map<string, DataConsumerStatsSupplier> = new Map();
    private constructor(config: MediasoupCollectorConfig) {
        this._config = config;
        this.id = this._config.id ?? uuidv4();
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

    public async collect(): Promise<void> {
        if (!this._statsWriter) {
            logger.debug(`No StatsWriter added to (${this.id})`)
        }
        await this._collectDataConsumers();
        await this._collectDataProducers();
        await this._collectConsumers();
        await this._collectProducers();
        await this._collectTransports();
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
        const transports = Array.from(this._transports.values());
        for (const { dispose } of transports) {
            dispose();
        }
    }

    public watchWebRtcTransport(transport: MediasoupTransport, config?: MediasoupTransportWatchConfig) {
        if (this._closed) {
            throw new Error(`Attempted to watch WebRTC transport on an already closed`);
        }
        this._watchTransport(transport, "webrtc-transport", config);
    }

    public watchPipeTransport(transport: MediasoupTransport, config?: MediasoupTransportWatchConfig) {
        if (this._closed) {
            throw new Error(`Attempted to watch pipe transport on an already closed`);
        }
        this._watchTransport(transport, "pipe-transport", config);
    }

    public watchDirectTransport(transport: MediasoupTransport, config?: MediasoupTransportWatchConfig) {
        if (this._closed) {
            throw new Error(`Attempted to watch direct transport on an already closed`);
        }
        this._watchTransport(transport, "direct-transport", config);
    }

    public watchPlainRtpTransport(transport: MediasoupTransport, config?: MediasoupTransportWatchConfig) {
        if (this._closed) {
            throw new Error(`Attempted to watch direct transport on an already closed`);
        }
        this._watchTransport(transport, "plain-rtp-transport", config);
    }

    private _watchTransport(transport: MediasoupTransport, type: MediasoupTransportType, config?: MediasoupTransportWatchConfig) {
        const transportId = transport.id;
        if (this._transports.has(transportId)) {
            logger.warn(`Transport (${transportId}) has already been watched`);
            return;
        }
        const appliedConfig = Object.assign(provideDefaultWatchConfig(), config);
        const { 
            pollStats,
            pollTransportStats,
            pollProducerStats,
            pollConsumerStats,
            pollDataProducerStats,
            pollDataConsumerStats,
            customInboundRtpData,
            customOutboundRtpData,
            customSctpChannelData,
            customTransportData,
         } = appliedConfig;

        // Observe Producers
        const activeProducerIds = new Set<string>();
        const newProducerListener: MediasoupNewProducerListener = (producer: MediasoupProducer) => {
            const producerId = producer.id;
            activeProducerIds.add(producerId);
            const padIds = new Map<number, string>();
            const getStats = async () => {
                const poll = !producer?.paused && (pollStats || pollProducerStats);
                const polledStats = poll ? await producer.getStats() : undefined;
                const result: ProducerGetStats = {
                    producerId,
                    transportId,
                    padIds,
                    mediaType: producer.kind,
                    type: "inbound-rtp",
                    polledStats,
                    customData: customTransportData,
                }
                return result;
            }
            const dispose = () => {
                this._producers.delete(producerId);
                activeProducerIds.delete(producerId);
                for (const padId of padIds.values()) {
                    this._statsWriter?.removeInboundRtpPad(padId);
                }
                logger.debug(`Producer ${producerId} on transport ${transportId} is removed from the observer`);
            }
            this._producers.set(producerId, {
                getStats,
                dispose,
            });
            logger.debug(`Producer ${producerId} on transport ${transportId} is added to the observer`);
            producer.observer.once("close", () => {
                dispose();
            });
        }
        transport.observer.on("newproducer", newProducerListener);

        // Observe Consumers
        const activeConsumerIds = new Set<string>();
        const newConsumerListener: MediasoupNewConsumerListener = (consumer: MediasoupConsumer) => {
            const consumerId = consumer.id;
            activeConsumerIds.add(consumerId);
            const padIds = new Map<number, string>();
            const getStats = async () => {
                const poll = !consumer?.paused && (pollStats || pollConsumerStats);
                const polledStats = poll ? await consumer.getStats() : undefined;
                const result: ConsumerGetStats = {
                    consumerId,
                    transportId,
                    producerId: consumer.producerId,
                    padIds,
                    mediaType: consumer.kind,
                    type: "outbound-rtp",
                    polledStats,
                    customData: customOutboundRtpData,
                };
                return result;
            }
            const dispose = () => {
                this._consumers.delete(consumerId);
                activeConsumerIds.delete(consumerId);
                for (const padId of padIds.values()) {
                    this._statsWriter?.removeOutboundRtpPad(padId);
                }
                logger.debug(`Consumer ${consumerId} on transport ${transportId} is removed from the observer`);
            }
            this._consumers.set(consumerId, {
                getStats,
                dispose,
            });
            logger.debug(`Consumer ${consumerId} on transport ${transportId} is added to the observer`);
            consumer.observer.once("close", () => {
                dispose();
            });
        }
        transport.observer.on("newconsumer", newConsumerListener);

        // Observe DataProducers
        const activeDataProducerIds = new Set<string>();
        const newDataProducerListener: MediasoupNewDataProducerListener = (dataProducer: MediasoupDataProducer) => {
            const dataProducerId = dataProducer.id;
            activeDataProducerIds.add(dataProducerId);
            const getStats = async () => {
                const polledStats = pollStats || pollDataProducerStats ? await dataProducer.getStats() : undefined;
                const result: DataProducerGetStats = {
                    dataProducerId,
                    transportId,
                    type: "data-producer",
                    polledStats,
                    customData: customSctpChannelData,
                };
                return result;
            }
            const dispose = () => {
                this._dataProducers.delete(dataProducerId);
                activeDataProducerIds.delete(dataProducerId);
                this._statsWriter?.removeSctpChannel(dataProducerId);
                logger.debug(`DataProducer ${dataProducerId} on transport ${transportId} is removed from the observer`);
            }
            this._dataProducers.set(dataProducerId, {
                getStats,
                dispose,
            });
            logger.debug(`DataProducer ${dataProducerId} on transport ${transportId} is added to the observer`);
            dataProducer.observer.once("close", () => {
                dispose();
            });
        }
        transport.observer.on("newdataproducer", newDataProducerListener);

        // Observe DataConsumers
        const activeDataConsumerIds = new Set<string>();
        const newDataConsumerListener: MediasoupNewDataConsumerListener = (dataConsumer: MediasoupDataConsumer) => {
            const dataConsumerId = dataConsumer.id;
            activeDataConsumerIds.add(dataConsumerId);
            const getStats = async () => {
                const polledStats = pollStats || pollDataConsumerStats ? await dataConsumer.getStats() : undefined;
                const result: DataConsumerGetStats = {
                    dataConsumerId,
                    transportId,
                    dataProducerId: dataConsumer.dataProducerId,
                    type: "data-consumer",
                    polledStats,
                    customData: customSctpChannelData,
                };
                return result;
            }
            const dispose = () => {
                this._dataConsumers.delete(dataConsumerId);
                activeDataConsumerIds.delete(dataConsumerId);
                this._statsWriter?.removeSctpChannel(dataConsumerId);
                logger.debug(`DataConsumer ${dataConsumerId} on transport ${transportId} is removed from the observer`);
            }
            this._dataConsumers.set(dataConsumerId, {
                getStats,
                dispose,
            });
            logger.debug(`DataConsumer ${dataConsumerId} on transport ${transportId} is added to the observer`);
            dataConsumer.observer.once("close", () => {
                dispose();
            });
        }
        transport.observer.on("newdataconsumer", newDataConsumerListener);
        let numberOfPolling = 0;
        const getStats = async () => {
            let polling = pollStats || pollTransportStats === true;
            if (!polling && pollTransportStats && Number.isInteger(pollTransportStats)) {
                if (numberOfPolling++ < pollTransportStats) {
                    polling = true;
                }
            }
            const polledStats = polling ? await transport.getStats() : undefined;
            return {
                id: transportId,
                transportId,
                type,
                polledStats,
                customData: customTransportData,
            }
        }
        let listenersRemoved = false;
        const dispose = () => {
            if (!listenersRemoved) {
                transport.observer.removeListener("newproducer", newProducerListener);
                transport.observer.removeListener("newconsumer", newConsumerListener);
                transport.observer.removeListener("newdataproducer", newDataProducerListener);
                transport.observer.removeListener("newdataconsumer", newDataConsumerListener);
                listenersRemoved = true;
            }
            const producerIds = Array.from(activeProducerIds);
            for (const producerId of producerIds) {
                const producer = this._producers.get(producerId);
                if (!producer) continue;
                producer.dispose();
            }
            const consumerIds = Array.from(activeConsumerIds);
            for (const consumerId of consumerIds) {
                const consumer = this._consumers.get(consumerId);
                if (!consumer) continue;
                consumer.dispose();
            }
            const dataProducerIds = Array.from(activeDataProducerIds);
            for (const dataProducerId of dataProducerIds) {
                const dataProducer = this._dataProducers.get(dataProducerId);
                if (!dataProducer) continue;
                dataProducer.dispose();
            }
            const dataConsumerIds = Array.from(activeDataConsumerIds);
            for (const dataConsumerId of dataConsumerIds) {
                const dataConsumer = this._dataConsumers.get(dataConsumerId);
                if (!dataConsumer) continue;
                dataConsumer.dispose();
            }
            this._transports.delete(transportId);
            this._statsWriter?.removeTransport(transportId);
            logger.debug(`Transport ${transportId} is removed from the observer`);
        }
        this._transports.set(transportId, {
            getStats,
            dispose,
            activeProducerIds,
            activeConsumerIds,
            activeDataProducerIds,
            activeDataConsumerIds,
        });
        logger.debug(`Transport ${transportId} is added to the observer`);
        transport.observer.once("close", () => {
            dispose();
        });
    }

    private async _collectTransports(): Promise<void> {
        if (this._transports.size < 1) return;
        const batchSize = this._config.batchSize ?? 0;
        const suppliers = Array.from(this._transports.values());
        const fetcher = PromiseFetcher.builder<TransportGetStats>()
            .withBatchSize(batchSize)
            .withPace(10, 500)
            .withPromiseSuppliers(...suppliers.map(supplier => supplier.getStats))
            .onCatchedError((err, index) => {
                if (suppliers.length <= index) return;
                const supplier = suppliers[index];
                const { dispose } = supplier;
                logger.warn(`Transport Stats collector reported an error. It is not polled again`, err);
                dispose();
            })
            .build();
        for await (const msGetStatsResult of fetcher.values()) {
            if (!msGetStatsResult) continue;
            const { transportId, type, polledStats, customData } = msGetStatsResult;
            // if transport has been removed meanwhile stats was polled, then we do not forward it
            if (!this._transports.has(transportId)) continue;
            if (!polledStats) {
                this._statsWriter?.updateTransport({
                    transportId,
                    internal: type === "pipe-transport",
                    noReport: true,
                }, customData);
                continue;
            }
            for (const msStats of polledStats) {
                let transportStats: SfuTransport | undefined;
                if (type === "webrtc-transport") {
                    const stats = msStats as MediasoupWebRtcTransportStats;
                    const { localIp: localAddress, protocol, localPort, remoteIp: remoteAddress, remotePort } = stats.iceSelectedTuple ?? {};
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
                    }
                } else if (type === "plain-rtp-transport") {
                    const stats = msStats as MediasoupPlainTransport;
                    const { localIp: localAddress, protocol, localPort, remoteIp: remoteAddress, remotePort } = stats.tuple ?? {};
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
                    }
                } else if (type === "direct-transport") {
                    const stats = msStats as MediasoupDirectTransport;
                    transportStats = {
                        transportId,
                        noReport: false,
                        rtpBytesReceived: stats.rtpBytesReceived,
                        rtpBytesSent: stats.rtpBytesSent,
                        rtxBytesReceived: stats.rtxBytesReceived,
                        rtxBytesSent: stats.rtxBytesSent,
                    }
                } else if (type === "pipe-transport") {
                    const stats = msStats as MediasoupPipeTransport;
                    const { localIp: localAddress, protocol, localPort, remoteIp: remoteAddress, remotePort } = stats.tuple ?? {};
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
                    }
                } 
                if (transportStats) {
                    this._statsWriter?.updateTransport(transportStats, customData);
                }
            }
        }
    }

    private async _collectProducers(): Promise<void> {
        if (this._producers.size < 1) return;
        const batchSize = this._config.batchSize ?? 0;
        const suppliers = Array.from(this._producers.values());
        const fetcher = PromiseFetcher.builder<ProducerGetStats>()
            .withBatchSize(batchSize)
            .withPromiseSuppliers(...suppliers.map(supplier => supplier.getStats))
            .withPace(10, 500)
            .onCatchedError((err, index) => {
                if (suppliers.length <= index) return;
                const supplier = suppliers[index];
                const { dispose } = supplier;
                logger.warn(`Producer Stats collector reported an error. It is not polled again`, err);
                dispose();
            })
            .build();
        for await (const msGetStatsResult of fetcher.values()) {
            if (!msGetStatsResult) continue;
            const { producerId, padIds, mediaType, transportId, polledStats, customData } = msGetStatsResult;
            // if producer has been removed meanwhile stats was polled, then we do not forward it
            const producer = this._producers.get(producerId);
            if (!producer) continue;
            if (!padIds) {
                logger.debug(`Cannot find ssrc - pad mappings for producer: ${producerId}`);
                continue;
            }
            if (!polledStats) {
                let padId = padIds.get(NO_REPORT_SSRC);
                if (!padId) {
                    padId = uuidv4();
                    padIds.set(NO_REPORT_SSRC, padId);
                }
                this._statsWriter?.updateInboundRtpPad({
                    ssrc: NO_REPORT_SSRC,
                    padId,
                    streamId: producerId,
                    mediaType,
                    transportId,
                    noReport: true,
                }, customData);
                continue;
            }
            for (const stats of polledStats) {
                const ssrc = stats.ssrc;
                // if (type === msStats.type) continue;
                let padId = padIds.get(ssrc);
                if (!padId) {
                    padId = uuidv4();
                    padIds.set(ssrc, padId);
                }
                const inboundRtpPadStats: SfuInboundRtpPad = {
                    transportId,
                    noReport: false,
                    streamId: producerId,
                    padId,
                    ssrc,
                    mediaType,
                    // payloadType: stats.payloadType,
                    mimeType: stats.mimeType,
                    // clockRate: stats.clockRate,
                    sdpFmtpLine: stats.mimeType,
                    rid: stats.mimeType,
                    rtxSsrc: stats.rtxSsrc,
                    // targetBitrate: stats.targetBitrate,
                    // voiceActivityFlag: stats.voiceActivityFlag,
                    firCount: stats.firCount,
                    pliCount: stats.pliCount,
                    nackCount: stats.nackCount,
                    // sliCount: stats.sliCount,
                    packetsLost: stats.packetsLost,
                    packetsReceived: stats.packetCount,
                    packetsDiscarded: stats.packetsDiscarded,
                    packetsRepaired: stats.packetsRepaired,
                    // packetsFailedDecryption: stats.packetsFailedDecryption,
                    // packetsDuplicated: stats.packetsDuplicated,
                    // fecPacketsReceived: stats.fecPacketsReceived,
                    // fecPacketsDiscarded: stats.fecPacketsDiscarded,
                    bytesReceived: stats.byteCount,
                    // rtcpSrReceived: stats.rtcpSrReceived,
                    // rtcpRrSent: stats.rtcpRrSent,
                    // rtxPacketsReceived: stats.rtxPacketsReceived,
                    rtxPacketsDiscarded: stats.rtxPacketsDiscarded,
                    fractionLost: stats.fractionLost,
                    jitter: stats.jitter,
                    roundTripTime: stats.roundTripTime,
                }
                this._statsWriter?.updateInboundRtpPad(inboundRtpPadStats, customData);
            }
        }
    }

    private async _collectConsumers(): Promise<void> {
        if (this._consumers.size < 1) return;
        const batchSize = this._config.batchSize ?? 0;
        const suppliers = Array.from(this._consumers.values());
        const fetcher = PromiseFetcher.builder<ConsumerGetStats>()
            .withBatchSize(batchSize)
            .withPace(10, 500)
            .withPromiseSuppliers(...suppliers.map(supplier => supplier.getStats))
            .onCatchedError((err, index) => {
                if (suppliers.length <= index) return;
                const supplier = suppliers[index];
                const { dispose } = supplier;
                logger.warn(`Consumer Stats collector reported an error. It is not polled again`, err);
                dispose();
            })
            .build();
        for await (const msGetStatsResult of fetcher.values()) {
            if (!msGetStatsResult) continue;
            const { consumerId, producerId, padIds, mediaType, transportId, polledStats, customData } = msGetStatsResult;
            // if producer has been removed meanwhile stats was polled, then we do not forward it
            const consumer = this._consumers.get(consumerId);
            if (!consumer) continue;
            if (!padIds) {
                logger.debug(`Cannot find ssrc - pad mappings for consumer: ${consumerId}`);
                continue;
            }
            if (!polledStats) {
                let padId = padIds.get(NO_REPORT_SSRC);
                if (!padId) {
                    padId = uuidv4();
                    padIds.set(NO_REPORT_SSRC, padId);
                }
                this._statsWriter?.updateOutboundRtpPad({
                    ssrc: NO_REPORT_SSRC,
                    padId,
                    streamId: producerId,
                    sinkId: consumerId,
                    mediaType,
                    transportId,
                    noReport: true,
                }, customData);
                continue;
            }
            for (const stats of polledStats) {
                const ssrc = stats.ssrc;
                if ("outbound-rtp" !== stats.type) continue;
                let padId = padIds.get(ssrc);
                if (!padId) {
                    padId = uuidv4();
                    padIds.set(ssrc, padId);
                }
                const outboundRtpPadStats: SfuOutboundRtpPad = {
                    transportId,
                    noReport: false,
                    streamId: producerId,
                    sinkId: consumerId,
                    padId,
                    ssrc: stats.ssrc,
                    mediaType,
                    // payloadType: stats.payloadType,
                    mimeType: stats.mimeType,
                    // clockRate: stats.clockRate,
                    // sdpFmtpLine: stats.sdpFmtpLine,
                    // rid: stats.rid,
                    rtxSsrc: stats.rtxSsrc,
                    // targetBitrate: stats.targetBitrate,
                    // voiceActivityFlag: stats.voiceActivityFlag,
                    firCount: stats.firCount,
                    pliCount: stats.pliCount,
                    nackCount: stats.nackCount,
                    // sliCount: stats.sliCount,
                    packetsLost: stats.packetsLost,
                    packetsSent: stats.packetCount,
                    packetsDiscarded: stats.packetsDiscarded,
                    packetsRetransmitted: stats.packetsRetransmitted,
                    // packetsFailedEncryption: stats.packetsFailedEncryption,
                    // packetsDuplicated: stats.packetsDuplicated,
                    // fecPacketsSent: stats.fecPacketsSent,
                    // fecPacketsDiscarded: stats.fecPacketsDiscarded,
                    bytesSent: stats.byteCount,
                    // rtcpSrSent: stats.rtcpSrSent,
                    // rtcpRrReceived: stats.rtcpRrReceived,
                    // rtxPacketsSent: stats.rtxPacketsSent,
                    // rtxPacketsDiscarded: stats.rtxPacketsDiscarded,
                    // framesSent: stats.framesSent,
                    // framesEncoded: stats.framesEncoded,
                    // keyFramesEncoded: stats.keyFramesEncoded,
                    fractionLost: stats.fractionLost,
                    // jitter: stats.jitter,
                    roundTripTime: stats.roundTripTime,
                }
                this._statsWriter?.updateOutboundRtpPad(outboundRtpPadStats, customData);
            }
        }
    }

    private async _collectDataProducers(): Promise<void> {
        if (this._dataProducers.size < 1) return;
        const batchSize = this._config.batchSize ?? 0;
        const suppliers = Array.from(this._dataProducers.values());
        const fetcher = PromiseFetcher.builder<DataProducerGetStats>()
            .withBatchSize(batchSize)
            .withPace(10, 500)
            .withPromiseSuppliers(...suppliers.map(supplier => supplier.getStats))
            .onCatchedError((err, index) => {
                if (suppliers.length <= index) return;
                const supplier = suppliers[index];
                const { dispose } = supplier;
                logger.warn(`DataProducer Stats collector reported an error. It is not polled again`, err);
                dispose();
            })
            .build();
        for await (const msGetStatsResult of fetcher.values()) {
            if (!msGetStatsResult) continue;
            const { dataProducerId, transportId, polledStats, customData } = msGetStatsResult;
            // if producer has been removed meanwhile stats was polled, then we do not forward it
            const dataProducer = this._dataProducers.get(dataProducerId);
            if (!dataProducer) continue;
            if (!polledStats) {
                this._statsWriter?.updateSctpChannel({
                    transportId,
                    streamId: dataProducerId,
                    channelId: dataProducerId,
                    noReport: true,
                }, customData);
                continue;
            }
            for (const stats of polledStats) {
                const sctpChannel: SfuSctpChannel = {
                    transportId,
                    noReport: false,
                    streamId: dataProducerId,
                    channelId: dataProducerId,
                    label: stats.label,
                    protocol: stats.protocol,
                    // sctpSmoothedRoundTripTime: stats.sctpSmoothedRoundTripTime,
                    // sctpCongestionWindow: stats.sctpCongestionWindow,
                    // sctpReceiverWindow: stats.sctpReceiverWindow,
                    // sctpMtu: stats.sctpMtu,
                    // sctpUnackData: stats.sctpUnackData,
                    messageReceived: stats.messagesReceived,
                    // messageSent: stats.messageSent,
                    bytesReceived: stats.bytesReceived,
                    // bytesSent: stats.bytesSent,
                };
                this._statsWriter?.updateSctpChannel(sctpChannel, customData);
            }
        }
    }

    private async _collectDataConsumers(): Promise<void> {
        if (this._dataConsumers.size < 1) return;
        const batchSize = this._config.batchSize ?? 0;
        const suppliers = Array.from(this._dataConsumers.values());
        const fetcher = PromiseFetcher.builder<DataConsumerGetStats>()
            .withBatchSize(batchSize)
            .withPace(10, 500)
            .withPromiseSuppliers(...suppliers.map(supplier => supplier.getStats))
            .onCatchedError((err, index) => {
                if (suppliers.length <= index) return;
                const supplier = suppliers[index];
                const { dispose } = supplier;
                logger.warn(`DataConsumer Stats collector reported an error. It is not polled again`, err);
                dispose();
            })
            .build();
        for await (const msGetStatsResult of fetcher.values()) {
            if (!msGetStatsResult) continue;
            const { dataProducerId, dataConsumerId, transportId, polledStats, customData } = msGetStatsResult;
            // if producer has been removed meanwhile stats was polled, then we do not forward it
            const dataConsumer = this._dataConsumers.get(dataConsumerId);
            if (!dataConsumer) continue;
            if (!polledStats) {
                this._statsWriter?.updateSctpChannel({
                    transportId,
                    streamId: dataProducerId,
                    channelId: dataConsumerId,
                    noReport: true,
                }, customData);
                continue;
            }
            for (const stats of polledStats) {
                const sctpChannel: SfuSctpChannel = {
                    transportId,
                    noReport: false,
                    streamId: dataProducerId,
                    channelId: dataConsumerId,
                    label: stats.label,
                    protocol: stats.protocol,
                    // sctpSmoothedRoundTripTime: stats.sctpSmoothedRoundTripTime,
                    // sctpCongestionWindow: stats.sctpCongestionWindow,
                    // sctpReceiverWindow: stats.sctpReceiverWindow,
                    // sctpMtu: stats.sctpMtu,
                    // sctpUnackData: stats.sctpUnackData,
                    // messageReceived: stats.messagesReceived,
                    messageSent: stats.messagesSent,
                    // bytesReceived: stats.bytesReceived,
                    bytesSent: stats.bytesSent,
                };
                this._statsWriter?.updateSctpChannel(sctpChannel, customData);
            }
        }
    }
}