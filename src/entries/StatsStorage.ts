import { 
    SfuSctpChannel, 
    SfuInboundRtpPad, 
    SfuOutboundRtpPad, 
    SfuTransport, 
    CustomSfuEvent
} from "@observertc/sample-schemas-js";
import {
    SfuInboundRtpPadEntry,
    SfuOutboundRtpPadEntry,
    SfuSctpChannelEntry,
    SfuTransportEntry,
} from "./StatsEntryInterfaces";
// import { createLogger } from "../utils/logger";
import { SFU_EVENT } from "../utils/common";

// const logger = createLogger(`StatsStorage`);

/**
 * Collection of methods to read the collected and organized stats
 */
export interface StatsReader {
    /**
     * Iterable iterator to list all collected transports
     */
    transports(): Generator<SfuTransportEntry, void, undefined>;

    /**
     * Gets the monitored object based on identifier
     * @param id the identifier of the transport the monitored entry belongs to
     */
    getTransportEntry(id: string): SfuTransportEntry | undefined;

    /**
     * Iterable iterator to list all collected inbound rtp pads
     */
    inboundRtpPads(): Generator<SfuInboundRtpPadEntry, void, undefined>;

    /**
     * Gets the monitored object based on identifier
     * @param id the identifier of the inbound RTP stream the monitored entry belongs to
     */
    getInboundRtpPad(id: string): SfuInboundRtpPadEntry | undefined;

    /**
     * Iterable iterator to list all collected outbound rtp pads
     */
    outboundRtpPads(): Generator<SfuOutboundRtpPadEntry, void, undefined>;

    /**
     * Gets the monitored object based on identifier
     * @param id the identifier of the outbound RTP stream the monitored entry belongs to
     */
    getOutboundRtpPad(id: string): SfuOutboundRtpPadEntry | undefined;

    /**
     * Iterable iterator to list all collected sctp channels
     */
    sctpChannels(): Generator<SfuSctpChannelEntry, void, undefined>;

    /**
     * Gets the monitored object based on identifier
     * @param id the identifier of the SCTP channel the monitored entry belongs to
     */
    getSctpChannel(id: string): SfuSctpChannelEntry | undefined;


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
     * Dump the content of the storage
     * @param withStats flag indicating if the stats of the entries should be included or not
     */
    dump(withStats: boolean): string;
}

export interface StatsWriter {
    updateTransport(stats: SfuTransport): void;

    updateInboundRtpPad(stats: SfuInboundRtpPad): void;

    updateOutboundRtpPad(stats: SfuOutboundRtpPad): void;

    updateSctpChannel(stats: SfuSctpChannel): void;
}

interface InnerSfuTransportEntry extends SfuTransportEntry { 
    visited: boolean 
}

interface InnerSfuInboundRtpPadEntry extends SfuInboundRtpPadEntry { 
    visited: boolean 
}

interface InnerSfuOutboundRtpPadEntry extends SfuOutboundRtpPadEntry { 
    visited: boolean 
}

interface InnerSfuSctpChannelEntry extends SfuSctpChannelEntry { 
    visited: boolean 
}

export class StatsStorage implements StatsReader, StatsWriter {
    private _transports: Map<string, InnerSfuTransportEntry> = new Map();
    private _inboundRtpPads: Map<string, InnerSfuInboundRtpPadEntry> = new Map();
    private _outboundRtpPads: Map<string, InnerSfuOutboundRtpPadEntry> = new Map();
    private _sctpChannels: Map<string, InnerSfuSctpChannelEntry> = new Map();

    public constructor(
        private _addCustomSfuEvent?: (event: CustomSfuEvent) => void,
    ) {
        // empty block
    }

    public clean() {
        for (const inboundRtpPad of Array.from(this._inboundRtpPads.values())) {
            if (inboundRtpPad.visited) {
                inboundRtpPad.visited = false;
            } else {
                this._addCustomSfuEvent?.({
                    name: SFU_EVENT.SFU_RTP_STREAM_REMOVED,
                    timestamp: Date.now(),
                    transportId: inboundRtpPad.stats.transportId,
                    sfuStreamId: inboundRtpPad.stats.streamId,
                    value: inboundRtpPad.stats.padId
                });
                this._inboundRtpPads.delete(inboundRtpPad.id);
            }
        }

        for (const outboundRtpPad of Array.from(this._outboundRtpPads.values())) {
            if (outboundRtpPad.visited) {
                outboundRtpPad.visited = false;
            } else {
                this._addCustomSfuEvent?.({
                    name: SFU_EVENT.SFU_RTP_STREAM_REMOVED,
                    timestamp: Date.now(),
                    transportId: outboundRtpPad.stats.transportId,
                    sfuStreamId: outboundRtpPad.stats.streamId,
                    sfuSinkId: outboundRtpPad.stats.sinkId,
                    value: outboundRtpPad.stats.padId
                });
                this._outboundRtpPads.delete(outboundRtpPad.id);
            }
        }

        for (const sctpChannel of Array.from(this._sctpChannels.values())) {
            if (sctpChannel.visited) {
                sctpChannel.visited = false;
            } else {
                this._sctpChannels.delete(sctpChannel.id);
            }
        }

        for (const transport of Array.from(this._transports.values())) {
            if (transport.visited) {
                transport.visited = false;
            } else {
                this._addCustomSfuEvent?.({
                    name: SFU_EVENT.SFU_TRANSPORT_CLOSED,
                    timestamp: Date.now(),
                    transportId: transport.id,
                });
                this._transports.delete(transport.id);
            }
        }
    }
    
