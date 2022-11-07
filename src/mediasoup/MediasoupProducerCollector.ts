import { StatsWriter } from "../entries/StatsStorage";
import { Collector } from "../Collector";
import { SfuInboundRtpPad } from "@observertc/schemas";
import { v4 as uuidv4 } from "uuid";
import { createLogger } from "../utils/logger";
import { Collectors } from "../Collectors";
import { MediasoupProducer } from "./MediasoupTypes";
import { Appendix } from "../entries/StatsEntryInterfaces";

const logger = createLogger(`MediasoupCollector`);

export type MediasoupProducerCollectorConfig = {
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
    const result: MediasoupProducerCollectorConfig = {};
    return result;
};

const NO_REPORT_SSRC = 0xdeadbeef;

export class MediasoupProducerCollector implements Collector {
    public readonly id = uuidv4();
    private _parent: Collectors;
    private _closed = false;
    private _config: MediasoupProducerCollectorConfig;
    private _statsWriter?: StatsWriter;
    private _transportId: string;
    private _internal: boolean;
    private _ssrcToPadIds = new Map<number, string>();
    private _producer: MediasoupProducer;
    private _correspondCollector?: Collector;
    public constructor(
        parent: Collectors,
        producer: MediasoupProducer,
        transportId: string,
        internal: boolean,
        config?: MediasoupProducerCollectorConfig,
        correspondCollector?: Collector
    ) {
        this.id = `mediasoup-producer-${producer.id}`;
        this._parent = parent;
        this._producer = producer;
        this._transportId = transportId;
        this._internal = internal;
        this._config = Object.assign(supplyDefaultConfig(), config);
        this._correspondCollector = correspondCollector;

        const producerId = this._producer.id;
        this._producer.observer.once("close", () => {
            this.close();
            logger.debug(`Producer ${producerId} on transport ${transportId} is removed`);
        });
        logger.debug(`Producer ${producerId} on transport ${transportId} is added`);
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
        let padId = this._ssrcToPadIds.get(NO_REPORT_SSRC);
        if (!padId) {
            padId = uuidv4();
            this._ssrcToPadIds.set(NO_REPORT_SSRC, padId);
        }
        this._statsWriter?.updateInboundRtpPad(
            {
                ssrc: NO_REPORT_SSRC,
                padId,
                streamId: this._producer.id,
                mediaType: this._producer.kind,
                transportId: this._transportId,
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
        const polledStats = await this._producer.getStats();
        for (const stats of polledStats) {
            const ssrc = stats.ssrc;
            // if (type === msStats.type) continue;
            let padId = this._ssrcToPadIds.get(ssrc);
            if (!padId) {
                padId = uuidv4();
                this._ssrcToPadIds.set(ssrc, padId);
            }
            const inboundRtpPadStats: SfuInboundRtpPad = {
                transportId,
                noReport: false,
                streamId: this._producer.id,
                internal: this._internal,

                padId,
                ssrc,
                mediaType: this._producer.kind,
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
            };
            this._statsWriter?.updateInboundRtpPad(inboundRtpPadStats, this._config.appendix ?? {});
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
