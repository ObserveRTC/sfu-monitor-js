import { StatsWriter } from "../entries/StatsStorage";
import { Collector } from "../Collector";
import { SfuSctpChannel } from "@observertc/schemas";
import { v4 as uuidv4 } from "uuid";
import { createLogger } from "../utils/logger";
import { Collectors } from "../Collectors";
import { MediasoupDataProducer } from "./MediasoupTypes";
import { Appendix } from "../entries/StatsEntryInterfaces";

const logger = createLogger(`MediasoupCollector`);

export type MediasoupDataProducerCollectorConfig = {
    /**
     * a supplier lambda function provides information if the collector should poll stas or not
     *
     * DEFAULT: undefined, which means it will not poll measurements
     */
    pollStats?: () => boolean;

    /**
     * Add arbitrary data to the inboundRtpEntry
     */
    appendix?: Appendix;
};

const supplyDefaultConfig = () => {
    const result: MediasoupDataProducerCollectorConfig = {};
    return result;
};

export class MediasoupDataProducerCollector implements Collector {
    public readonly id = uuidv4();
    private _parent: Collectors;
    private _closed = false;
    private _config: MediasoupDataProducerCollectorConfig;
    private _statsWriter?: StatsWriter;
    private _transportId: string;
    private _internal: boolean;
    private _ssrcToPadIds = new Map<number, string>();
    private _dataProducer: MediasoupDataProducer;
    private _correspondCollector?: Collector;
    public constructor(
        parent: Collectors,
        dataProducer: MediasoupDataProducer,
        transportId: string,
        internal: boolean,
        config?: MediasoupDataProducerCollectorConfig,
        correspondCollector?: Collector
    ) {
        this.id = `mediasoup-dataProducer-${dataProducer.id}`;
        this._parent = parent;
        this._dataProducer = dataProducer;
        this._transportId = transportId;
        this._internal = internal;
        this._config = Object.assign(supplyDefaultConfig(), config);
        this._correspondCollector = correspondCollector;

        const dataProducerId = this._dataProducer.id;
        this._dataProducer.observer.once("close", () => {
            this.close();
            logger.debug(`DataProducer ${dataProducerId} on transport ${transportId} is removed`);
        });
        logger.debug(`DataProducer ${dataProducerId} on transport ${transportId} is added`);
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

    private async _collectWithoutStats(): Promise<void> {
        this._statsWriter?.updateSctpChannel(
            {
                transportId: this._transportId,
                streamId: this._dataProducer.id,
                channelId: this._dataProducer.id,
                noReport: true,
                internal: this._internal,
            },
            {}
        );
    }

    public async collect(): Promise<void> {
        if (this._closed) {
            logger.warn(`Attempted to collect from a closed collector.`);
            return;
        }
        if (this._correspondCollector && this._correspondCollector.closed) {
            // if the corresponded collector is closed we need to close ourselves too
            this.close();
            return;
        }
        if (!this._statsWriter) {
            logger.debug(`No StatsWriter added to (${this.id})`);
            return;
        }
        if (this._config.pollStats === undefined || this._config.pollStats() === false) {
            return await this._collectWithoutStats();
        }
        const transportId = this._transportId;
        const polledStats = await this._dataProducer.getStats();
        for (const stats of polledStats) {
            const sctpChannel: SfuSctpChannel = {
                transportId,
                noReport: false,
                streamId: this._dataProducer.id,
                channelId: this._dataProducer.id,
                label: stats.label,
                protocol: stats.protocol,
                internal: this._internal,
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
            this._statsWriter?.updateSctpChannel(sctpChannel, this._config.appendix ?? {});
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
    }
}
