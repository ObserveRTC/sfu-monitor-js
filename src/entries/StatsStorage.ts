import { SfuSctpChannel, SfuInboundRtpPad, SfuOutboundRtpPad, SfuTransport } from "@observertc/schemas";
import {
    SfuInboundRtpPadEntry,
    SfuOutboundRtpPadEntry,
    SfuSctpChannelEntry,
    SfuTransportEntry,
    SfuMediaStreamEntry,
    SfuMediaStreamKind,
    SfuMediaSinkEntry,
    Appendix,
} from "./StatsEntryInterfaces";
import { hash } from "../utils/hash";
import { createLogger } from "../utils/logger";

const logger = createLogger(`StatsStorage`);

/**
 * Collection of methods to read the collected and organized stats
 */
export interface StatsReader {
    /**
     * Iterable iterator to list all collected transports
     */
    transports(): Generator<SfuTransportEntry, void, undefined>;

    /**
     * Iterable iterator to list all collected inbound rtp pads
     */
    inboundRtpPads(): Generator<SfuInboundRtpPadEntry, void, undefined>;

    /**
     * Iterable iterator to list all collected outbound rtp pads
     */
    outboundRtpPads(): Generator<SfuOutboundRtpPadEntry, void, undefined>;

    /**
     * Iterable iterator to list all collected sctp channels
     */
    sctpChannels(): Generator<SfuSctpChannelEntry, void, undefined>;

    /**
     * Iterable iterator to list all collected and groupped media streams
     */
    mediaStreams(): Generator<SfuMediaStreamEntry, void, undefined>;

    /**
     * Iterable iterator to list all collected and groupped audio streams
     */
    audioStreams(): Generator<SfuMediaStreamEntry, void, undefined>;

    /**
     * Iterable iterator to list all collected and groupped video streams
     */
    videoStreams(): Generator<SfuMediaStreamEntry, void, undefined>;

    /**
     * Iterable iterator to list all collected and groupped media sinks
     */
    mediaSinks(): Generator<SfuMediaSinkEntry, void, undefined>;

    /**
     * Iterable iterator to list all collected and groupped audio sinks
     */
    audioSinks(): Generator<SfuMediaSinkEntry, void, undefined>;

    /**
     * Iterable iterator to list all collected and groupped video sinks
     */
    videoSinks(): Generator<SfuMediaSinkEntry, void, undefined>;

    /**
     * Gets the number of tracked transports
     */
    getNumberOfTransports(): number;

    /**
     * Gets the number of tracked inbound rtp pads
     */
    getNumberOfInboundRtpPads(): number;

    /**
     * Gets the number of tracked outbound rtp pads
     */
    getNumberOfOutboundRtpPads(): number;

    /**
     * Gets the number of tracked sctp channel
     */
    getNumberOfSctpChannels(): number;

    /**
     * Gets the number of tracked media streams
     */
    getNumberOfMediaStreams(): number;

    /**
     * Gets the number of tracked audio streams
     */
    getNumberOfAudioStreams(): number;

    /**
     * Gets the number of tracked video streams
     */
    getNumberOfVideoStreams(): number;

    /**
     * Gets the number of tracked media sinks
     */
    getNumberOfMediaSinks(): number;

    /**
     * Gets the number of tracked audio sinks
     */
    getNumberOfAudioSinks(): number;

    /**
     * Gets the number of tracked video sinks
     */
    getNumberOfVideoSinks(): number;

    /**
     * Dump the content of the storage
     * @param withStats flag indicating if the stats of the entries should be included or not
     */
    dump(withStats: boolean): string;
}

export interface StatsWriter {
    removeTransport(transportId: string): void;
    updateTransport(stats: SfuTransport, appData?: Appendix): void;

    removeInboundRtpPad(rtpPadId: string): void;
    updateInboundRtpPad(stats: SfuInboundRtpPad, appData?: Appendix): void;

    removeOutboundRtpPad(rtpPadId: string): void;
    updateOutboundRtpPad(stats: SfuOutboundRtpPad, appData?: Appendix): void;

    removeSctpChannel(sctpStreamId: string): void;
    updateSctpChannel(stats: SfuSctpChannel, appData?: Appendix): void;
}

interface InnerSfuTransportEntry extends SfuTransportEntry {
    inboundRtpPadIds: Set<string>;
    outboundRtpPadIds: Set<string>;
    sctpChannelIds: Set<string>;

