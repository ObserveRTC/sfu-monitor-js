import { MediasoupVersion } from "./MediasoupVersion";
import { Promises as Promises } from "../PromiseExecutor";
import { factory } from "../ConfigLog4j";
import { uuid } from "uuidv4";
 
const logger = factory.getLogger("MediasoupWrapper");

interface ProducerStats {
    id: string;
    padId: string;
    piped: boolean;
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
    padId: string;
    piped: boolean,
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
    sourceId: any;
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
    watchAllTransports(value: boolean) : Builder;
    build() : MediasoupWrapper;
}

function validateMediasoupObject(obj: any, subject: string): void {
    if (!obj) {
        const message = `${subject} cannot be null`;
        logger.error(message);
        throw new Error(message);
    }
    if (obj.id === null || obj.id === undefined) {
        const message = `${subject} id property cannot be null or undefined`;
        logger.error(message);
        throw new Error(message);
    }
    if (obj.observer === null || obj.observer === undefined) {
        const message = `${subject}  observer property cannot be null or undefined`;
        logger.error(message);
        throw new Error(message);
    }
    if (typeof obj.observer.on !== 'function') {
        const message = `${subject} observer.on must be a function`;
        logger.error(message);
        throw new Error(message);
    }
}

export class MediasoupWrapper {
    
    public static builder(): Builder {
        let mediasoup: any = null;
        let _watchAllTransport = true;
        const mediasoupWrapperBuilder: Builder = {
            withMediasoup(ms: any): Builder {
                mediasoup = ms;
                return mediasoupWrapperBuilder;
            },
            watchAllTransports(value: boolean) : Builder {
                _watchAllTransport = value;
                return mediasoupWrapperBuilder;
            },
            build(): MediasoupWrapper {
                if (!mediasoup) {
                    throw new Error("mediasoup must exists");
                }
                const version = MediasoupVersion.parse(mediasoup.version);
                logger.info(`Wrapping mediasoup version ${version.toString()}`);
                if (version.major < 3 || 3 < version.major) {
                    throw new Error("Can only support mediasoup major version 3 at the moment");
                }
                const result = new MediasoupWrapper(mediasoup, version);
                
                // Observe events and track maps depending on version

                const _observeRouter = (router: any) => {
                    logger.info(`Begin observing Mediasoup Router ${router.id}`);
                    validateMediasoupObject(router, "router");
                    result._routers.set(router.id, router);
                    router.observer.on("close", () => {
                        result._routers.delete(router.id);
                        logger.info(`End observing Mediasoup Router ${router.id}`);
                    });
                    if (_watchAllTransport) {
                        router.observer.on("newtransport", (transport: any) => result.watchTransport(transport));
                    }
                };

                const _observeWorker = (worker: any) => {
                    validateMediasoupObject({
                        id: worker.pid,
                        observer: worker.observer,
                    }, "worker");
                    logger.info(`Begin observing Mediasoup Worker ${worker.pid}`);
                    result._workers.set(worker.pid, worker);
                    worker.observer.on("close", () => {
                        result._workers.delete(worker.pid);
                        logger.info(`End observing Mediasoup Worker ${worker.pid}`);
                    });
                    worker.observer.on("newrouter", (router: any) => _observeRouter(router));
                };

                // here it comes the hook!
                mediasoup.observer.on("newworker", (worker: any) => {
                    _observeWorker(worker);
                });

                return result;
            }
        }
        return mediasoupWrapperBuilder;
    }

