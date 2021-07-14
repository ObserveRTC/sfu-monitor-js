import { MediasoupVersion } from "./MediasoupVersion";
import { factory } from "../ConfigLog4j";
 
const logger = factory.getLogger("MediasoupWrapper");

interface ProducerStats {
    id: string;
    transportId: string;
    trackId?: string;
    ssrc?: number;
    kind?: string;
    mimeType?: string;
    rid?: string;
    rtxSsrc?: number;
    bitrate?: number;
    firCount?: number;
    pliCount?: number;
    nackCount?: number;
    packetsLost?: number;
    packetCount?: number;
    packetsDiscarded?: number;
    packetsRepaired?: number;
    byteCount?: number;
    rtxPacketsDiscarded?: number;
    fractionLost?: number;
    jitter?: number;
    roundTripTime?: number;
    type: string;
}

interface ConsumerStats {
    id: string;
    producerId: string;
    transportId: string;
    trackId?: string;
    ssrc?: number;
    kind?: string;
    mimeType?: string;
    rid?: string;
    rtxSsrc?: number;
    bitrate?: number;
    firCount?: number;
    pliCount?: number;
    nackCount?: number;
    packetsLost?: number;
    packetCount?: number;
    packetsDiscarded?: number;
    packetsRetransmitted?: number;
    packetsRepaired?: number;
    byteCount?: number;
    rtxPacketsDiscarded?: number;
    fractionLost?: number;
    jitter?: number;
    roundTripTime?: number;
    type: string;
}

interface DataProducerStats {
    streamId: any;
    transportId: any;
    label: any;
    protocol: any;
    messagesSent: any;
    bytesSent: any;
}

interface DataConsumerStats {
    transportId: any;
    streamId: any;
    label: any;
    protocol: any;
    messagesReceived: any;
    bytesReceived: any;
}

interface TransportStats {
    type: string;
    id: any;
    rtxBytesSent: any;
    rtxBytesReceived: any;
    rtpBytesSent: any;
    rtpBytesReceived: any;
    remotePort: any;
    remoteIp: any;
    protocol: any;
    localPort: any;
    localIp: any;
    iceRole: any;
    sctpState: any;
    iceState: any;
    dtlsState: any;
    serviceId: any;

}

interface Builder {
    withMediasoup(mediasoup: any) : Builder;
    build() : MediasoupWrapper;
}

function validateMediasoupObject(obj: any, subject: string): void {
    if (!obj) {
        throw new Error(`${subject} cannot be null`);
    }
    if (obj.id === null || obj.id === undefined) {
        throw new Error(`${subject} id property cannot be null or undefined`);
    }
    if (obj.observer === null || obj.observer === undefined) {
        throw new Error(`${subject}  observer property cannot be null or undefined`);
    }
    if (typeof obj.observer.on !== 'function') {
        throw new Error(`${subject} observer.on must be a function`);
    }
}

export class MediasoupWrapper {
    
    public static builder(): Builder {
        let mediasoup: any = null;
        const mediasoupWrapperBuilder: Builder = {
            withMediasoup(ms: any): Builder {
                mediasoup = ms;
                return this;
            },
            build(): MediasoupWrapper {
                if (!mediasoup) {
                    throw new Error("mediasoup must exists");
                }
                const version = MediasoupVersion.parse(mediasoup.version);
                if (version.major < 3 || 3 < version.major) {
                    throw new Error("Can only support mediasoup major version 3 at the moment");
                }
                const result = new MediasoupWrapper(mediasoup, version);
                
                // Observe events and track maps depending on version

                const _observeDataProducer = (dataProducer: any) => {
                    validateMediasoupObject(dataProducer, "dataProducer");
                    result._dataProducers.set(dataProducer.id, dataProducer);
                    dataProducer.observer.on("close", () => {
                        result._dataProducers.delete(dataProducer.id);
                        result._streamTransportsMap.delete(dataProducer.id);
                    });
                };

                const _observeDataConsumer = (dataConsumer: any) => {
                    validateMediasoupObject(dataConsumer, "dataConsumer");
                    result._dataConsumers.set(dataConsumer.id, dataConsumer);
                    dataConsumer.observer.on("close", () => {
                        result._dataConsumers.delete(dataConsumer.id);
                        result._streamTransportsMap.delete(dataConsumer.id);
                    });
                };

                const _observeProducer = (producer: any) => {
                    validateMediasoupObject(producer, "producer");
                    result._producers.set(producer.id, producer);
                    producer.observer.on("close", () => {
                        result._producers.delete(producer.id);
                        result._streamTransportsMap.delete(producer.id);
                    });
                };

                const _observeConsumer = (consumer: any) => {
                    validateMediasoupObject(consumer, "consumer");
                    result._consumers.set(consumer.id, consumer);
                    consumer.observer.on("close", () => {
                        result._consumers.delete(consumer.id);
                        result._streamTransportsMap.delete(consumer.id);
                    });
                };

                const _observeTransport = (transport: any) => {
                    validateMediasoupObject(transport, "transport");
                    result._transports.set(transport.id, transport);
                    const transportId = transport.id;
                    transport.observer.on("close", () => result._transports.delete(transportId));
                    transport.observer.on("newproducer", (producer: any) => {
                        result._streamTransportsMap.set(producer.id, transportId);
                        _observeProducer(producer);
                    });
                    transport.observer.on("newconsumer", (consumer: any) => {
                        result._streamTransportsMap.set(consumer.id, transportId);
                        _observeConsumer(consumer);
                    });
                    transport.observer.on("newdataproducer", (dataProducer: any) => {
                        result._streamTransportsMap.set(dataProducer.id, transportId);
                        _observeDataProducer(dataProducer);
                    });
                    transport.observer.on("newdataconsumer", (dataConsumer: any) => {
                        result._streamTransportsMap.set(dataConsumer.id, transportId);
                        _observeDataConsumer(dataConsumer)
                    });
                };

                const _observeRouter = (router: any) => {
                    validateMediasoupObject(router, "router");
                    result._routers.set(router.id, router);
                    router.observer.on("close", () => result._routers.delete(router.id));
                    router.observer.on("newtransport", (transport: any) => _observeTransport(transport));
                };

                const _observeWorker = (worker: any) => {
                    validateMediasoupObject(worker, "worker");
                    result._workers.set(worker.pid, worker);
                    worker.observer.on("close", () => result._workers.delete(worker.pid));
                    worker.observer.on("newrouter", (router: any) => _observeRouter(router));
                };

                // here it comes the hook!
                mediasoup.observer.on("newworker", (worker: any) => _observeWorker(worker));

                return result;
            }
        }
        return mediasoupWrapperBuilder;
    }