    mediaStreamIds: Set<string>;
    mediaSinkIds: Set<string>;
}

interface InnerSfuMediaStreamEntry extends SfuMediaStreamEntry {
    inboundRtpPadIds: Set<string>;
    mediaSinkIds: Set<string>;
    transportId: string;
}

interface InnerSfuMediaSinkEntry extends SfuMediaSinkEntry {
    outboundRtpPadIds: Set<string>;
    transportId: string;
    mediaStreamId: string;
}

export class StatsStorage implements StatsReader, StatsWriter {
    private _transports: Map<string, InnerSfuTransportEntry> = new Map();
    private _inboundRtpPads: Map<string, SfuInboundRtpPadEntry> = new Map();
    private _outboundRtpPads: Map<string, SfuOutboundRtpPadEntry> = new Map();
    private _sctpChannels: Map<string, SfuSctpChannelEntry> = new Map();

    private _mediaStreams: Map<string, InnerSfuMediaStreamEntry> = new Map();
    private _audioStreamIds: Set<string> = new Set();
    private _videoStreamIds: Set<string> = new Set();

    private _mediaSinks: Map<string, InnerSfuMediaSinkEntry> = new Map();
    private _audioSinkIds: Set<string> = new Set();
    private _videoSinkIds: Set<string> = new Set();

    public trim(expirationThresholdInMs: number) {
        for (const transport of this.transports()) {
            if (expirationThresholdInMs <= transport.touched) continue;
            this.removeTransport(transport.id);
        }
        for (const inboundRtpPad of this.inboundRtpPads()) {
            if (expirationThresholdInMs <= inboundRtpPad.touched) continue;
            this.removeInboundRtpPad(inboundRtpPad.id);
        }
        for (const outboundRtpPad of this.outboundRtpPads()) {
            if (expirationThresholdInMs <= outboundRtpPad.touched) continue;
            this.removeOutboundRtpPad(outboundRtpPad.id);
        }
        for (const sctpChannel of this.sctpChannels()) {
            if (expirationThresholdInMs <= sctpChannel.touched) continue;
            this.removeSctpChannel(sctpChannel.id);
        }
        logger.debug("trimmed with threshold", expirationThresholdInMs);
    }

    public clear() {
        // hup-hup-hup barba trukk
        const expirationThresholdInMs = Date.now() + 1000000;
        this.trim(expirationThresholdInMs);
        logger.debug("cleared");
    }