    public updateTransport(stats: SfuTransport): void {
        const transportId = stats.transportId;
        const transports = this._transports;
        let entry = transports.get(transportId);
        if (!entry) {
            const inboundRtpPadsMap = this._inboundRtpPads;
            /* eslint-disable no-inner-declarations */
            function* inboundRtpPads(): IterableIterator<SfuInboundRtpPadEntry> {
                const transportEntry = transports.get(transportId);
                if (!transportEntry) return;
                for (const entry of inboundRtpPadsMap.values()) {
                    if (entry.stats.transportId !== transportId) continue;
                    yield entry;
                }
            }
            const outboundRtpPadsMap = this._outboundRtpPads;
            /* eslint-disable no-inner-declarations */
            function* outboundRtpPads(): IterableIterator<SfuOutboundRtpPadEntry> {
                const transportEntry = transports.get(transportId);
                if (!transportEntry) return;
                for (const entry of outboundRtpPadsMap.values()) {
                    if (entry.stats.transportId !== transportId) continue;
                    yield entry;
                }
            }
            const sctpChannelsMap = this._sctpChannels;
            /* eslint-disable no-inner-declarations */
            function* sctpChannels(): IterableIterator<SfuSctpChannelEntry> {
                const transportEntry = transports.get(transportId);
                if (!transportEntry) return;
                for (const entry of sctpChannelsMap.values()) {
                    if (entry.stats.transportId !== transportId) continue;
                    yield entry;
                }
            }
            const newEntry: InnerSfuTransportEntry = (entry = {
                appData: {},
                internal: !!stats.internal,
                id: transportId,
                stats,
                visited: true,

                inboundRtpPads,
                outboundRtpPads,
                sctpChannels,
            });
            this._transports.set(transportId, newEntry);

            this._addCustomSfuEvent?.({
                name: SFU_EVENT.SFU_TRANSPORT_OPENED,
                timestamp: Date.now(),
                transportId: newEntry.stats.transportId,
            });
        } else {
            entry.stats = {
                ...entry.stats,
                ...stats,
            };
            entry.visited = true;
        }
        
    }

    public updateInboundRtpPad(stats: SfuInboundRtpPad): void {
        const inboundRtpPadId = stats.padId;
        const inboundRtpPads = this._inboundRtpPads;
        let entry = inboundRtpPads.get(inboundRtpPadId);
        if (!entry) {
            const transportId = stats.transportId;
            const newEntry: InnerSfuInboundRtpPadEntry = (entry = {
                appData: {},
                id: inboundRtpPadId,
                internal: !!stats.internal,
                stats,
                visited: true,
                getTransport: () => {
                    return this._transports.get(transportId);
                },
            });
            inboundRtpPads.set(newEntry.id, newEntry);

            this._addCustomSfuEvent?.({
                name: SFU_EVENT.SFU_RTP_STREAM_ADDED,
                timestamp: Date.now(),
                transportId: newEntry.stats.transportId,
                sfuStreamId: newEntry.stats.streamId,
                value: newEntry.stats.padId
            });
        } else {
            entry.stats = {
                ...entry.stats,
                ...stats,
            };
            entry.visited = false;
        }
    }

    public updateOutboundRtpPad(stats: SfuOutboundRtpPad): void {
        const outboundRtpPadId = stats.padId;
        const outboundRtpPads = this._outboundRtpPads;
        let entry = outboundRtpPads.get(outboundRtpPadId);
        if (!entry) {
            const transportId = stats.transportId;
            const newEntry: InnerSfuOutboundRtpPadEntry = (entry = {
                appData: {},
                id: outboundRtpPadId,
                internal: !!stats.internal,
                stats,
                visited: true,
                getTransport: () => {
                    return this._transports.get(transportId);
                },
            });
            outboundRtpPads.set(newEntry.id, newEntry);

            this._addCustomSfuEvent?.({
                name: SFU_EVENT.SFU_RTP_STREAM_ADDED,
                timestamp: Date.now(),
                transportId: newEntry.stats.transportId,
                sfuStreamId: newEntry.stats.streamId,
                sfuSinkId: newEntry.stats.sinkId,
                value: newEntry.stats.padId
            });
        } else {
            entry.stats = {
                ...entry.stats,
                ...stats,
            };
            entry.visited = false;
        }
    }

