import { StatsWriter } from "./entries/StatsStorage";
import { Collector } from "./Collector";
import { SfuTransport, SfuInboundRtpPad, SfuOutboundRtpPad, SfuSctpChannel } from "@observertc/sample-schemas-js";
import { v4 as uuidv4 } from "uuid";
import { createLogger } from "./utils/logger";

const logger = createLogger(`AuxCollector`);

export type TransportStatsSupplier = () => Promise<SfuTransport>;
export type InboundRtpPadStatsSupplier = () => Promise<SfuInboundRtpPad>;
export type OutboundRtpPadStatsSupplier = () => Promise<SfuOutboundRtpPad>;
export type SctpStreamStatsSupplier = () => Promise<SfuSctpChannel>;


/**
 * Interface for auxiliary collectors.
 */
export interface AuxCollector {
    /**
     * Adds a transport stats supplier for a given transport ID.
     * @param transportId - The identifier of the transport.
     * @param supplier - The transport stats supplier.
     */
    addTransportStatsSupplier(transportId: string, supplier: TransportStatsSupplier): void;

    /**
     * Removes a transport stats supplier for a given transport ID.
     * @param transportId - The identifier of the transport.
     */
    removeTransportStatsSupplier(transportId: string): void;

    /**
     * Adds an inbound RTP pad stats supplier for a given inbound RTP pad ID.
     * @param inboundRtpPadId - The identifier of the inbound RTP pad.
     * @param supplier - The inbound RTP pad stats supplier.
     */
    addInboundRtpPadStatsSupplier(inboundRtpPadId: string, supplier: InboundRtpPadStatsSupplier): void;

    /**
     * Removes an inbound RTP pad stats supplier for a given inbound RTP pad ID.
     * @param inboundRtpPadId - The identifier of the inbound RTP pad.
     */
    removeInboundRtpPadStatsSupplier(inboundRtpPadId: string): void;

    /**
     * Adds an outbound RTP pad stats supplier for a given outbound RTP pad ID.
     * @param outboundRtpPadId - The identifier of the outbound RTP pad.
     * @param supplier - The outbound RTP pad stats supplier.
     */
    addOutboundRtpPadStatsSupplier(outboundRtpPadId: string, supplier: OutboundRtpPadStatsSupplier): void;

    /**
     * Removes an outbound RTP pad stats supplier for a given outbound RTP pad ID.
     * @param outboundRtpPadId - The identifier of the outbound RTP pad.
     */
    removeOutboundRtpPadStatsSupplier(outboundRtpPadId: string): void;

    /**
     * Adds an SCTP stream stats supplier for a given SCTP stream ID.
     * @param sctpStreamId - The identifier of the SCTP stream.
     * @param supplier - The SCTP stream stats supplier.
     */
    addSctpStreamStatsSupplier(sctpStreamId: string, supplier: SctpStreamStatsSupplier): void;

    /**
     * Removes an SCTP stream stats supplier for a given SCTP stream ID.
     * @param sctpStreamId - The identifier of the SCTP stream.
     */
    removeSctpStreamSupplier(sctpStreamId: string): void;
}



export abstract class AuxCollectorImpl implements AuxCollector, Collector {
    public readonly id = uuidv4();

    private _transportStatsSuppliers: Map<string, TransportStatsSupplier> = new Map();
    private _inboundRtpPadStatsSupplier: Map<string, InboundRtpPadStatsSupplier> = new Map();
    private _outboundRtpPadStatsSupplier: Map<string, OutboundRtpPadStatsSupplier> = new Map();
    private _sctpStreamStatsSupplier: Map<string, SctpStreamStatsSupplier> = new Map();
    private _closed = false;
    public constructor(
        private readonly _statsWriter: StatsWriter,
    ) {
    }