    public removeTransport(transportId: string): void {
        // unbind entry
        this._transports.delete(transportId);
        logger.debug(`Transport ${transportId} is removed`);
    }
    public updateTransport(stats: SfuTransport, appendix?: Appendix): void {
        const now = Date.now();
        const transportId = stats.transportId;
        const transports = this._transports;
        let entry = transports.get(transportId);
        if (!entry) {
            const inboundRtpPadsMap = this._inboundRtpPads;
            /* eslint-disable no-inner-declarations */
            function* inboundRtpPads(): Generator<SfuInboundRtpPadEntry, void, undefined> {
                const transportEntry = transports.get(transportId);
                if (!transportEntry) return;
                const rtpPadIds = Array.from(transportEntry.inboundRtpPadIds);
                for (const rtpPadId of rtpPadIds) {
                    const inboundRtpPad = inboundRtpPadsMap.get(rtpPadId);
                    if (!inboundRtpPad) continue;
                    yield inboundRtpPad;
                }
            }
            const outboundRtpPadsMap = this._outboundRtpPads;
            /* eslint-disable no-inner-declarations */
            function* outboundRtpPads(): Generator<SfuOutboundRtpPadEntry, void, undefined> {
                const transportEntry = transports.get(transportId);
                if (!transportEntry) return;
                const rtpPadIds = Array.from(transportEntry.outboundRtpPadIds);
                for (const rtpPadId of rtpPadIds) {
                    const outboundRtpPad = outboundRtpPadsMap.get(rtpPadId);
                    if (!outboundRtpPad) continue;
                    yield outboundRtpPad;
                }
            }
            const sctpChannelsMap = this._sctpChannels;
            /* eslint-disable no-inner-declarations */
            function* sctpChannels(): Generator<SfuSctpChannelEntry, void, undefined> {
                const transportEntry = transports.get(transportId);
                if (!transportEntry) return;
                const sctpChannelIds = Array.from(transportEntry.sctpChannelIds);
                for (const sctpChannelId of sctpChannelIds) {
                    const sctpChannel = sctpChannelsMap.get(sctpChannelId);
                    if (!sctpChannel) continue;
                    yield sctpChannel;
                }
            }
            const mediaSinksMap = this._mediaSinks;
            /* eslint-disable no-inner-declarations */
            function* mediaSinks(): Generator<SfuMediaSinkEntry, void, undefined> {
                const transportEntry = transports.get(transportId);
                if (!transportEntry) return;
                const mediaSinkIds = Array.from(transportEntry.mediaSinkIds);
                for (const mediaSinkId of mediaSinkIds) {
                    const mediaSink = mediaSinksMap.get(mediaSinkId);
                    if (!mediaSink) continue;
                    yield mediaSink;
                }
            }
            const mediaStreamsMap = this._mediaStreams;
            /* eslint-disable no-inner-declarations */
            function* mediaStreams(): Generator<SfuMediaStreamEntry, void, undefined> {
                const transportEntry = transports.get(transportId);
                if (!transportEntry) return;
                const mediaStreamIds = Array.from(transportEntry.mediaStreamIds);
                for (const mediaStreamId of mediaStreamIds) {
                    const mediaStream = mediaStreamsMap.get(mediaStreamId);
                    if (!mediaStream) continue;
                    yield mediaStream;
                }
            }
            const mediaSinkIds = Array.from(this._mediaSinks.values())
                .filter((sink) => sink.transportId === transportId)
                .map((sink) => sink.id);
            const mediaStreamIds = Array.from(this._mediaStreams.values())
                .filter((stream) => stream.transportId === transportId)
                .map((stream) => stream.id);
            const initialOutboundRtpPads = Array.from(this._outboundRtpPads.values()).filter(
                (pad) => pad.stats?.transportId === transportId
            );
            const initialInboundRtpPads = Array.from(this._inboundRtpPads.values()).filter(
                (pad) => pad.stats?.transportId === transportId
            );
            const intialSctpChannels = Array.from(this._sctpChannels.values()).filter(
                (pad) => pad.stats?.transportId === transportId
            );
            const newEntry: InnerSfuTransportEntry = (entry = {
                appendix,
                internal: !!stats.internal,
                id: transportId,
                stats,
                created: now,
                touched: now,
                updated: now,
                hashCode: "notHashed",
                inboundRtpPadIds: new Set<string>(initialInboundRtpPads.map((pad) => pad.id)),
                outboundRtpPadIds: new Set<string>(initialOutboundRtpPads.map((pad) => pad.id)),
                sctpChannelIds: new Set<string>(intialSctpChannels.map((channel) => channel.id)),
                mediaSinkIds: new Set<string>(mediaSinkIds),
                mediaStreamIds: new Set<string>(mediaStreamIds),
                inboundRtpPads,
                outboundRtpPads,
                sctpChannels,
                mediaSinks,
                mediaStreams,

                getNumberOfInboundRtpPads: () => {
                    return newEntry.inboundRtpPadIds.size;
                },
                getNumberOfOutboundRtpPads: () => {
                    return newEntry.outboundRtpPadIds.size;
                },
                getNumberOfSctpChannels: () => {
                    return newEntry.sctpChannelIds.size;
                },
                getNumberOfMediaSinks: () => {
                    return newEntry.mediaSinkIds.size;
                },
                getNumberOfMediaStreams: () => {
                    return newEntry.mediaStreamIds.size;
                },
            });
            newEntry.hashCode = hash(stats);
            this._transports.set(transportId, newEntry);
        } else {
            entry.stats = {
                ...entry.stats,
                ...stats,
            };
            const newHashCode = hash(stats);
            if (entry.hashCode !== newHashCode) {
                entry.updated = now;
                entry.hashCode = newHashCode;
            }
            entry.touched = now;
        }
    }

