import { StatsWriter } from "../entries/StatsStorage";
import { Collector } from "../Collector";
import { v4 as uuidv4 } from "uuid";
import { createLogger } from "../utils/logger";
import { Collectors } from "../Collectors";
import {
    MediasoupRouterCollector,
    MediasoupRouterCollectorConfig,
    TransportTypeFunction,
} from "./MediasoupRouterCollector";
import { MediasoupNewRouterListener, MediasoupWorker } from "./MediasoupTypes";
import { hash } from "../utils/hash";
import { Appendix } from "../entries/StatsEntryInterfaces";

const logger = createLogger(`MediasoupWorkerCollector`);

export type MediasoupWorkerCollectorConfig = {
    /**
     * The type of the transport attempted to watch
     */
    getTransportType?: TransportTypeFunction;

    /**
     * Indicate if we want to poll the webrtc transport stats
     *
     * DEFAULT: false,
     */
    pollWebRtcTransportStats?: (transportId: string) => boolean;

    /**
     * Indicate if we want to poll the plain rtp transport stats
     *
     * DEFAULT: false,
     */
    pollPlainRtpTransportStats?: (transportId: string) => boolean;

    /**
     * Indicate if we want to poll the pipe transport stats
     *
     * DEFAULT: false,
     */
    pollPipeTransportStats?: (transportId: string) => boolean;

    /**
     * Indicate if we want to poll the direct transport stats
     *
     * DEFAULT: false,
     */
    pollDirectTransportStats?: (transportId: string) => boolean;

    /**
     * Indicate if we want to poll the producer stats
     *
     * DEFAULT: false,
     */
    pollProducerStats?: (producerId: string) => boolean;

    /**
     * Indicate if we want to poll the consumer stats
     *
     * DEFAULT: false,
     */
    pollConsumerStats?: (consumerId: string) => boolean;

    /**
     * Indicate if we want to poll the dataProducer stats
     *
     * DEFAULT: false,
     */
    pollDataProducerStats?: (dataProducerId: string) => boolean;

    /**
     * Indicate if we want to poll the data consumer stats
     *
     * DEFAULT: false,
     */
    pollDataConsumerStats?: (dataConsumerId: string) => boolean;

    /**
     * Add custom arbitrary data to the transport entries
     * in the StatsStorage can be accessed via StatsReader
     */
    transportAppendix?: Appendix;

    /**
     * Add custom arbitrary data to the inbound rtp pad entries
     * in the StatsStorage can be accessed via StatsReader
     */
    inboundRtpApppendix?: Appendix;

    /**
     * Add custom arbitrary data to the outbound rtp pad entries
     * in the StatsStorage can be accessed via StatsReader
     */
    outboundRtpAppendix?: Appendix;

    /**
     * Add custom arbitrary data to the sctp channel entries
     * in the StatsStorage can be accessed via StatsReader
     */
    sctpChannelAppendix?: Appendix;
};

const supplyDefaultConfig = () => {
    const result: MediasoupRouterCollectorConfig = {};
    return result;
};

export class MediasoupWorkerCollector implements Collector {
    public readonly id = uuidv4();
    private _parent: Collectors;
    private _closed = false;
    private _config: MediasoupWorkerCollectorConfig;
    private _statsWriter?: StatsWriter;
    private _worker: MediasoupWorker;
    private _newRouterListener: MediasoupNewRouterListener;
    public constructor(parent: Collectors, worker: MediasoupWorker, config?: MediasoupWorkerCollectorConfig) {
        this.id = `mediasoup-worker-${hash(worker.pid)}`;
        this._parent = parent;
        this._worker = worker;
        this._config = this._config = Object.assign(supplyDefaultConfig(), config);
        this._worker.observer.once("close", () => {
            this.close();
            logger.debug(`Worker ${this.id} is removed from watch`);
        });
        const collectorsFacade = this._createCollectorsFacade();
        this._newRouterListener = (router) => {
            if (!this._statsWriter) {
                logger.warn(`Cannot create corresponded collectors without statswriter`);
                return;
            }
            const routerCollectorConfig: MediasoupRouterCollectorConfig = {
                ...this._config,
            };
            const routerCollector = new MediasoupRouterCollector(collectorsFacade, router, routerCollectorConfig);
            if (!routerCollector.hasStatsWriter) {
                routerCollector.setStatsWriter(this._statsWriter);
            }
            this._parent.add(routerCollector);
        };
        worker.observer.on("newrouter", this._newRouterListener);
        logger.debug(`Worker ${this.id} is watched`);
    }

    public get hasStatsWriter(): boolean {
        return !!this._statsWriter;
    }

    public setStatsWriter(value: StatsWriter | null) {
        if (this._statsWriter && value !== null) {
            logger.warn(`StatsWriter has already been set`);
            return;
        }
        if (value === null) {
            this._statsWriter = undefined;
        } else {
            this._statsWriter = value;
        }
    }

    private _createCollectorsFacade(): Collectors {
        const collectors = this._parent;
        /* eslint-disable @typescript-eslint/no-this-alias */
        const collector = this;
        return new (class implements Collectors {
            add(collector: Collector): boolean {
                return collectors.add(collector);
            }
            remove(collectorId: string): boolean {
                return collectors.remove(collectorId);
            }
            get closed(): boolean {
                return collector._closed;
            }
            /* eslint-disable @typescript-eslint/no-explicit-any */
            [Symbol.iterator](): Iterator<Collector, any, undefined> {
                return collectors[Symbol.iterator]();
            }
        })();
    }

    public async collect(): Promise<void> {
        if (this._closed) {
            logger.warn(`Attempted to collect from a closed collector.`);
            return;
        }
        if (this._parent.closed) {
            // if the corresponded collector is closed we need to close ourselves too
            this.close();
            return;
        }
    }
    public get closed(): boolean {
        return this._closed;
    }

    public close(): void {
        if (this._closed) {
            logger.info(`Attempted to close twice`);
            return;
        }
        this._closed = true;
        this._parent.remove(this.id);
        this._worker.observer.removeListener("newrouter", this._newRouterListener);
    }
}