    private _mediasoup: any;
    public readonly version: MediasoupVersion;
    private _workers: Map<any, any>;
    private _routers: Map<any, any>;
    private _transports: Map<any, any>;
    private _producers: Map<any, any>;
    private _consumers: Map<any, any>;
    private _dataProducers: Map<any, any>;
    private _dataConsumers: Map<any, any>;
    private _streamTransportsMap: Map<any, any>;

    private constructor(mediasoup: any, version: MediasoupVersion) {
        this.version = version;
        this._mediasoup = mediasoup;
        this._workers = new Map();
        this._routers = new Map();
        this._transports = new Map();
        this._producers = new Map();
        this._consumers = new Map();
        this._dataProducers = new Map();
        this._dataConsumers = new Map();
        this._streamTransportsMap = new Map();
    }

    getTransportId(streamId: string): string {
        return this._streamTransportsMap.get(streamId);
    }

    *producerStats(): IterableIterator<ProducerStats> {
        // any version specific adjustment for producers can be done here
        for (const producer of this._producers.values()) {
            const id = producer.id;
            const transportId = this._streamTransportsMap.get(id);
            const statsArray = producer.getStats();
            if (!Array.isArray(statsArray)) {
                logger.warn(`Producer ${producer.id} does not provide array of stats`);
                continue;
            }
            for (const stats of statsArray) {
                yield {
                    id,
                    transportId,
                    ...stats,
                }
            }
        }
    }
    
    *consumerStats(): IterableIterator<ConsumerStats> {
        // any version specific adjustment for consumers can be done here
        for (const consumer of this._consumers.values()) {
            const id = consumer.id;
            const producerId = consumer.producerId;
            const transportId = this._streamTransportsMap.get(id);
            const statsArray = consumer.getStats();
            if (!Array.isArray(statsArray)) {
                logger.warn(`Consumer ${consumer.id} does not provide array of stats`);
                continue;
            }
            for (const stats of statsArray) {
                yield {
                    id,
                    producerId,
                    transportId,
                    ...stats,
                }
            }
        }
    }

    *dataProducerStats(): IterableIterator<DataProducerStats> {
        // any version specific adjustment for dataProducers can be done here
        for (const dataProducer of this._dataProducers.values()) {
            const id = dataProducer.id;
            const transportId = this._streamTransportsMap.get(id);
            const statsArray = dataProducer.getStats();
            if (!Array.isArray(statsArray)) {
                logger.warn(`DataProducer ${dataProducer.id} does not provide array of stats`);
                continue;
            }
            for (const stats of statsArray) {
                yield {
                    id,
                    transportId,
                    ...stats,
                }
            }
        }
    }
    
    *dataConsumerStats(): IterableIterator<DataConsumerStats> {
        // any version specific adjustment for dataConsumers can be done here
        for (const dataConsumer of this._dataConsumers.values()) {
            const id = dataConsumer.id;
            const transportId = this._streamTransportsMap.get(id);
            const statsArray = dataConsumer.getStats();
            if (!Array.isArray(statsArray)) {
                logger.warn(`DataConsumer ${dataConsumer.id} does not provide array of stats`);
                continue;
            }
            for (const stats of statsArray) {
                yield {
                    id,
                    transportId,
                    ...stats,
                }
            }
        }
    }
    
    *transportStats(): IterableIterator<TransportStats> {
        // any version specific adjustment for transports can be done here
        for (const transport of this._transports.values()) {
            const id = transport.id;
            const serviceId = transport.appData?.serviceId;
            const statsArray = transport.getStats();
            if (!Array.isArray(statsArray)) {
                logger.warn(`Transport ${transport.id} does not provide array of stats`);
                continue;
            }
            for (const stats of statsArray) {
                const selectedIce = stats.iceSelectedTuple;
                yield {
                    id,
                    serviceId,
                    ...selectedIce,
                    ...stats,
                }
            }
        }
    }
}