    public updateInboundRtpPad(stats: SfuInboundRtpPad, appendix?: Appendix): void {
        const now = Date.now();
        const inboundRtpPadId = stats.padId;
        const inboundRtpPads = this._inboundRtpPads;
        let entry = inboundRtpPads.get(inboundRtpPadId);
        if (!entry) {
            const transportId = stats.transportId;
            const newEntry: SfuInboundRtpPadEntry = (entry = {
                appendix,
                id: inboundRtpPadId,
                stats,
                created: now,
                touched: now,
                updated: now,
                hashCode: "notHashed",
                getTransport: () => {
                    return this._transports.get(transportId);
                },
                getMediaStream: () => {
                    return this._mediaStreams.get(newEntry.stats.streamId);
                },
            });
            entry.hashCode = hash(stats);
            inboundRtpPads.set(newEntry.id, newEntry);
            const { streamId, mediaType: kind } = stats;

            // bind entry
            const transport = this._transports.get(transportId);
            if (transport) {
                transport.inboundRtpPadIds.add(inboundRtpPadId);
            }
            if (streamId) {
                const mediaStream = this._getOrCreateMediaStream({
                    transportId,
                    streamId,
                    kind,
                });
                if (transport) {
                    transport.mediaStreamIds.add(streamId);
                }
                if (kind === "audio") this._audioStreamIds.add(streamId);
                else if (kind === "video") this._videoStreamIds.add(streamId);
                mediaStream.inboundRtpPadIds.add(inboundRtpPadId);
            }
        } else {
            entry.stats = {
                ...entry.stats,
                ...stats,
            };
            const newHashCode = hash(stats);
            if (entry.hashCode !== newHashCode) {
                entry.updated = now;
                entry.hashCode = newHashCode;
            }
            entry.touched = now;
        }
    }
    public removeInboundRtpPad(inboundRtpPadId: string): void {
        const inboundRtpPad = this._inboundRtpPads.get(inboundRtpPadId);
        if (!inboundRtpPad) return;

        // unbind entry
        const { transportId, mediaType: kind, streamId } = inboundRtpPad.stats;
        const transport = this._transports.get(transportId);
        if (transport) {
            transport.inboundRtpPadIds.delete(inboundRtpPadId);
        }
        const mediaStream = this._mediaStreams.get(streamId);
        if (mediaStream) {
            mediaStream.inboundRtpPadIds.delete(inboundRtpPadId);
        }
        if (mediaStream && mediaStream.getNumberOfInboundRtpPads() < 1) {
            if (transport) {
                transport.mediaStreamIds.delete(streamId);
            }
            if (kind === "audio") this._audioStreamIds.delete(streamId);
            else if (kind === "video") this._videoStreamIds.delete(streamId);
            this._mediaStreams.delete(streamId);
        }
        this._inboundRtpPads.delete(inboundRtpPadId);
    }

    public updateOutboundRtpPad(stats: SfuOutboundRtpPad, appendix?: Appendix): void {
        const now = Date.now();
        const outboundRtpPadId = stats.padId;
        const outboundRtpPads = this._outboundRtpPads;
        let entry = outboundRtpPads.get(outboundRtpPadId);
        if (!entry) {
            const transportId = stats.transportId;
            const newEntry: SfuOutboundRtpPadEntry = (entry = {
                appendix,
                id: outboundRtpPadId,
                stats,
                created: now,
                touched: now,
                updated: now,
                hashCode: "notHashed",
                getTransport: () => {
                    return this._transports.get(transportId);
                },
                getMediaStream: () => {
                    return this._mediaStreams.get(newEntry.stats.streamId);
                },
                getMediaSink: () => {
                    return this._mediaSinks.get(newEntry.stats.sinkId);
                },
            });
            entry.hashCode = hash(stats);
            outboundRtpPads.set(newEntry.id, newEntry);
            const { streamId, sinkId, mediaType: kind } = stats;

            // bind
            const transport = this._transports.get(transportId);
            if (transport) {
                transport.outboundRtpPadIds.add(outboundRtpPadId);
            }
            if (streamId && sinkId) {
                const mediaStream = this._mediaStreams.get(streamId);
                if (mediaStream) {
                    mediaStream.mediaSinkIds.add(sinkId);
                }
                const mediaSink = this._getOrCreateMediaSink({
                    transportId,
                    streamId,
                    sinkId,
                    kind,
                });
                if (transport) {
                    transport.mediaSinkIds.add(sinkId);
                }
                if (kind === "audio") this._audioSinkIds.add(sinkId);
                else if (kind === "video") this._videoSinkIds.add(sinkId);
                mediaSink.outboundRtpPadIds.add(outboundRtpPadId);
            }
        } else {
            entry.stats = {
                ...entry.stats,
                ...stats,
            };
            const newHashCode = hash(stats);
            if (entry.hashCode !== newHashCode) {
                entry.updated = now;
                entry.hashCode = newHashCode;
            }
            entry.touched = now;
        }
    }
    public removeOutboundRtpPad(outboundRtpPadId: string): void {
        const outboundRtpPad = this._outboundRtpPads.get(outboundRtpPadId);
        if (!outboundRtpPad) return;

        // unbind entry
        const { transportId, mediaType: kind, sinkId, streamId } = outboundRtpPad.stats;
        const transport = this._transports.get(transportId);
        if (transport) {
            transport.outboundRtpPadIds.delete(outboundRtpPadId);
        }
        const mediaSink = this._mediaSinks.get(sinkId);
        if (mediaSink) {
            mediaSink.outboundRtpPadIds.delete(outboundRtpPadId);
        }
        if (mediaSink && mediaSink.getNumberOfOutboundRtpPads() < 1) {
            const mediaStream = this._mediaStreams.get(streamId);
            if (mediaStream) {
                mediaStream.mediaSinkIds.delete(sinkId);
            }
            if (transport) {
                transport.mediaSinkIds.delete(sinkId);
            }
            if (kind === "audio") this._audioSinkIds.delete(sinkId);
            else if (kind === "video") this._videoSinkIds.delete(sinkId);
            this._mediaSinks.delete(sinkId);
        }
        this._outboundRtpPads.delete(outboundRtpPadId);
    }

