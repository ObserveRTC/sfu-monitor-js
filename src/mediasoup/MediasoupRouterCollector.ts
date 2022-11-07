import { StatsWriter } from "../entries/StatsStorage";
import { Collector } from "../Collector";
import {
    MediasoupNewTransportListener,
    MediasoupRouter,
    MediasoupTransport,
    MediasoupTransportType,
} from "./MediasoupTypes";
import { v4 as uuidv4 } from "uuid";
import { createLogger } from "../utils/logger";
import { Collectors } from "../Collectors";
import { MediasoupTransportCollector, MediasoupTransportCollectorConfig } from "./MediasoupTransportCollector";
import { Appendix } from "../entries/StatsEntryInterfaces";

const logger = createLogger(`MediasoupRouter`);

export type TransportTypeFunction = (transport: MediasoupTransport) => MediasoupTransportType;

const defaultGetTransportType: TransportTypeFunction = (transport) => {
    if (transport?.iceState) return "webrtc-transport";
    if (transport?.tuple) return "pipe-transport";
    return "direct-transport";
};

export type MediasoupRouterCollectorConfig = {
    /**
     * The type of the transport attempted to watch
     */
    getTransportType?: TransportTypeFunction;

    /**
     * Indicate if we want to poll the transport stats
     *
     * DEFAULT: false,
     */
    pollTransportStats?: () => boolean;

    /**
     * Indicate if we want to poll the producer stats
     *
     * DEFAULT: false,
     */
    pollProducerStats?: () => boolean;

    /**
     * Indicate if we want to poll the consumer stats
     *
     * DEFAULT: false,
     */
    pollConsumerStats?: () => boolean;

    /**
     * Indicate if we want to poll the dataProducer stats
     *
     * DEFAULT: false,
     */
    pollDataProducerStats?: () => boolean;

    /**
     * Indicate if we want to poll the data consumer stats
     *
     * DEFAULT: false,
     */
    pollDataConsumerStats?: () => boolean;

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
    const result: MediasoupRouterCollectorConfig = {
        getTransportType: defaultGetTransportType,
    };
    return result;
};

export class MediasoupRouterCollector implements Collector {
    public readonly id = uuidv4();
    private _parent: Collectors;
    private _closed = false;
    private _config: MediasoupRouterCollectorConfig;
    private _statsWriter?: StatsWriter;
    private _router: MediasoupRouter;
    private _newTransportListener: MediasoupNewTransportListener;
    public constructor(parent: Collectors, router: MediasoupRouter, config?: MediasoupRouterCollectorConfig) {
        this.id = `mediasoup-router-${router.id}`;
        this._parent = parent;
        this._router = router;
        this._config = Object.assign(supplyDefaultConfig(), config);
        const getTransportType = this._config.getTransportType ?? defaultGetTransportType;
        const routerId = this._router.id;
        this._router.observer.once("close", () => {
            this.close();
            logger.debug(`Router ${routerId} is removed from watch`);
        });
        const collectorsFacade = this._createCollectorsFacade();
        this._newTransportListener = (transport) => {
            if (!this._statsWriter) {
                logger.warn(`Cannot create corresponded collectors without statswriter`);
                return;
            }
            const transportCollectorConfig: MediasoupTransportCollectorConfig = {
                ...this._config,
                transportType: getTransportType(transport),
            };
            const transportCollector = new MediasoupTransportCollector(
                collectorsFacade,
                transport,
                transportCollectorConfig
            );
            transportCollector.setStatsWriter(this._statsWriter);
            this._parent.add(transportCollector);
        };
        router.observer.on("newtransport", this._newTransportListener);
        logger.debug(`Router ${routerId} is watched`);
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

    private _createCollectorsFacade(): Collectors {
        const collectors = this._parent;
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
        this._router.observer.removeListener("newtransport", this._newTransportListener);
    }
}
