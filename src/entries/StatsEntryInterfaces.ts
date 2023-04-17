import { 
    SfuSctpChannel, 
    SfuInboundRtpPad, 
    SfuOutboundRtpPad, 
    SfuTransport
} from "@observertc/sample-schemas-js";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Appendix = any;

export interface StatsEntryAbs {
    id: string;
}

/**
 * Wrap properties of SfuTransport from the schema and provide
 * methods to navigate.
 */
export interface SfuTransportEntry extends StatsEntryAbs {
    appData: Record<string, unknown>;
    stats: SfuTransport;
    internal: boolean;
    sampled: boolean;

    inboundRtpPads(): IterableIterator<SfuInboundRtpPadEntry>;
    outboundRtpPads(): IterableIterator<SfuOutboundRtpPadEntry>;
    sctpChannels(): IterableIterator<SfuSctpChannelEntry>;
}

/**
 * Wrap properties of SfuInboundRtpPad from the schema and provide
 * methods to navigate.
 */
export interface SfuInboundRtpPadEntry extends StatsEntryAbs {
    appData: Record<string, unknown>;
    stats: SfuInboundRtpPad;
    internal: boolean;
    sampled: boolean;

    getTransport(): SfuTransportEntry | undefined;
}

/**
 * Wrap properties of SfuOutboundRtpPadEntry from the schema and provide
 * methods to navigate.
 */
export interface SfuOutboundRtpPadEntry extends StatsEntryAbs {
    appData: Record<string, unknown>;
    stats: SfuOutboundRtpPad;
    internal: boolean;
    sampled: boolean;

    getTransport(): SfuTransportEntry | undefined;
}

/**
 * Wrap properties of SfuSctpChannelEntry from the schema and provide
 * methods to navigate.
 */
export interface SfuSctpChannelEntry extends StatsEntryAbs {
    appData: Record<string, unknown>;
    stats: SfuSctpChannel;
    sampled: boolean;
    
    getTransport(): SfuTransportEntry | undefined;
}