    private _mediasoup: any;
    public readonly version: MediasoupVersion;
    private _noStats: Map<string, number>;
    private _workers: Map<any, any>;
    private _routers: Map<any, any>;
    private _transports: Map<any, any>;
    private _producers: Map<any, any>;
    private _consumers: Map<any, any>;
    private _dataProducers: Map<any, any>;
    private _dataConsumers: Map<any, any>;
    private _streamsMeta: Map<any, any>;

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
        this._streamsMeta = new Map();
        this._noStats = new Map();
    }

    watchTransport(transport: any): MediasoupWrapper {
        logger.info(`Begin observing Mediasoup Transport ${transport.id}`);
        validateMediasoupObject(transport, "transport");
        this._transports.set(transport.id, transport);
        const transportId = transport.id;
        const piped = transport && transport.constructor && transport.constructor.name === "PipeTransport";
        transport.observer.on("close", () => {
            this._disregardTransport(transportId);
        });
        transport.observer.on("newproducer", (producer: any) => {
            const padId = piped ? uuid() : producer.id;
            this._streamsMeta.set(producer.id, {
                transportId,
                piped,
                padId,
            });
            this._watchProducer(producer);
        });
        transport.observer.on("newconsumer", (consumer: any) => {
            const padId = piped ? uuid() : consumer.id;
            const producerId = consumer.producerId;
            this._streamsMeta.set(consumer.id, {
                transportId,
                piped,
                padId,
                producerId,
            });
            this._watchConsumer(consumer);
        });
        transport.observer.on("newdataproducer", (dataProducer: any) => {
            const sourceId = dataProducer?.appData?.sourceId ?? uuid();
            this._streamsMeta.set(dataProducer.id, {
                transportId,
                sourceId,
            });
            this._watchDataProducer(dataProducer);
        });
        transport.observer.on("newdataconsumer", (dataConsumer: any) => {
            this._streamsMeta.set(dataConsumer.id, {
                transportId,
            });
            this._watchDataConsumer(dataConsumer)
        });
        return this;
    }

    _disregardTransport(transportId: any): void {
        this._noStats.delete(transportId);
        this._transports.delete(transportId);
        logger.info(`End observing Mediasoup Transport ${transportId}`);
    }

    async *producerStats(): AsyncGenerator<ProducerStats, void, void> {
        // any version specific adjustment for producers can be done here
        const meta: any[] = [];
        const promises: Promise<any>[] = [];
        for (const producer of this._producers.values()) {
            const id = producer.id;
            const streamMeta = this._streamsMeta.get(id) ?? {};
            meta.push({
                id,
                ...streamMeta,
            })
            promises.push(producer.getStats());
        }
        
        const responses = await Promises
            .from(promises)
            .onError((err, index) => {
                logger.warn(`Error occurred while collecting consumer stats`, err);
                const { id } = meta[index];
                if (id) {
                    this._disregardProducer(id);
                    logger.warn(`Producer with id ${id} is deleted from getting stats`);
                }
            })
            .execute();
        
        for (let i = 0; i < responses.length; ++i) {
            const producerMeta = meta[i];
            const producerId = producerMeta.id;
            const statsArray = responses[i];
            const statsOk = this._checkProducerStats(producerId, statsArray);
            if (!statsOk) {
                continue;
            }
            for (const stats of statsArray) {
                yield {
                    ...producerMeta,
                    ...stats,
                }
            }
        }
    }
    
    async *consumerStats(): AsyncGenerator<ConsumerStats, void, void> {
        // any version specific adjustment for consumers can be done here
        const meta: any[] = [];
        const promises: Promise<any>[] = [];
        for (const consumer of this._consumers.values()) {
            const id = consumer.id;
            const producerId = consumer.producerId;
            const streamMeta = this._streamsMeta.get(id) ?? {};
            meta.push({
                id,
                producerId,
                ...streamMeta,
            })
            promises.push(consumer.getStats());
        }

        const responses = await Promises
            .from(promises)
            .onError((err, index) => {
                logger.warn(`Error occurred while collecting consumer stats`, err);
                const { id } = meta[index];
                if (id) {
                    this._disregardConsumer(id);
                    logger.warn(`Consumer with id ${id} is deleted from getting stats`);
                }
            })
            .execute();
        
        for (let i = 0; i < responses.length; ++i) {
            const consumerMeta = meta[i];
            const consumerId = consumerMeta.id;
            const statsArray = responses[i];
            const statsOk = this._checkConsumerStats(consumerId, statsArray);
            if (!statsOk) {
                continue;
            }
            for (const stats of statsArray) {
                yield {
                    ...consumerMeta,
                    ...stats,
                }
            }
        }
    }

    async *dataProducerStats(): AsyncGenerator<DataProducerStats, void, void> {
        // any version specific adjustment for dataProducers can be done here
        const meta: any[] = [];
        const promises: Promise<any>[] = [];
        for (const dataProducer of this._dataProducers.values()) {
            const id = dataProducer.id;
            const streamMeta = this._streamsMeta.get(id) ?? {};
            meta.push({
                id,
                ...streamMeta,
            })
            promises.push(dataProducer.getStats());
        }

        const responses = await Promises
            .from(promises)
            .onError((err, index) => {
                logger.warn(`Error occurred while collecting dataproducer stats`, err);
                const { id } = meta[index];
                if (id) {
                    this._disregardDataProducer(id);
                    logger.warn(`DataProducer with id ${id} is deleted from getting stats`);
                }
            })
            .execute();

        for (let i = 0; i < responses.length; ++i) {
            const dataProducerMeta = meta[i];
            const dataProducerId = dataProducerMeta.id;
            const statsArray = responses[i];
            const statsOk = this._checkDataProducerStats(dataProducerId, statsArray);
            if (!statsOk) {
                continue;
            }
            for (const stats of statsArray) {
                yield {
                    ...dataProducerMeta,
                    ...stats,
                }
            }
        }
    }
    
    async *dataConsumerStats(): AsyncGenerator<DataConsumerStats, void, void> {
        // any version specific adjustment for dataConsumers can be done here
        const meta: any[] = [];
        const promises: Promise<any>[] = [];
        for (const dataConsumer of this._dataConsumers.values()) {
            const id = dataConsumer.id;
            const streamMeta = this._streamsMeta.get(id) ?? {};
            meta.push({
                id,
                ...streamMeta,
            })
            promises.push(dataConsumer.getStats());
        }
        
        const responses = await Promises
            .from(promises)
            .onError((err, index) => {
                logger.warn(`Error occurred while collecting dataconsumer stats`, err);
                const { id } = meta[index];
                if (id) {
                    this._disregardDataConsumer(id);
                    logger.warn(`DataConsumer with id ${id} is deleted from getting stats`);
                }
            })
            .execute();

        for (let i = 0; i < responses.length; ++i) {
            const dataConsumerMeta = meta[i];
            const dataConsumerId = dataConsumerMeta.id;
            const statsArray = responses[i];
            const statsOk = this._checkDataConsumerStats(dataConsumerId, statsArray);
            if (!statsOk) {
                continue;
            }
            for (const stats of statsArray) {
                yield {
                    ...dataConsumerMeta,
                    ...stats,
                }
            }
        }
    }
    
    async *transportStats(): AsyncGenerator<TransportStats, void, void> {
        // any version specific adjustment for transports can be done here
        const meta: any[] = [];
        const promises: Promise<any>[] = [];
        for (const transport of this._transports.values()) {
            meta.push({
                id: transport.id,
                serviceId:  transport.appData?.serviceId,
            })
            promises.push(transport.getStats());
        }
        
        const responses = await Promises
            .from(promises)
            .onError((err, index) => {
                logger.warn(`Error occurred while collecting transport stats`, err);
                const { id } = meta[index];
                if (id) {
                    this._disregardTransport(id);
                    logger.warn(`Transport with id ${id} is deleted from getting stats`);
                }
            })
            .execute();
            
        for (let i = 0; i < responses.length; ++i) {
            const { id, serviceId } = meta[i];
            const statsArray = responses[i];
            const statsOk = this._checkTransportStats(id, statsArray);
            if (!statsOk) {
                continue;
            }
            for (const stats of statsArray) {
                const selectedIce = stats.iceSelectedTuple;
                yield {
                    id,
                    serviceId,
                    ...selectedIce,
                    ...stats,
                };
            }
        }
    }

    private _checkTransportStats(transportId: any, statsArray: any): boolean {
        return this._checkStats(
            transportId,
            statsArray,
            `Transport`,
            this._disregardTransport
        );
    }

    private _checkProducerStats(producerId: any, statsArray: any): boolean {
        return this._checkStats(
            producerId,
            statsArray,
            `Producer`,
            this._disregardProducer
        );
    }

    private _checkConsumerStats(consumerId: any, statsArray: any): boolean {
        return this._checkStats(
            consumerId,
            statsArray,
            `Consumer`,
            this._disregardConsumer
        );
    }

    private _checkDataProducerStats(dataProducerId: any, statsArray: any): boolean {
        return this._checkStats(
            dataProducerId,
            statsArray,
            `DataProducer`,
            this._disregardDataProducer
        );
    }

    private _checkDataConsumerStats(dataConsumerId: any, statsArray: any): boolean {
        return this._checkStats(
            dataConsumerId,
            statsArray,
            `DataConsumer`,
            this._disregardDataConsumer
        );
    }

    private _checkStats(id: any, statsArray: any, context: string, disregardCb: (id:any) => void): boolean {
        const isArray = Array.isArray(statsArray);
        if (isArray) {
            this._noStats.delete(id);
            return true;
        }
        
        logger.warn(`${context} ${id} does not provide array of stats`);
        const noStats = this._noStats.get(id);
        if (noStats === undefined || noStats === null) {
            this._noStats.set(id, 1);
            return false;
        }
        if (3 < noStats) {
            disregardCb(id);
        }
        this._noStats.set(id, noStats + 1);
        return false;
    }

    _watchConsumer(consumer: any): MediasoupWrapper {
        const consumerId = consumer.id;
        logger.info(`Begin observing Mediasoup Consumer ${consumerId}`);
        validateMediasoupObject(consumer, "consumer");
        this._consumers.set(consumerId, consumer);
        consumer.observer.on("close", () => {
            this._disregardConsumer(consumerId);
        });
        return this;
    }

    _disregardConsumer(consumerId: any): void {
        this._noStats.delete(consumerId);
        this._consumers.delete(consumerId);
        this._streamsMeta.delete(consumerId);
        logger.info(`End observing Consumer ${consumerId}`);
    }

    _watchProducer(producer: any): MediasoupWrapper {
        const producerId = producer.id;
        logger.info(`Begin observing Mediasoup Producer ${producerId}`);
        validateMediasoupObject(producer, "producer");
        this._producers.set(producerId, producer);
        producer.observer.on("close", () => {
            this._disregardProducer(producerId);
        });
        return this;
    }

    _disregardProducer(producerId: any): void {
        this._noStats.delete(producerId);
        this._producers.delete(producerId);
        this._streamsMeta.delete(producerId);
        logger.info(`End observing Producer ${producerId}`);
    }

    _watchDataProducer(dataProducer: any): MediasoupWrapper {
        const dataProducerId = dataProducer.id;
        logger.info(`Begin observing Mediasoup DataProducer ${dataProducerId}`);
        validateMediasoupObject(dataProducer, "dataProducer");
        this._dataProducers.set(dataProducerId, dataProducer);
        dataProducer.observer.on("close", () => {
           this._disregardDataProducer(dataProducerId);
        });
        return this;
    }

    _disregardDataProducer(dataProducerId: any): void {
        this._noStats.delete(dataProducerId);
        this._dataProducers.delete(dataProducerId);
        this._streamsMeta.delete(dataProducerId);
        logger.info(`End observing DataProducer ${dataProducerId}`);
    }

    _watchDataConsumer(dataConsumer: any): MediasoupWrapper {
        const dataConsumerId = dataConsumer.id;
        logger.info(`Begin observing Mediasoup DataConsumer ${dataConsumerId}`);
        validateMediasoupObject(dataConsumer, "dataConsumer");
        this._dataConsumers.set(dataConsumerId, dataConsumer);
        dataConsumer.observer.on("close", () => {
           this._disregardDataConsumer(dataConsumerId);
        });
        return this;
    }

    _disregardDataConsumer(dataConsumerId: any): void {
        this._noStats.delete(dataConsumerId);
        this._dataConsumers.delete(dataConsumerId);
        this._streamsMeta.delete(dataConsumerId);
        logger.info(`End observing DataConsumer ${dataConsumerId}`);
    } 
}