    public updateSctpChannel(stats: SfuSctpChannel, appendix?: Appendix): void {
        const now = Date.now();
        const { channelId: sctpChannelId } = stats;
        const sctpChannels = this._sctpChannels;
        let entry = sctpChannels.get(sctpChannelId);
        if (!entry) {
            const transportId = stats.transportId;
            const newEntry: SfuSctpChannelEntry = (entry = {
                appendix,
                id: sctpChannelId,
                stats,
                created: now,
                touched: now,
                updated: now,
                hashCode: "notHashed",
                getTransport: () => {
                    return this._transports.get(transportId);
                },
            });
            entry.hashCode = hash(stats);
            this._sctpChannels.set(newEntry.id, newEntry);

            // bind entry
            const transport = this._transports.get(transportId);
            if (transport) {
                transport.sctpChannelIds.add(sctpChannelId);
            }
        } else {
            entry.stats = {
                ...entry.stats,
                ...stats,
            };
            const newHashCode = hash(stats);
            if (entry.hashCode !== newHashCode) {
                entry.updated = now;
                entry.hashCode = newHashCode;
            }
            entry.touched = now;
        }
    }
    public removeSctpChannel(sctpChannelId: string): void {
        const sctpChannel = this._sctpChannels.get(sctpChannelId);
        if (!sctpChannel) return;
        // unbind entry
        const { transportId } = sctpChannel.stats;
        const transport = this._transports.get(transportId);
        if (transport) {
            transport.sctpChannelIds.delete(sctpChannelId);
        }
        this._sctpChannels.delete(sctpChannelId);
    }

    public *transports(): Generator<SfuTransportEntry, void, undefined> {
        const entries = this._transports;
        const entryIds = Array.from(entries.keys());
        for (const entryId of entryIds) {
            const entry = entries.get(entryId);
            if (entry) yield entry;
        }
    }

    public *inboundRtpPads(): Generator<SfuInboundRtpPadEntry, void, undefined> {
        const entries = this._inboundRtpPads;
        const entryIds = Array.from(entries.keys());
        for (const entryId of entryIds) {
            const entry = entries.get(entryId);
            if (entry) yield entry;
        }
    }

    public *outboundRtpPads(): Generator<SfuOutboundRtpPadEntry, void, undefined> {
        const entries = this._outboundRtpPads;
        const entryIds = Array.from(entries.keys());
        for (const entryId of entryIds) {
            const entry = entries.get(entryId);
            if (entry) yield entry;
        }
    }

    public *sctpChannels(): Generator<SfuSctpChannelEntry, void, undefined> {
        const entries = this._sctpChannels;
        const entryIds = Array.from(entries.keys());
        for (const entryId of entryIds) {
            const entry = entries.get(entryId);
            if (entry) yield entry;
        }
    }

    public *mediaStreams(): Generator<SfuMediaStreamEntry, void, undefined> {
        const entries = this._mediaStreams;
        const entryIds = Array.from(entries.keys());
        for (const entryId of entryIds) {
            const entry = entries.get(entryId);
            if (entry) yield entry;
        }
    }

