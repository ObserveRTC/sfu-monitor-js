import { SfuSctpChannel, SfuInboundRtpPad, SfuOutboundRtpPad, SfuTransport } from "@observertc/schemas";
import { SfuInboundRtpPadEntry, SfuOutboundRtpPadEntry, SfuSctpChannelEntry, SfuTransportEntry, SfuMediaStreamEntry, SfuMediaStreamKind, SfuMediaSinkEntry } from "./StatsEntryInterfaces";
import { hash } from "../utils/hash";
import { createLogger } from "../utils/logger";

const logger = createLogger(`StatsStorage`);

export interface StatsReader {
    transports(): Generator<SfuTransportEntry, void, undefined>;
    inboundRtpPads(): Generator<SfuInboundRtpPadEntry, void, undefined>;
    outboundRtpPads(): Generator<SfuOutboundRtpPadEntry, void, undefined>;
    sctpChannels(): Generator<SfuSctpChannelEntry, void, undefined>;
    
    mediaStreams(): Generator<SfuMediaStreamEntry, void, undefined>;
    audioStreams(): Generator<SfuMediaStreamEntry, void, undefined>;
    videoStreams(): Generator<SfuMediaStreamEntry, void, undefined>;

    mediaSinks(): Generator<SfuMediaSinkEntry, void, undefined>;
    audioSinks(): Generator<SfuMediaSinkEntry, void, undefined>;
    videoSinks(): Generator<SfuMediaSinkEntry, void, undefined>;
    

    getNumberOfTransports(): number;
    getNumberOfInboundRtpPads(): number;
    getNumberOfOutboundRtpPads(): number;
    getNumberOfSctpChannels(): number;

    getNumberOfMediaStreams(): number;
    getNumberOfAudioStreams(): number;
    getNumberOfVideoStreams(): number;

    getNumberOfMediaSinks(): number;
    getNumberOfAudioSinks(): number;
    getNumberOfVideoSinks(): number;
}

export interface StatsWriter {
    removeTransport(transportId: string): void;
    updateTransport(stats: SfuTransport): void;
    
    removeInboundRtpPad(rtpPadId: string): void;
    updateInboundRtpPad(stats: SfuInboundRtpPad): void;

    removeOutboundRtpPad(rtpPadId: string): void;
    updateOutboundRtpPad(stats: SfuOutboundRtpPad): void;

    removeSctpChannel(sctpStreamId: string): void;
    updateSctpChannel(stats: SfuSctpChannel): void;
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
    transportId?: string;
}

