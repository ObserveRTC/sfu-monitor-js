import { SfuSctpChannel, SfuInboundRtpPad, SfuOutboundRtpPad, SfuTransport } from "@observertc/schemas";

export interface StatsEntryAbs {
    id: string;
    created: number;
    updated: number;
    touched: number;
    hashCode: string;
}

export interface SfuTransportEntry extends StatsEntryAbs {
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

export interface SfuInboundRtpPadEntry extends StatsEntryAbs {
    stats: SfuInboundRtpPad;
    getTransport(): SfuTransportEntry | undefined;
    getMediaStream(): SfuMediaStreamEntry | undefined;
}

export interface SfuOutboundRtpPadEntry extends StatsEntryAbs {
    stats: SfuOutboundRtpPad;
    getTransport(): SfuTransportEntry | undefined;
    getMediaStream(): SfuMediaStreamEntry | undefined;
}

export type SfuMediaStreamKind = "audio" | "video" | undefined;

export interface SfuMediaStreamEntry {
    id: string;
    kind: SfuMediaStreamKind;
    inboundRtpPads(): Generator<SfuInboundRtpPadEntry, void, undefined>;
    mediaSinks(): Generator<SfuMediaSinkEntry, void, undefined>

    getTransport(): SfuTransportEntry | undefined;
    getNumberOfInboundRtpPads(): number;
    getNumberOfMediaSinks(): number;
}

export interface SfuMediaSinkEntry {
    id: string;
    kind: SfuMediaStreamKind;
    outboundRtpPads(): Generator<SfuOutboundRtpPadEntry, void, undefined>;

    getMediaStream(): SfuMediaStreamEntry | undefined;
    getTransport(): SfuTransportEntry | undefined;
    
    getNumberOfOutboundRtpPads(): number;
}

export interface SfuSctpChannelEntry extends StatsEntryAbs {
    stats: SfuSctpChannel;
    getTransport(): SfuTransportEntry | undefined;
}