    public *audioStreams(): Generator<SfuMediaStreamEntry, void, undefined> {
        const mediaSourceIds = Array.from(this._audioStreamIds);
        for (const mediaSourceId of mediaSourceIds) {
            const mediaStream = this._mediaStreams.get(mediaSourceId);
            if (!mediaStream) continue;
            yield mediaStream;
        }
    }

    public *videoStreams(): Generator<SfuMediaStreamEntry, void, undefined> {
        const mediaSourceIds = Array.from(this._videoStreamIds);
        for (const mediaSourceId of mediaSourceIds) {
            const mediaStream = this._mediaStreams.get(mediaSourceId);
            if (!mediaStream) continue;
            yield mediaStream;
        }
    }

    public *mediaSinks(): Generator<SfuMediaSinkEntry, void, undefined> {
        const entries = this._mediaSinks;
        const entryIds = Array.from(entries.keys());
        for (const entryId of entryIds) {
            const entry = entries.get(entryId);
            if (entry) yield entry;
        }
    }

    public *audioSinks(): Generator<SfuMediaSinkEntry, void, undefined> {
        const mediaSinkIds = Array.from(this._audioSinkIds);
        for (const mediaSinkId of mediaSinkIds) {
            const mediaSink = this._mediaSinks.get(mediaSinkId);
            if (!mediaSink) continue;
            yield mediaSink;
        }
    }

    public *videoSinks(): Generator<SfuMediaSinkEntry, void, undefined> {
        const mediaSinkIds = Array.from(this._videoSinkIds);
        for (const mediaSinkId of mediaSinkIds) {
            const mediaSink = this._mediaSinks.get(mediaSinkId);
            if (!mediaSink) continue;
            yield mediaSink;
        }
    }

    public getNumberOfMediaStreams(): number {
        return this._mediaStreams.size;
    }

    public getNumberOfAudioSinks(): number {
        return this._audioSinkIds.size;
    }

    public getNumberOfVideoSinks(): number {
        return this._videoSinkIds.size;
    }

    public getNumberOfTransports(): number {
        return this._transports.size;
    }

    public getNumberOfAudioStreams(): number {
        return this._audioStreamIds.size;
    }

    public getNumberOfVideoStreams(): number {
        return this._videoStreamIds.size;
    }

    public getNumberOfInboundRtpPads(): number {
        return this._inboundRtpPads.size;
    }

    public getNumberOfOutboundRtpPads(): number {
        return this._outboundRtpPads.size;
    }

    public getNumberOfMediaSinks(): number {
        return this._mediaSinks.size;
    }

    public getNumberOfSctpChannels(): number {
        return this._sctpChannels.size;
    }

    private _getOrCreateMediaStream({
        transportId,
        streamId,
        kind,
    }: {
        transportId: string;
        streamId: string;
        kind: SfuMediaStreamKind;
    }): InnerSfuMediaStreamEntry {
        const mediaStreams = this._mediaStreams;
        let result = mediaStreams.get(streamId);
        if (result) return result;
        const inboundRtpPadsMap = this._inboundRtpPads;
        function* inboundRtpPads(): Generator<SfuInboundRtpPadEntry, void, undefined> {
            const mediaStream = mediaStreams.get(streamId);
            if (!mediaStream) return;
            const inboundRtpPadIds = Array.from(mediaStream.inboundRtpPadIds);
            for (const inboundRtpPadId of inboundRtpPadIds) {
                const inboundRtpPad = inboundRtpPadsMap.get(inboundRtpPadId);
                if (!inboundRtpPad) continue;
                yield inboundRtpPad;
            }
        }
        const mediaSinksMap = this._mediaSinks;
        function* mediaSinks(): Generator<SfuMediaSinkEntry, void, undefined> {
            const mediaStream = mediaStreams.get(streamId);
            if (!mediaStream) return;
            const mediaSinkIds = Array.from(mediaStream.mediaSinkIds);
            for (const mediaSinkId of mediaSinkIds) {
                const mediaSink = mediaSinksMap.get(mediaSinkId);
                if (!mediaSink) continue;
                yield mediaSink;
            }
        }
        const inboundRtpPadIds = Array.from(this._inboundRtpPads.values())
            .filter((pad) => pad.stats?.streamId === streamId)
            .map((pad) => pad.id);
        const mediaSinkIds = Array.from(this._mediaSinks.values())
            .filter((mediaSink) => mediaSink.mediaStreamId === streamId)
            .map((sink) => sink.id);
        const mediaStream: InnerSfuMediaStreamEntry = (result = {
            id: streamId,
            transportId,
            kind,
            inboundRtpPadIds: new Set<string>(inboundRtpPadIds),
            mediaSinkIds: new Set<string>(mediaSinkIds),
            inboundRtpPads,
            mediaSinks,
            getTransport: () => {
                if (!mediaStream.transportId) return;
                return this._transports.get(mediaStream.transportId);
            },
            getNumberOfInboundRtpPads: () => {
                return mediaStream.inboundRtpPadIds.size;
            },
            getNumberOfMediaSinks: () => {
                return mediaStream.mediaSinkIds.size;
            },
        });
        mediaStreams.set(streamId, mediaStream);
        return result;
    }

