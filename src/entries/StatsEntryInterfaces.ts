import { SfuSctpChannel, SfuInboundRtpPad, SfuOutboundRtpPad, SfuTransport } from "@observertc/schemas";

export type AppData = any;

export interface StatsEntryAbs {
    id: string;
    created: number;
    updated: number;
    touched: number;
    hashCode: string;
}

/**
 * Wrap properties of SfuTransport from the schema and provide
 * methods to navigate.
 */
export interface SfuTransportEntry extends StatsEntryAbs {
    appData: AppData,
    stats: SfuTransport;
    internal: boolean;
    inboundRtpPads(): Generator<SfuInboundRtpPadEntry, void, undefined>;
    outboundRtpPads(): Generator<SfuOutboundRtpPadEntry, void, undefined>;
    sctpChannels(): Generator<SfuSctpChannelEntry, void, undefined>;

    mediaSinks(): Generator<SfuMediaSinkEntry, void, undefined>;
    mediaStreams(): Generator<SfuMediaStreamEntry, void, undefined>;

    getNumberOfInboundRtpPads(): number;
    getNumberOfOutboundRtpPads(): number;
    getNumberOfSctpChannels(): number;

    getNumberOfMediaStreams(): number;
    getNumberOfMediaSinks(): number;
}

/**
 * Wrap properties of SfuInboundRtpPad from the schema and provide
 * methods to navigate.
 */
export interface SfuInboundRtpPadEntry extends StatsEntryAbs {
    appData: AppData,
    stats: SfuInboundRtpPad;
    getTransport(): SfuTransportEntry | undefined;
    getMediaStream(): SfuMediaStreamEntry | undefined;
}

/**
 * Wrap properties of SfuOutboundRtpPadEntry from the schema and provide
 * methods to navigate.
 */
export interface SfuOutboundRtpPadEntry extends StatsEntryAbs {
    appData: AppData,
    stats: SfuOutboundRtpPad;
    getTransport(): SfuTransportEntry | undefined;
    getMediaStream(): SfuMediaStreamEntry | undefined;
}

export type SfuMediaStreamKind = "audio" | "video" | undefined;

/**
 * Group a media source and provide methods to navigate
 */
export interface SfuMediaStreamEntry {
    id: string;
    kind: SfuMediaStreamKind;
    inboundRtpPads(): Generator<SfuInboundRtpPadEntry, void, undefined>;
    mediaSinks(): Generator<SfuMediaSinkEntry, void, undefined>

    getTransport(): SfuTransportEntry | undefined;
    getNumberOfInboundRtpPads(): number;
    getNumberOfMediaSinks(): number;
}

/**
 * Group a media sink and provide methods to navigate
 */
export interface SfuMediaSinkEntry {
    id: string;
    kind: SfuMediaStreamKind;
    outboundRtpPads(): Generator<SfuOutboundRtpPadEntry, void, undefined>;

    getMediaStream(): SfuMediaStreamEntry | undefined;
    getTransport(): SfuTransportEntry | undefined;
    
    getNumberOfOutboundRtpPads(): number;
}

/**
 * Wrap properties of SfuSctpChannelEntry from the schema and provide
 * methods to navigate.
 */
export interface SfuSctpChannelEntry extends StatsEntryAbs {
    appData: AppData,
    stats: SfuSctpChannel;
    getTransport(): SfuTransportEntry | undefined;
}