interface InnerSfuMediaSinkEntry extends SfuMediaSinkEntry {
    outboundRtpPadIds: Set<string>;
    transportId?: string;
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
    }

    public removeTransport(transportId: string): void {
        this._transports.delete(transportId);
    }
    public updateTransport(stats: SfuTransport): void {
        const now = Date.now();
        const transportId = stats.transportId;
        const transports = this._transports;
        let entry = transports.get(transportId);
        if (!entry) {
            const inboundRtpPadsMap = this._inboundRtpPads;
            function *inboundRtpPads(): Generator<SfuInboundRtpPadEntry, void, undefined> {
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
            function *outboundRtpPads(): Generator<SfuOutboundRtpPadEntry, void, undefined> {
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
            function *sctpChannels(): Generator<SfuSctpChannelEntry, void, undefined> {
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
            function *mediaSinks(): Generator<SfuMediaSinkEntry, void, undefined> {
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
            function *mediaStreams(): Generator<SfuMediaStreamEntry, void, undefined> {
                const transportEntry = transports.get(transportId);
                if (!transportEntry) return;
                const mediaStreamIds = Array.from(transportEntry.mediaStreamIds);
                for (const mediaStreamId of mediaStreamIds) {
                    const mediaStream = mediaStreamsMap.get(mediaStreamId);
                    if (!mediaStream) continue;
                    yield mediaStream;
                }
            }
            const mediaSinkIds = Array.from(this._mediaSinks.values()).filter(sink => sink.transportId === transportId).map(sink => sink.id);
            const mediaStreamIds = Array.from(this._mediaStreams.values()).filter(stream => stream.transportId === transportId).map(stream => stream.id);
            const initialOutboundRtpPads = Array.from(this._outboundRtpPads.values()).filter(pad => pad.stats?.transportId === transportId);
            const initialInboundRtpPads = Array.from(this._inboundRtpPads.values()).filter(pad => pad.stats?.transportId === transportId);
            const intialSctpChannels = Array.from(this._sctpChannels.values()).filter(pad => pad.stats?.transportId === transportId);
            const newEntry: InnerSfuTransportEntry = entry = {
                id: transportId,
                stats,
                created: now,
                touched: now,
                updated: now,
                hashCode: "notHashed",
                inboundRtpPadIds: new Set<string>(initialInboundRtpPads.map(pad => pad.id)),
                outboundRtpPadIds: new Set<string>(initialOutboundRtpPads.map(pad => pad.id)),
                sctpChannelIds: new Set<string>(intialSctpChannels.map(channel => channel.id)),
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
                }
            };
            // need to do it twice because the first hash is hashed without the hash
            newEntry.hashCode = hash(stats);
            this._transports.set(transportId, newEntry);
        } else {
            entry.stats = stats;
            const newHashCode = hash(stats);
            if (entry.hashCode !== newHashCode) {
                entry.updated = now;
                entry.hashCode = newHashCode;
            }
            entry.touched = now;
        }
        
    }

    public updateInboundRtpPad(stats: SfuInboundRtpPad): void {
        const now = Date.now();
        const inboundRtpPadId = stats.padId;
        const inboundRtpPads = this._inboundRtpPads;
        let entry = inboundRtpPads.get(inboundRtpPadId);
        if (!entry) {
            const transportId = stats.transportId;
            const newEntry: SfuInboundRtpPadEntry = entry = {
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
                }
            }
            entry.hashCode = hash(stats);
            inboundRtpPads.set(newEntry.id, newEntry);

            // bind entry
            this._bind({
                transportId,
                kind: stats.mediaType,
                inboundRtpPadId,
                streamId: stats.streamId,
            });
        } else {
            entry.stats = stats;
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
        this._unbind({
            transportId: inboundRtpPad.stats.transportId,
            kind: inboundRtpPad.stats.mediaType,
            streamId: inboundRtpPad.stats.streamId,
            inboundRtpPadId,
        });
        this._inboundRtpPads.delete(inboundRtpPadId);
    }

    public updateOutboundRtpPad(stats: SfuOutboundRtpPad): void {
        const now = Date.now();
        const outboundRtpPadId = stats.padId;
        const outboundRtpPads = this._outboundRtpPads;
        let entry = outboundRtpPads.get(outboundRtpPadId);
        if (!entry) {
            const transportId = stats.transportId;
            const newEntry: SfuOutboundRtpPadEntry = entry = {
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
                }
            }
            entry.hashCode = hash(stats);
            outboundRtpPads.set(newEntry.id, newEntry);
            const { streamId, sinkId, mediaType: kind } = stats;
            this._bind({
                transportId,
                kind,
                streamId,
                sinkId,
                outboundRtpPadId,
            });
        } else {
            entry.stats = stats;
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
        this._unbind({
            transportId,
            kind,
            outboundRtpPadId,
            streamId,
            sinkId,
        });
        this._outboundRtpPads.delete(outboundRtpPadId);
    }

    public updateSctpChannel(stats: SfuSctpChannel): void {
        const now = Date.now();
        const { channelId: sctpChannelId } = stats;
        const sctpChannels = this._sctpChannels;
        let entry = sctpChannels.get(sctpChannelId);
        if (!entry) {
            const transportId = stats.transportId;
            const newEntry: SfuSctpChannelEntry = entry = {
                id: sctpChannelId,
                stats,
                created: now,
                touched: now,
                updated: now,
                hashCode: "notHashed",
                getTransport: () => {
                    return this._transports.get(transportId);
                },
            }
            entry.hashCode = hash(stats);
            this._sctpChannels.set(newEntry.id, newEntry);

            // bind entry
            this._bind({
                transportId,
                sctpChannelId,
            });
        } else {
            entry.stats = stats;
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
        this._unbind({
            transportId: sctpChannel.stats.transportId,
            sctpChannelId,
        });
        this._sctpChannels.delete(sctpChannelId);
    }


    public *transports(): Generator<SfuTransportEntry, void, undefined> {
        const entries = this._transports;
        const entryIds = Array.from(entries.keys());
        for (const entryId of entryIds) {
            const entry = entries.get(entryId);
            if (entry) yield entry
        }
    }

    public *inboundRtpPads(): Generator<SfuInboundRtpPadEntry, void, undefined> {
        const entries = this._inboundRtpPads;
        const entryIds = Array.from(entries.keys());
        for (const entryId of entryIds) {
            const entry = entries.get(entryId);
            if (entry) yield entry
        }
    }

    public *outboundRtpPads(): Generator<SfuOutboundRtpPadEntry, void, undefined> {
        const entries = this._outboundRtpPads;
        const entryIds = Array.from(entries.keys());
        for (const entryId of entryIds) {
            const entry = entries.get(entryId);
            if (entry) yield entry
        }
    }

    public *sctpChannels(): Generator<SfuSctpChannelEntry, void, undefined> {
        const entries = this._sctpChannels;
        const entryIds = Array.from(entries.keys());
        for (const entryId of entryIds) {
            const entry = entries.get(entryId);
            if (entry) yield entry
        }
    }

    public *mediaStreams(): Generator<SfuMediaStreamEntry, void, undefined> {
        const entries = this._mediaStreams;
        const entryIds = Array.from(entries.keys());
        for (const entryId of entryIds) {
            const entry = entries.get(entryId);
            if (entry) yield entry
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
            if (entry) yield entry
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

    private _bind({ 
        transportId,
        inboundRtpPadId,
        outboundRtpPadId,
        sctpChannelId,
        kind,
        streamId,
        sinkId,
    }: {
        transportId: string,
        kind?: SfuMediaStreamKind,
        streamId?: string,
        sinkId?: string,
        inboundRtpPadId?: string,
        outboundRtpPadId?: string,
        sctpChannelId?: string,
    }) {
        const transport = this._transports.get(transportId);
        if (transport) {
            if (inboundRtpPadId) {
                transport.inboundRtpPadIds.add(inboundRtpPadId);
            }
            if (outboundRtpPadId) {
                transport.outboundRtpPadIds.add(outboundRtpPadId);
            }
            if (sctpChannelId) {
                transport.sctpChannelIds.add(sctpChannelId);
            }
        }
        if (streamId) {
            const mediaStream = this._getOrCreateMediaStream({
                streamId,
                kind
            });
            if (transportId && !mediaStream.transportId) {
                mediaStream.transportId = transportId;
            }
            if (inboundRtpPadId) {
                mediaStream.inboundRtpPadIds.add(inboundRtpPadId);
            }
            if (sinkId) {
                mediaStream.mediaSinkIds.add(sinkId);
            }
            if (kind === "audio") {
                this._audioStreamIds.add(streamId);
            } else if (kind === "video") {
                this._videoStreamIds.add(streamId);
            }
        }
        
        if (sinkId && streamId) {
            const mediaSink = this._getOrCreateMediaSink({
                sinkId,
                streamId,
                kind
            });
            if (transportId && !mediaSink.transportId) {
                mediaSink.transportId = transportId;
            }
            if (outboundRtpPadId) {
                mediaSink.outboundRtpPadIds.add(outboundRtpPadId);
            }
            if (kind === "audio") {
                this._audioSinkIds.add(sinkId);
            } else if (kind === "video") {
                this._videoSinkIds.add(sinkId);
            }
        }
        
    }
    private _unbind({ 
        transportId,
        inboundRtpPadId,
        outboundRtpPadId,
        sctpChannelId,
        kind,
        streamId,
        sinkId,
    }: {
        transportId: string,
        kind?: SfuMediaStreamKind,
        streamId?: string,
        sinkId?: string,
        inboundRtpPadId?: string,
        outboundRtpPadId?: string,
        sctpChannelId?: string,
    }) {
        const transport = this._transports.get(transportId);
        if (transport) {
            if (inboundRtpPadId) {
                transport.inboundRtpPadIds.delete(inboundRtpPadId);
            }
            if (outboundRtpPadId) {
                transport.outboundRtpPadIds.delete(outboundRtpPadId);
            }
            if (sctpChannelId) {
                transport.sctpChannelIds.delete(sctpChannelId);
            }
        }
        let mediaStream: InnerSfuMediaStreamEntry | undefined;
        if (streamId) {
            mediaStream = this._mediaStreams.get(streamId);
            if (kind === "audio") {
                this._audioStreamIds.delete(streamId);
            } else if (kind === "video") {
                this._videoStreamIds.delete(streamId);
            }
        }
        if (mediaStream) {
            if (inboundRtpPadId) {
                mediaStream.inboundRtpPadIds.delete(inboundRtpPadId);
            }
            if (sinkId) {
                mediaStream.mediaSinkIds.delete(sinkId);
            }
            const references = mediaStream.getNumberOfInboundRtpPads() +
                mediaStream.getNumberOfMediaSinks();
            if (references < 1) {
                this._mediaStreams.delete(mediaStream.id);
            }
        }
        let mediaSink: InnerSfuMediaSinkEntry | undefined;
        if (sinkId) {
            mediaSink = this._mediaSinks.get(sinkId);
            if (kind === "audio") {
                this._audioSinkIds.delete(sinkId);
            } else if (kind === "video") {
                this._videoSinkIds.delete(sinkId);
            }
        }
        if (mediaSink) {
            if (outboundRtpPadId) {
                mediaSink.outboundRtpPadIds.delete(outboundRtpPadId);
            }
            const references = mediaSink.getNumberOfOutboundRtpPads();
            if (references < 1) {
                this._mediaSinks.delete(mediaSink.id);
            }
        }
    }

    private _getOrCreateMediaStream({
        streamId,
        kind    
    }: {
        streamId: string,
        kind: SfuMediaStreamKind
    }): InnerSfuMediaStreamEntry 
    {
        const mediaStreams = this._mediaStreams;
        let result = mediaStreams.get(streamId);
        if (result) return result;
        const inboundRtpPadsMap = this._inboundRtpPads;
        function *inboundRtpPads(): Generator<SfuInboundRtpPadEntry, void, undefined> {
            const mediaStream = mediaStreams.get(streamId);
            if (!mediaStream) return;
            const inboundRtpPadIds = Array.from((mediaStream.inboundRtpPadIds));
            for (const inboundRtpPadId of inboundRtpPadIds) {
                const inboundRtpPad = inboundRtpPadsMap.get(inboundRtpPadId);
                if (!inboundRtpPad) continue;
                yield inboundRtpPad;
            }
        }
        const mediaSinksMap = this._mediaSinks;
        function *mediaSinks(): Generator<SfuMediaSinkEntry, void, undefined> {
            const mediaStream = mediaStreams.get(streamId);
            if (!mediaStream) return;
            const mediaSinkIds = Array.from((mediaStream.mediaSinkIds));
            for (const mediaSinkId of mediaSinkIds) {
                const mediaSink = mediaSinksMap.get(mediaSinkId);
                if (!mediaSink) continue;
                yield mediaSink;
            }
        }
        const inboundRtpPadIds = Array.from(this._inboundRtpPads.values()).filter(pad => pad.stats.streamId === streamId).map(pad => pad.id);
        const mediaSinkIds = Array.from(this._mediaSinks.values()).filter(mediaSink => mediaSink.getMediaStream()?.id === streamId).map(sink => sink.id);
        const mediaStream: InnerSfuMediaStreamEntry = result = {
            id: streamId,
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
            }
        };
        mediaStreams.set(streamId, mediaStream);
        return result;
    }

    private _getOrCreateMediaSink({
        streamId,
        sinkId,
        kind,
    }: {
        streamId: string,
        sinkId: string,
        kind: SfuMediaStreamKind
    }): InnerSfuMediaSinkEntry {
        const mediaSinks = this._mediaSinks;
        let result = mediaSinks.get(sinkId);
        if (result) return result;
        const outboundRtpPadsMap = this._outboundRtpPads;
        function *outboundRtpPads(): Generator<SfuOutboundRtpPadEntry, void, undefined> {
            const mediaSink = mediaSinks.get(sinkId);
            if (!mediaSink) return;
            const outboundRtpPadIds = Array.from((mediaSink.outboundRtpPadIds));
            for (const outboundRtpPadId of outboundRtpPadIds) {
                const outboundRtpPad = outboundRtpPadsMap.get(outboundRtpPadId);
                if (!outboundRtpPad) continue;
                yield outboundRtpPad;
            }
        }
        const outboundRtpPadIds = Array.from(this._outboundRtpPads.values()).filter(pad => pad.stats.sinkId === sinkId).map(pad => pad.id);
        const mediaSink: InnerSfuMediaSinkEntry = result = {
            id: sinkId,
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
            }
        }
        mediaSinks.set(sinkId, mediaSink);
        return result;
    }
}