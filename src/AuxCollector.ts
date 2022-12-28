import { StatsWriter } from "./entries/StatsStorage";
import { Collector } from "./Collector";
import { SfuTransport, SfuInboundRtpPad, SfuOutboundRtpPad, SfuSctpChannel } from "@observertc/schemas";
import { PromiseFetcher } from "./utils/PromiseFetcher";
import { v4 as uuidv4 } from "uuid";
import { createLogger } from "./utils/logger";

const logger = createLogger(`AuxCollector`);

export type AuxCollectorConfig = {
    /**
     * The custom provided id for the collector
     * If this is not given than the collector generates a random UUID.
     */
    id?: string;
    /**
     * Limits the number of stats pulled at once. When you have 100 inbound rtp and 1000 outbound rtp pad,
     * and the batchSize is 50, then the collector poll 50,50 stats for inbound rtp and then 50, 50, ...
     * for the outbound rtp.
     */
    batchSize?: number;
};
const supplyDefaultConfig = () => {
    const result: AuxCollectorConfig = {
        id: uuidv4(),
    };
    return result;
};

export type TransportStatsSupplier = () => Promise<SfuTransport>;
export type InboundRtpPadStatsSupplier = () => Promise<SfuInboundRtpPad>;
export type OutboundRtpPadStatsSupplier = () => Promise<SfuOutboundRtpPad>;
export type SctpStreamStatsSupplier = () => Promise<SfuSctpChannel>;

export class AuxCollector implements Collector {
    public static create(config?: AuxCollectorConfig): AuxCollector {
        const appliedConfig: AuxCollectorConfig = Object.assign(supplyDefaultConfig(), config);
        const collector = new AuxCollector(appliedConfig);
        logger.debug(`Created`, appliedConfig);
        return collector;
    }

    public readonly id: string;
    private _config: AuxCollectorConfig;
    private _statsWriter?: StatsWriter;
    private _transportStatsSuppliers: Map<string, TransportStatsSupplier> = new Map();
    private _inboundRtpPadStatsSupplier: Map<string, InboundRtpPadStatsSupplier> = new Map();
    private _outboundRtpPadStatsSupplier: Map<string, OutboundRtpPadStatsSupplier> = new Map();
    private _sctpStreamStatsSupplier: Map<string, SctpStreamStatsSupplier> = new Map();
    private _closed = false;
    private constructor(config: AuxCollectorConfig) {
        this._config = config;
        this.id = config.id ?? uuidv4();
    }

    public get hasStatsWriter(): boolean {
        return !!this._statsWriter;
    }

    public setStatsWriter(value: StatsWriter | null) {
        if (this._statsWriter) {
            logger.warn(`StatsWriter has already been set`);
            return;
        }
        if (value === null) {
            this._statsWriter = undefined;
        } else {
            this._statsWriter = value;
        }
    }

    public async collect(): Promise<void> {
        if (this._closed) {
            logger.debug("Collector is already closed");
            return;
        }
        if (!this._statsWriter) {
            logger.debug(`Output of the collector has not been set`);
            return;
        }
        const batchSize = this._config.batchSize ?? 0;
        const transportStatsSupplierEntries = Array.from(this._transportStatsSuppliers.entries());
        const transportStatsPromises = PromiseFetcher.builder<SfuTransport>()
            .withBatchSize(batchSize)
            .withPromiseSuppliers(...transportStatsSupplierEntries.map((entry) => entry[1]))
            .onCatchedError((err, index) => {
                const entry = transportStatsSupplierEntries[index];
                const entryId = entry[0];
                logger.warn(`Transport stats supplier (${entryId}) reported an error. It will not be used again`, err);

                this._transportStatsSuppliers.delete(entry[0]);
            })
            .build();
        const inboundRtpPadEntries = Array.from(this._inboundRtpPadStatsSupplier.entries());
        const inboundRtpPadStatsPromises = PromiseFetcher.builder<SfuInboundRtpPad>()
            .withBatchSize(batchSize)
            .withPromiseSuppliers(...inboundRtpPadEntries.map((entry) => entry[1]))
            .onCatchedError((err, index) => {
                const entry = inboundRtpPadEntries[index];
                const entryId = entry[0];
                logger.warn(
                    `Inbound Rtp Pad stats collector (${entryId}) reported an error, it will not be used again`,
                    err
                );
                this._inboundRtpPadStatsSupplier.delete(entry[0]);
            })
            .build();

        const outboundRtpPadEntries = Array.from(this._outboundRtpPadStatsSupplier.entries());
        const outboundRtpPadStatsPromises = PromiseFetcher.builder<SfuOutboundRtpPad>()
            .withBatchSize(batchSize)
            .withPromiseSuppliers(...outboundRtpPadEntries.map((entry) => entry[1]))
            .onCatchedError((err, index) => {
                const entry = outboundRtpPadEntries[index];
                const entryId = entry[0];
                logger.warn(
                    `Outbound Rtp Pad stats collector (${entryId}) reported an error, it will not be used again`,
                    err
                );
                this._outboundRtpPadStatsSupplier.delete(entry[0]);
            })
            .build();

        const sctpStreamEntries = Array.from(this._sctpStreamStatsSupplier.entries());
        const sctpStreamStatsPromises = PromiseFetcher.builder<SfuSctpChannel>()
            .withBatchSize(batchSize)
            .withPromiseSuppliers(...sctpStreamEntries.map((entry) => entry[1]))
            .onCatchedError((err, index) => {
                const entry = sctpStreamEntries[index];
                const entryId = entry[0];
                logger.warn(
                    `Sctp Stream stats collector (${entryId}) reported an error, it will not be used again`,
                    err
                );
                this._sctpStreamStatsSupplier.delete(entry[0]);
            })
            .build();
        if (this._closed) {
            logger.debug(`Collector is closed while it was collecting`);
            return;
        }
        for await (const transportStats of transportStatsPromises.values()) {
            if (!transportStats) continue;
            this._statsWriter.updateTransport(transportStats);
        }
        for await (const inboundRtpStats of inboundRtpPadStatsPromises.values()) {
            if (!inboundRtpStats) continue;
            this._statsWriter.updateInboundRtpPad(inboundRtpStats);
        }
        for await (const outboundRtpStats of outboundRtpPadStatsPromises.values()) {
            if (!outboundRtpStats) continue;
            this._statsWriter.updateOutboundRtpPad(outboundRtpStats);
        }
        for await (const sctpStreamStats of sctpStreamStatsPromises.values()) {
            if (!sctpStreamStats) continue;
            this._statsWriter.updateSctpChannel(sctpStreamStats);
        }
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
        if (this._statsWriter) {
            this._statsWriter.removeTransport(transportId);
        }
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
        if (this._statsWriter) {
            this._statsWriter.removeInboundRtpPad(inboundRtpPadId);
        }
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
        if (this._statsWriter) {
            this._statsWriter.removeOutboundRtpPad(outboundRtpPadId);
        }
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
        if (this._statsWriter) {
            this._statsWriter.removeSctpChannel(sctpStreamId);
        }
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
            this._statsWriter = undefined;
        } finally {
            this._closed = true;
            logger.info(`Closed`);
        }
    }
}