    public updateSctpChannel(stats: SfuSctpChannel): void {
        const { channelId: sctpChannelId } = stats;
        const sctpChannels = this._sctpChannels;
        let entry = sctpChannels.get(sctpChannelId);
        if (!entry) {
            const transportId = stats.transportId;
            const newEntry: InnerSfuSctpChannelEntry = (entry = {
                appData: {},
                id: sctpChannelId,
                stats,
                visited: true,
                getTransport: () => {
                    return this._transports.get(transportId);
                },
            });
            this._sctpChannels.set(newEntry.id, newEntry);
        } else {
            entry.stats = {
                ...entry.stats,
                ...stats,
            };
            entry.visited = true;
        }
    }

    public *transports(): Generator<SfuTransportEntry, void, undefined> {
        const entries = this._transports;
        const entryIds = Array.from(entries.keys());
        for (const entryId of entryIds) {
            const entry = entries.get(entryId);
            if (entry) yield entry;
        }
    }

    public getTransportEntry(id: string): SfuTransportEntry | undefined {
        
        return this._transports.get(id);
    }

    public *inboundRtpPads(): Generator<SfuInboundRtpPadEntry, void, undefined> {
        const entries = this._inboundRtpPads;
        const entryIds = Array.from(entries.keys());
        for (const entryId of entryIds) {
            const entry = entries.get(entryId);
            if (entry) yield entry;
        }
    }

    public getInboundRtpPad(id: string): SfuInboundRtpPadEntry | undefined {
        return this._inboundRtpPads.get(id);
    }

    public *outboundRtpPads(): Generator<SfuOutboundRtpPadEntry, void, undefined> {
        const entries = this._outboundRtpPads;
        const entryIds = Array.from(entries.keys());
        for (const entryId of entryIds) {
            const entry = entries.get(entryId);
            if (entry) yield entry;
        }
    }

    public getOutboundRtpPad(id: string): SfuOutboundRtpPadEntry | undefined {
        return this._outboundRtpPads.get(id);
    }

    public *sctpChannels(): Generator<SfuSctpChannelEntry, void, undefined> {
        const entries = this._sctpChannels;
        const entryIds = Array.from(entries.keys());
        for (const entryId of entryIds) {
            const entry = entries.get(entryId);
            if (entry) yield entry;
        }
    }

    public getSctpChannel(id: string): SfuSctpChannelEntry | undefined {
        return this._sctpChannels.get(id);
    }

    public getNumberOfTransports(): number {
        return this._transports.size;
    }

    public getNumberOfInboundRtpPads(): number {
        return this._inboundRtpPads.size;
    }

    public getNumberOfOutboundRtpPads(): number {
        return this._outboundRtpPads.size;
    }

    public getNumberOfSctpChannels(): number {
        return this._sctpChannels.size;
    }

    public dump(withStats = false) {
        const dumpObj = (obj: { [s: string]: unknown } | ArrayLike<unknown> | undefined) =>
            obj ? Array.from(Object.entries(obj)).map(([key, value]) => `${key}: ${value}`) : ["undefined"];
        const transportLogs: string[] = [];
        for (const [transportId, transport] of this._transports.entries()) {
            const transportLog: string[] = [
                `TransportId: ${transportId}`,
                `inboundRtpPadIds: ${Array.from(transport.inboundRtpPads()).map(e => e.id).join(", ")}`,
                `outboundRtpPadIds: ${Array.from(transport.outboundRtpPads()).map(e => e.id).join(", ")}`,
                `sctpChannelIds: ${Array.from(transport.sctpChannels()).map(e => e.id).join(", ")}`,
            ];
            if (withStats) {
                transportLog.push(
                    `appData:`,
                    ...dumpObj(transport.appData).map((line) => `\t${line}`),
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
            ];
            if (withStats) {
                inboundRtpPadLog.push(
                    `appData:`,
                    ...dumpObj(inboundRtpPad.appData).map((line) => `\t${line}`),
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
            ];
            if (withStats) {
                inboundRtpPadLog.push(
                    `appData:`,
                    ...dumpObj(outboundRtpPad.appData).map((line) => `\t${line}`),
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
                    `appData:`,
                    ...dumpObj(sctpChannel.appData).map((line) => `\t${line}`),
                    `stats:`,
                    ...dumpObj(sctpChannel.stats).map((line) => `\t${line}`)
                );
            }
            sctpChannelLogs.push(...sctpChannelLog.map((line) => `\t${line}`), `\n`);
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
        ];
        return entries.join("\n");
    }
}