    private _getOrCreateMediaSink({
        transportId,
        streamId,
        sinkId,
        kind,
    }: {
        transportId: string;
        streamId: string;
        sinkId: string;
        kind: SfuMediaStreamKind;
    }): InnerSfuMediaSinkEntry {
        const mediaSinks = this._mediaSinks;
        let result = mediaSinks.get(sinkId);
        if (result) return result;
        const outboundRtpPadsMap = this._outboundRtpPads;
        function* outboundRtpPads(): Generator<SfuOutboundRtpPadEntry, void, undefined> {
            const mediaSink = mediaSinks.get(sinkId);
            if (!mediaSink) return;
            const outboundRtpPadIds = Array.from(mediaSink.outboundRtpPadIds);
            for (const outboundRtpPadId of outboundRtpPadIds) {
                const outboundRtpPad = outboundRtpPadsMap.get(outboundRtpPadId);
                if (!outboundRtpPad) continue;
                yield outboundRtpPad;
            }
        }
        const outboundRtpPadIds = Array.from(this._outboundRtpPads.values())
            .filter((pad) => pad.stats?.sinkId === sinkId)
            .map((pad) => pad.id);
        const mediaSink: InnerSfuMediaSinkEntry = (result = {
            id: sinkId,
            mediaStreamId: streamId,
            transportId,
            kind,
            outboundRtpPadIds: new Set<string>(outboundRtpPadIds),
            outboundRtpPads,
            getMediaStream: () => {
                return this._mediaStreams.get(streamId);
            },
            getTransport: () => {
                if (!mediaSink.transportId) return;
                return this._transports.get(mediaSink.transportId);
            },
            getNumberOfOutboundRtpPads: () => {
                return mediaSink.outboundRtpPadIds.size;
            },
        });
        mediaSinks.set(sinkId, mediaSink);
        return result;
    }

