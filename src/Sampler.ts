import { v4 as uuidv4 } from "uuid";
import { StatsReader } from "./entries/StatsStorage";
import { isValidUuid } from "./utils/validators";
import { SfuSample, SfuExtensionStats } from "@observertc/schemas";
import { createLogger } from "./utils/logger";

const logger = createLogger(`Sampler`);

export type SamplerConfig = {
    /**
     * The identifier of the SFU.
     * 
     * DEFAULT: a generated unique value
     */
    sfuId?: string;

    /**
     * Indicate if the sampler only sample stats updated since the last sampling.
     * 
     * DEFAULT: true
     */
    incrementalSampling?: boolean;
}

type SamplerConstructorConfig = SamplerConfig & {
    sfuId: string,
}

export const supplyDefaultConfig = () => {
    const defaultConfig: SamplerConstructorConfig = {
        sfuId: uuidv4(),
        incrementalSampling: true,
    };
    return defaultConfig;
}


interface Builder {
    withConfig(value: SamplerConfig): Builder;
    build(): Sampler;
}

export class Sampler {
    public static builder(): Builder {
        let config: SamplerConfig | undefined;
        const result: Builder = {
            withConfig(value: SamplerConfig): Builder {
                config = value;
                return result;
            },
            build(): Sampler {
                if (!config) throw new Error(`Cannot create a Sampler without config`);
                const appliedConfig: SamplerConstructorConfig = Object.assign(supplyDefaultConfig(), config);
                return new Sampler(appliedConfig);
            }
        }
        return result;
    }

    public static create(config?: SamplerConfig): Sampler {
        const appliedConfig = Object.assign(supplyDefaultConfig(), config);
        return new Sampler(appliedConfig);
    }
    
    // all of the following fields until empty line must be reset after sampled
    private _extensionStats?: SfuExtensionStats[];
    private _statsReader?: StatsReader;
    // private _peerConnections: Map<string, PeerConnectionEntry> = new Map();
    private _sampled?: number;
    private _marker?: string;
    private _timezoneOffset: number = new Date().getTimezoneOffset();
    private _config: SamplerConstructorConfig;
    private _closed = false;
    private constructor(config: SamplerConstructorConfig) {
        if (config.sfuId && !isValidUuid(config.sfuId)) {
            throw new Error(`Sampler.config.callId must be a valid UUID`);
        }
        this._config = config;
    }

    public set statsProvider(value: StatsReader) {
        this._statsReader = value;
    }

    public get sfuId(): string {
        return this._config.sfuId;
    }

    public addExtensionStats(stats: SfuExtensionStats): void {
        if (!this._extensionStats) this._extensionStats = [];
        this._extensionStats.push(stats);
    }

    public setMarker(marker: string): void {
        this._marker = marker;
    }

    public close(): void {
        if (this._closed) {
            logger.warn(`Attempted to close the Sampler twice`);
            return; 
        }
        this._closed = true;
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
        if (!this._statsReader) {
            logger.warn(`No StatsProvider has been assigned to Sampler`);
            this._sampled = sfuSample.timestamp;
            return sfuSample;
        }
        const { incrementalSampling } = this._config;
        for (const transportEntry of this._statsReader.transports()) {
            if (incrementalSampling && this._sampled && transportEntry.touched <= this._sampled) {
                continue;
            }
            if (!sfuSample.transports) sfuSample.transports = [];
            const stats = { ...transportEntry.stats };
            sfuSample.transports.push(stats);
        }
        for (const inboundRtpPadEntry of this._statsReader.inboundRtpPads()) {
            if (incrementalSampling && this._sampled && inboundRtpPadEntry.touched <= this._sampled) {
                continue;
            }
            if (!sfuSample.inboundRtpPads) sfuSample.inboundRtpPads = [];
            const stats = { ...inboundRtpPadEntry.stats };
            sfuSample.inboundRtpPads.push(stats);
        }
        for (const outboundRtpPadEntry of this._statsReader.outboundRtpPads()) {
            if (incrementalSampling && this._sampled && outboundRtpPadEntry.touched <= this._sampled) {
                continue;
            }
            if (!sfuSample.outboundRtpPads) sfuSample.outboundRtpPads = [];
            const stats = { ...outboundRtpPadEntry.stats };
            sfuSample.outboundRtpPads.push(stats);
        }
        for (const sctpChannelEntry of this._statsReader.sctpChannels()) {
            if (incrementalSampling && this._sampled && sctpChannelEntry.touched <= this._sampled) {
                continue;
            }
            if (!sfuSample.sctpChannels) sfuSample.sctpChannels = [];
            const stats = { ...sctpChannelEntry.stats };
            sfuSample.sctpChannels.push(stats);
        }
        this._sampled = sfuSample.timestamp;
        logger.debug(`Assembled SfuSample`, sfuSample);
        return sfuSample;
    }
}