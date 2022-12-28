import { StatsWriter } from "../entries/StatsStorage";
import { Collector } from "../Collector";
import {
    MediasoupConsumer,
} from "./MediasoupTypes";
import { SfuOutboundRtpPad } from "@observertc/schemas";
import { v4 as uuidv4 } from "uuid";
import { createLogger } from "../utils/logger";
import { Collectors } from "../Collectors";
import { Appendix } from "../entries/StatsEntryInterfaces";

const logger = createLogger(`MediasoupConsumerCollector`);

export type MediasoupConsumerCollectorConfig = {
    /**
     * a supplier lambda function provides information if the collector should poll stas or not
     *
     * DEFAULT: undefined, which means it will not poll measurements
     */
    pollStats?: (consumerId: string) => boolean;

    /**
     * Add arbitrary data to the inboundRtpEntry
     */
    appendix?: Appendix;
};

const supplyDefaultConfig = () => {
    const result: MediasoupConsumerCollectorConfig = {};
    return result;
};

const NO_REPORT_SSRC = 0xdeadbeef;

export class MediasoupConsumerCollector implements Collector {
    public readonly id;
    private _parent: Collectors;
    private _closed = false;
    private _config: MediasoupConsumerCollectorConfig;
    private _statsWriter?: StatsWriter;
    private _transportId: string;
    private _internal: boolean;
    private _ssrcToPadIds = new Map<number, string>();
    private _consumer: MediasoupConsumer;
    public constructor(
        parent: Collectors,
        consumer: MediasoupConsumer,
        transportId: string,
        internal: boolean,
        config?: MediasoupConsumerCollectorConfig,
    ) {
        this.id = `mediasoup-consumer-${consumer.id}`;
        this._parent = parent;
        this._consumer = consumer;
        this._transportId = transportId;
        this._internal = internal;
        this._config = Object.assign(supplyDefaultConfig(), config);

        const consumerId = this._consumer.id;
        this._consumer.observer.once("close", () => {
            this.close();
            logger.debug(`Consumer ${consumerId} on transport ${transportId} is removed`);
        });
        logger.debug(`Consumer ${consumerId} on transport ${transportId} is added`);
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

    private _collectWithoutStats(): void {
        let padId = this._ssrcToPadIds.get(NO_REPORT_SSRC);
        if (!padId) {
            padId = uuidv4();
            this._ssrcToPadIds.set(NO_REPORT_SSRC, padId);
        }
        this._statsWriter?.updateOutboundRtpPad(
            {
                ssrc: NO_REPORT_SSRC,
                padId,
                streamId: this._consumer.producerId,
                sinkId: this._consumer.id,
                mediaType: this._consumer.kind,
                transportId: this._transportId,
                noReport: true,
                internal: this._internal,
            },
            this._config.appendix ?? {}
        );
    }

    public async collect(): Promise<void> {
        if (this._closed) {
            logger.warn(`Attempted to collect from a closed collector.`);
            return;
        }
        if (this._parent && this._parent.closed) {
            // if the corresponded collector is closed we need to close ourselves too
            this.close();
            return;
        }
        if (!this._statsWriter) {
            logger.warn(`No StatsWriter added to (${this.id})`);
            return;
        }
        if (this._config.pollStats === undefined || this._config.pollStats(this._consumer.id) === false) {
            this._collectWithoutStats();
            return;
        }
        const polledStats = await this._consumer.getStats();
        if (polledStats.length < 1) {
            this._collectWithoutStats();
            return;
        }
        for (const stats of polledStats) {
            const ssrc = stats.ssrc;
            if ("outbound-rtp" !== stats.type) continue;
            let padId = this._ssrcToPadIds.get(ssrc);
            if (!padId) {
                padId = uuidv4();
                this._ssrcToPadIds.set(ssrc, padId);
            }
            const outboundRtpPadStats: SfuOutboundRtpPad = {
                transportId: this._transportId,
                noReport: false,
                streamId: this._consumer.producerId,
                sinkId: this._consumer.id,
                padId,
                ssrc: stats.ssrc,
                internal: this._internal,

                mediaType: this._consumer.kind,
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
            };
            this._statsWriter?.updateOutboundRtpPad(outboundRtpPadStats, this._config.appendix ?? {});
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
        for (const padId of this._ssrcToPadIds.values()) {
            this._statsWriter?.removeOutboundRtpPad(padId);
        }
        this._closed = true;
        this._parent.remove(this.id);
    }
}