    public createFetchers(): (() => Promise<void>)[] {
        const result: (() => Promise<void>)[] = [];
        for (const transportStatsSupplier of this._transportStatsSuppliers.values()) {
            result.push(() => transportStatsSupplier().then(stats => {
                this._statsWriter.updateTransport(stats);
            }));
        }

        for (const inboundRtpPadSupplier of this._inboundRtpPadStatsSupplier.values()) {
            result.push(() => inboundRtpPadSupplier().then(stats => {
                this._statsWriter.updateInboundRtpPad(stats);
            }));
        }

        for (const outboundRtpPadSupplier of this._outboundRtpPadStatsSupplier.values()) {
            result.push(() => outboundRtpPadSupplier().then(stats => {
                this._statsWriter.updateOutboundRtpPad(stats);
            }));
        }

        for (const sctpStreamsSupplier of this._sctpStreamStatsSupplier.values()) {
            result.push(() => sctpStreamsSupplier().then(stats => {
                this._statsWriter.updateSctpChannel(stats);
            }));
        }

        return result;
    }

    public addTransportStatsSupplier(transportId: string, supplier: TransportStatsSupplier) {
        if (this._transportStatsSuppliers.has(transportId)) {
            logger.warn(`Cannot add ${transportId} supplier twice`);
            return;
        }
        this._transportStatsSuppliers.set(transportId, supplier);
    }

    public removeTransportStatsSupplier(transportId: string) {
        this._transportStatsSuppliers.delete(transportId);
    }

    public addInboundRtpPadStatsSupplier(inboundRtpPadId: string, supplier: InboundRtpPadStatsSupplier) {
        if (this._inboundRtpPadStatsSupplier.has(inboundRtpPadId)) {
            logger.warn(`Cannot add ${inboundRtpPadId} supplier twice`);
            return;
        }
        this._inboundRtpPadStatsSupplier.set(inboundRtpPadId, supplier);
    }

    public removeInboundRtpPadStatsSupplier(inboundRtpPadId: string) {
        this._inboundRtpPadStatsSupplier.delete(inboundRtpPadId);
    }

    public addOutboundRtpPadStatsSupplier(outboundRtpPadId: string, supplier: OutboundRtpPadStatsSupplier) {
        if (this._outboundRtpPadStatsSupplier.has(outboundRtpPadId)) {
            logger.warn(`Cannot add ${outboundRtpPadId} supplier twice`);
            return;
        }
        this._outboundRtpPadStatsSupplier.set(outboundRtpPadId, supplier);
    }

    public removeOutboundRtpPadStatsSupplier(outboundRtpPadId: string) {
        this._outboundRtpPadStatsSupplier.delete(outboundRtpPadId);
    }

    public addSctpStreamStatsSupplier(sctpStreamId: string, supplier: SctpStreamStatsSupplier) {
        if (this._sctpStreamStatsSupplier.has(sctpStreamId)) {
            logger.warn(`Cannot add ${sctpStreamId} supplier twice`);
            return;
        }
        this._sctpStreamStatsSupplier.set(sctpStreamId, supplier);
    }

    public removeSctpStreamSupplier(sctpStreamId: string) {
        this._sctpStreamStatsSupplier.delete(sctpStreamId);
    }

    public get closed() {
        return this._closed;
    }

    public close(): void {
        if (this._closed) {
            logger.warn(`Attempted to close Collector twice`);
            return;
        }
        try {
            const transportIds = Array.from(this._transportStatsSuppliers.keys());
            for (const transportId of transportIds) {
                this.removeTransportStatsSupplier(transportId);
            }
            const inboundRtpIds = Array.from(this._outboundRtpPadStatsSupplier.keys());
            for (const inboundRtpId of inboundRtpIds) {
                this.removeInboundRtpPadStatsSupplier(inboundRtpId);
            }
            const outboundRtpIds = Array.from(this._inboundRtpPadStatsSupplier.keys());
            for (const outboundRtpId of outboundRtpIds) {
                this.removeOutboundRtpPadStatsSupplier(outboundRtpId);
            }
            const sctpStreamIds = Array.from(this._sctpStreamStatsSupplier.keys());
            for (const sctpStreamId of sctpStreamIds) {
                this.removeSctpStreamSupplier(sctpStreamId);
            }
        } finally {
            try {
                this.onClose();
            } catch (err) {
                logger.error(`Error occurred while closing collector`, err);
            }
            this._closed = true;
            logger.info(`Closed`);
        }
    }

    protected abstract onClose(): void;
}
