import { StatsReader } from "./entries/StatsStorage";
import { SfuSample, SfuExtensionStats, CustomSfuEvent } from "@observertc/sample-schemas-js";
import { createLogger } from "./utils/logger";

const logger = createLogger(`Sampler`);

export class Sampler {
    // all of the following fields until empty line must be reset after sampled
    private _extensionStats?: SfuExtensionStats[];
    private _customEvents?: CustomSfuEvent[];
    // private _peerConnections: Map<string, PeerConnectionEntry> = new Map();
    private _marker?: string;
    private _timezoneOffset: number = new Date().getTimezoneOffset();
    private _closed = false;
    public constructor(
        public readonly sfuId: string,
        private readonly _statsReader: StatsReader,
    ) {

    }

    public addExtensionStats(stats: SfuExtensionStats): void {
        if (!this._extensionStats) this._extensionStats = [];
        this._extensionStats.push(stats);
    }

    public addSfuCustomEvent(event: CustomSfuEvent) {
        if (!this._customEvents) this._customEvents = [];
        this._customEvents.push(event);
    }

    public setMarker(marker: string | undefined): void {
        this._marker = marker;
    }

    public close(): void {
        if (this._closed) {
            logger.warn(`Attempted to close the Sampler twice`);
            return;
        }
        this._closed = true;
        logger.info(`Closed`);
    }

    public make(): SfuSample {
        if (this._closed) {
            throw new Error(`Cannot sample a closed Sampler`);
        }
        const sfuSample: SfuSample = {
            sfuId: this.sfuId,
            timestamp: Date.now(),
        };
        if (this._timezoneOffset) {
            sfuSample.timeZoneOffsetInHours = this._timezoneOffset;
        }
        if (this._marker) {
            sfuSample.marker = this._marker;
        }
        if (this._extensionStats) {
            sfuSample.extensionStats = this._extensionStats;
            this._extensionStats = undefined;
        }
        if (this._customEvents) {
            sfuSample.customSfuEvents = this._customEvents;
            this._customEvents = undefined;
        }
        for (const transportEntry of this._statsReader.transports()) {
            if (!sfuSample.transports) sfuSample.transports = [];
            const stats = { ...transportEntry.stats };
            sfuSample.transports.push(stats);
        }
        for (const inboundRtpPadEntry of this._statsReader.inboundRtpPads()) {
            if (!sfuSample.inboundRtpPads) sfuSample.inboundRtpPads = [];
            const stats = { ...inboundRtpPadEntry.stats };
            sfuSample.inboundRtpPads.push(stats);
        }
        for (const outboundRtpPadEntry of this._statsReader.outboundRtpPads()) {
            if (!sfuSample.outboundRtpPads) sfuSample.outboundRtpPads = [];
            const stats = { ...outboundRtpPadEntry.stats };
            sfuSample.outboundRtpPads.push(stats);
        }
        for (const sctpChannelEntry of this._statsReader.sctpChannels()) {
            if (!sfuSample.sctpChannels) sfuSample.sctpChannels = [];
            const stats = { ...sctpChannelEntry.stats };
            sfuSample.sctpChannels.push(stats);
        }
        logger.debug(`Assembled SfuSample`, sfuSample);
        return sfuSample;
    }
}