    public dump(withStats = false) {
        const dumpObj = (obj: { [s: string]: unknown } | ArrayLike<unknown> | undefined) =>
            obj ? Array.from(Object.entries(obj)).map(([key, value]) => `${key}: ${value}`) : ["undefined"];
        const transportLogs: string[] = [];
        for (const [transportId, transport] of this._transports.entries()) {
            const transportLog: string[] = [
                `TransportId: ${transportId}`,
                `inboundRtpPadIds: ${Array.from(transport.inboundRtpPadIds).join(", ")}`,
                `outboundRtpPadIds: ${Array.from(transport.outboundRtpPadIds).join(", ")}`,
                `mediaSinkIds: ${Array.from(transport.mediaSinkIds).join(", ")}`,
                `mediaStreamIds: ${Array.from(transport.mediaStreamIds).join(", ")}`,
                `sctpChannelIds: ${Array.from(transport.sctpChannelIds).join(", ")}`,
            ];
            if (withStats) {
                transportLog.push(
                    `updated: ${transport.updated}`,
                    `touched: ${transport.touched}`,
                    `appendix:`,
                    ...dumpObj(transport.appendix).map((line) => `\t${line}`),
                    `stats:`,
                    ...dumpObj(transport.stats).map((line) => `\t${line}`)
                );
            }
            transportLogs.push(...transportLog.map((line) => `\t${line}`), `\n`);
        }

        const inboundRtpPadLogs: string[] = [];
        for (const [inboundRtpPadId, inboundRtpPad] of this._inboundRtpPads.entries()) {
            const inboundRtpPadLog: string[] = [
                `padId: ${inboundRtpPadId}`,
                `transportId: ${inboundRtpPad.getTransport()?.id}`,
                `streamId: ${inboundRtpPad.getMediaStream()?.id}`,
            ];
            if (withStats) {
                inboundRtpPadLog.push(
                    `updated: ${inboundRtpPad.updated}`,
                    `touched: ${inboundRtpPad.touched}`,
                    `appendix:`,
                    ...dumpObj(inboundRtpPad.appendix).map((line) => `\t${line}`),
                    `stats:`,
                    ...dumpObj(inboundRtpPad.stats).map((line) => `\t${line}`)
                );
            }
            inboundRtpPadLogs.push(...inboundRtpPadLog.map((line) => `\t${line}`), `\n`);
        }

        const outboundRtpPadLogs: string[] = [];
        for (const [outboundRtpPadId, outboundRtpPad] of this._outboundRtpPads.entries()) {
            const inboundRtpPadLog: string[] = [
                `padId: ${outboundRtpPadId}`,
                `transportId: ${outboundRtpPad.getTransport()?.id}`,
                `streamId: ${outboundRtpPad.getMediaStream()?.id}`,
                `sinkId: ${outboundRtpPad.getMediaSink()?.id}`,
            ];
            if (withStats) {
                inboundRtpPadLog.push(
                    `updated: ${outboundRtpPad.updated}`,
                    `touched: ${outboundRtpPad.touched}`,
                    `appendix:`,
                    ...dumpObj(outboundRtpPad.appendix).map((line) => `\t${line}`),
                    `stats:`,
                    ...dumpObj(outboundRtpPad.stats).map((line) => `\t${line}`)
                );
            }
            outboundRtpPadLogs.push(...inboundRtpPadLog.map((line) => `\t${line}`), `\n`);
        }

        const sctpChannelLogs: string[] = [];
        for (const [channelId, sctpChannel] of this._sctpChannels.entries()) {
            const sctpChannelLog: string[] = [`channelId: ${channelId}`];
            if (withStats) {
                sctpChannelLog.push(
                    `updated: ${sctpChannel.updated}`,
                    `touched: ${sctpChannel.touched}`,
                    `appendix:`,
                    ...dumpObj(sctpChannel.appendix).map((line) => `\t${line}`),
                    `stats:`,
                    ...dumpObj(sctpChannel.stats).map((line) => `\t${line}`)
                );
            }
            sctpChannelLogs.push(...sctpChannelLog.map((line) => `\t${line}`), `\n`);
        }

        const mediaStreamLogs: string[] = [];
        for (const [streamId, mediaStream] of this._mediaStreams.entries()) {
            const mediaStreamLog: string[] = [
                `streamId: ${streamId}`,
                `transportId: ${mediaStream.transportId}`,
                `inboundRtpPadIds: ${Array.from(mediaStream.inboundRtpPadIds).join(", ")}`,
                `mediaSinkIds: ${Array.from(mediaStream.mediaSinkIds).join(", ")}`,
            ];
            mediaStreamLogs.push(...mediaStreamLog.map((line) => `\t${line}`), `\n`);
        }

        const mediaSinkLogs: string[] = [];
        for (const [sinkId, mediaSink] of this._mediaSinks.entries()) {
            const mediaSinkLog: string[] = [
                `sinkId: ${sinkId}`,
                `streamId: ${mediaSink.getMediaStream()?.id}`,
                `transportId: ${mediaSink.transportId}`,
                `outboundRtpPadIds: ${Array.from(mediaSink.outboundRtpPadIds).join(", ")}`,
            ];
            mediaSinkLogs.push(...mediaSinkLog.map((line) => `\t${line}`), `\n`);
        }
        const entries: string[] = [
            `Transports\n`,
            ...transportLogs.map((line) => `\t${line}`),
            `InboundRtpPads\n`,
            ...inboundRtpPadLogs.map((line) => `\t${line}`),
            `OutboundRtpPads\n`,
            ...outboundRtpPadLogs.map((line) => `\t${line}`),
            `SctpChannels\n`,
            ...sctpChannelLogs.map((line) => `\t${line}`),
            `MediaStreams\n`,
            ...mediaStreamLogs.map((line) => `\t${line}`),
            `MediaSinks\n`,
            ...mediaSinkLogs.map((line) => `\t${line}`),
        ];
        return entries.join("\n");
    }
}
