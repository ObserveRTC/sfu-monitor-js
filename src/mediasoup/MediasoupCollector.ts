import { SfuInboundRtpPad, SfuOutboundRtpPad, SfuSctpChannel, SfuTransport } from "@observertc/sample-schemas-js";
import { Collector } from "../Collector";
import { StatsWriter } from "../entries/StatsStorage";
import { collectMediaConsumerStats, collectNoMediaConsumerStats } from "./collectMediaConsumerStats";
import { collectMediaProducerStats, collectNoMediaProducerStats } from "./collectMediaProducerStats";
import { collectWebRtcTransportStats, collectNoTransportStats, getTransportType, collectDirectTransportStats, collectPlainTransportStats, collectPipeTransportStats } from "./collectTransportStats";
import { v4 as uuid } from 'uuid';
import { 
	MediasoupConsumerSurrogate, 
	MediasoupDataConsumerSurrogate, 
	MediasoupDataProducerSurrogate, 
	MediasoupProducerSurrogate, 
	MediasoupRouterSurrogate, 
	MediasoupSurrogate, 
	MediasoupTransportSurrogate, 
	MediasoupWorkerSurrogate 
} from "./MediasoupTypes";
import { collectDataConsumerStats, collectNoDataConsumerStats } from "./collectDataConsumerStats";
import { collectDataProducerStats, collectNoDataProducerStats } from "./collectDataProducerStats";

/**
 * Configuration options for the MediasoupCollector.
 */
export type MediasoupCollectorConfig = {
    /**
     * The top level mediasoup object to observe events and monitor.
     */
    mediasoup?: MediasoupSurrogate;

    /**
     * Function to indicate if we want to poll the WebRTC transport stats.
     * Default: false
     */
    pollWebRtcTransportStats?: (transportId: string) => boolean;

    /**
     * Function to indicate if we want to poll the plain RTP transport stats.
     * Default: false
     */
    pollPlainRtpTransportStats?: (transportId: string) => boolean;

    /**
     * Function to indicate if we want to poll the pipe transport stats.
     * Default: false
     */
    pollPipeTransportStats?: (transportId: string) => boolean;

    /**
     * Function to indicate if we want to poll the direct transport stats.
     * Default: false
     */
    pollDirectTransportStats?: (transportId: string) => boolean;

    /**
     * Function to indicate if we want to poll the producer stats.
     * Default: false
     */
    pollProducerStats?: (producerId: string) => boolean;

    /**
     * Function to indicate if we want to poll the consumer stats.
     * Default: false
     */
    pollConsumerStats?: (consumerId: string) => boolean;

    /**
     * Function to indicate if we want to poll the dataProducer stats.
     * Default: false
     */
    pollDataProducerStats?: (dataProducerId: string) => boolean;

    /**
     * Function to indicate if we want to poll the data consumer stats.
     * Default: false
     */
    pollDataConsumerStats?: (dataConsumerId: string) => boolean;
};


type WatchedTransport = {
	type: 'WebRtcTransport' | 'PipeTransport' | 'PlainTransport' | 'DirectTransport',
	transport: MediasoupTransportSurrogate,
}

type WatchedMediaProducer = {
	internal: boolean,
	ssrcToPadIds: Map<number, string>,
	producer: MediasoupProducerSurrogate,
	transportId: string,
}

type WatchedMediaConsumer = {
	internal: boolean,
	ssrcToPadIds: Map<number, string>,
	consumer: MediasoupConsumerSurrogate,
	transportId: string,
}

type WatchedDataProducer = {
	internal: boolean,
	dataProducer: MediasoupDataProducerSurrogate,
	transportId: string,
}

type WatchedDataConsumer = {
	internal: boolean,
	dataConsumer: MediasoupDataConsumerSurrogate,
	transportId: string,
}

/**
 * Interface for Mediasoup collectors.
 */
export interface MediasoupCollector {
    /**
     * Adds a Mediasoup worker surrogate.
     * @param worker - The Mediasoup worker surrogate.
     */
    addWorker(worker: MediasoupWorkerSurrogate): void;

    /**
     * Adds a Mediasoup router surrogate.
     * @param worker - The Mediasoup router surrogate.
     */
    addRouter(worker: MediasoupRouterSurrogate): void;

    /**
     * Adds a Mediasoup transport surrogate.
     * @param worker - The Mediasoup transport surrogate.
     * @param internal - Optional flag to indicate if it's an internal transport.
     */
    addTransport(worker: MediasoupTransportSurrogate, internal?: boolean): void;

    /**
     * Adds a Mediasoup producer surrogate.
     * @param producer - The Mediasoup producer surrogate.
     * @param transportId - The transport identifier.
     * @param internal - Optional flag to indicate if it's an internal producer.
     */
    addProducer(producer: MediasoupProducerSurrogate, transportId: string, internal?: boolean): void;

    /**
     * Adds a Mediasoup consumer surrogate.
     * @param consumer - The Mediasoup consumer surrogate.
     * @param transportId - The transport identifier.
     * @param internal - Optional flag to indicate if it's an internal consumer.
     */
    addConsumer(consumer: MediasoupConsumerSurrogate, transportId: string, internal?: boolean): void;

    /**
     * Adds a Mediasoup data producer surrogate.
     * @param dataProducer - The Mediasoup data producer surrogate.
     * @param transportId - The transport identifier.
     * @param internal - Optional flag to indicate if it's an internal data producer.
     */
    addDataProducer(dataProducer: MediasoupDataProducerSurrogate, transportId: string, internal?: boolean): void;

    /**
     * Adds a Mediasoup data consumer surrogate.
     * @param dataConsumer - The Mediasoup data consumer surrogate.
     * @param transportId - The transport identifier.
     * @param internal - Optional flag to indicate if it's an internal data consumer.
     */
    addDataConsumer(dataConsumer: MediasoupDataConsumerSurrogate, transportId: string, internal?: boolean): void;

    /**
     * Indicates if the collector is closed.
     */
    closed: boolean;

    /**
     * Closes the collector.
     */
    close(): void;
}


export abstract class MediasoupCollectorImpl implements MediasoupCollector, Collector {
	
	public readonly id = uuid();
	
	private _closed = false;
	private _unsubscribe: () => void;
	private _transports = new Map<string, WatchedTransport>();
	private _mediaProducers = new Map<string, WatchedMediaProducer>();
	private _mediaConsumers = new Map<string, WatchedMediaConsumer>();
	private _dataProducers = new Map<string, WatchedDataProducer>();
	private _dataConsumers = new Map<string, WatchedDataConsumer>();

	public constructor(
		private readonly config: MediasoupCollectorConfig,
		private readonly _statsWriter: StatsWriter,
	) {
		const newWorkerListener = (worker?: MediasoupWorkerSurrogate) => {
			if (!this._closed && worker) {
				this.addWorker(worker);
			}
		}
		this.config.mediasoup?.observer.addListener('newworker', newWorkerListener);
		this._unsubscribe = () => {
			this.config.mediasoup?.observer.removeListener('newworker', newWorkerListener);
		};

	}

	public addWorker(worker: MediasoupWorkerSurrogate) {
		if (this._closed) {
			// no new worker can be watched
			return;
		}
		const newRouterListener = (router?: MediasoupRouterSurrogate) => {
			if (!this._closed && router) {
				this.addRouter(router);
			}
		}
		worker.observer.once('close', () => {
			worker.observer.removeListener('newrouter', newRouterListener);
		});
		worker.observer.addListener('newrouter', newRouterListener);
	}

	public addRouter(router: MediasoupRouterSurrogate) {
		if (this._closed) {
			throw new Error(`Cannot add a router to a closed mediasoup collector`);
		}
		const newTransportListener = (transport?: MediasoupTransportSurrogate) => {
			if (!this._closed && transport) {
				this.addTransport(transport);
			}
		}
		router.observer.once('close', () => {
			router.observer.removeListener('newtransport', newTransportListener);
		});
		router.observer.addListener('newtransport', newTransportListener);
	}

	public addTransport(transport: MediasoupTransportSurrogate, internal?: boolean) {
		if (this._closed) {
			throw new Error(`Cannot add a transport to a closed mediasoup collector`);
		}
		const type = getTransportType(transport);
		const newProducerListener = (producer?: MediasoupProducerSurrogate) => {
			if (!this._closed && producer) {
				this.addProducer(producer, transport.id, internal ?? type === 'PipeTransport');
			}
		}
		const newConsumerListener = (consumer?: MediasoupConsumerSurrogate) => {
			if (!this._closed && consumer) {
				this.addConsumer(consumer, transport.id, internal ?? type === 'PipeTransport');
			}
		}
		const newDataProducerListener = (dataProducer?: MediasoupDataProducerSurrogate) => {
			if (!this._closed && dataProducer) {
				this.addDataProducer(dataProducer, transport.id, internal ?? type === 'PipeTransport');
			}
		}
		const newDataConsumerListener = (dataConsumer?: MediasoupDataConsumerSurrogate) => {
			if (!this._closed && dataConsumer) {
				this.addDataConsumer(dataConsumer, transport.id, internal ?? type === 'PipeTransport');
			}
		}
	
		transport.observer.once('close', () => {
			transport.observer.removeListener('newproducer', newProducerListener);
			transport.observer.removeListener('newconsumer', newConsumerListener);
			transport.observer.removeListener('newdataproducer', newDataProducerListener);
			transport.observer.removeListener('newdataconsumer', newDataConsumerListener);

			this._transports.delete(transport.id);
		});
	
		transport.observer.addListener('newproducer', newProducerListener);
		transport.observer.addListener('newconsumer', newConsumerListener);
		transport.observer.addListener('newdataproducer', newDataProducerListener);
		transport.observer.addListener('newdataconsumer', newDataConsumerListener);

		this._transports.set(transport.id, {
			transport,
			type,
		})
	}

	public addProducer(producer: MediasoupProducerSurrogate, transportId: string, internal?: boolean) {
		if (this._closed) {
			throw new Error(`Cannot add a producer to a closed mediasoup collector`);
		}
		producer.observer.once('close', () => {
			this._mediaProducers.delete(producer.id);
		});
		this._mediaProducers.set(producer.id, {
			producer,
			transportId,
			internal: !!internal,
			ssrcToPadIds: new Map<number, string>(),
		});
	}
	
	public addConsumer(consumer: MediasoupConsumerSurrogate, transportId: string, internal?: boolean) {
		if (this._closed) {
			throw new Error(`Cannot add a consumer to a closed mediasoup collector`);
		}
		consumer.observer.once('close', () => {
			this._mediaConsumers.delete(consumer.id);
		});
		this._mediaConsumers.set(consumer.id, {
			consumer,
			transportId,
			internal: !!internal,
			ssrcToPadIds: new Map<number, string>(),
		});
	}
	
	public addDataProducer(dataProducer: MediasoupDataProducerSurrogate, transportId: string, internal?: boolean) {
		if (this._closed) {
			throw new Error(`Cannot add a data producer to a closed mediasoup collector`);
		}
		dataProducer.observer.once('close', () => {
			this._dataProducers.delete(dataProducer.id);
		});
		this._dataProducers.set(dataProducer.id, {
			dataProducer,
			transportId,
			internal: !!internal,
		});
	}
	
	public addDataConsumer(dataConsumer: MediasoupDataConsumerSurrogate, transportId: string, internal?: boolean) {
		if (this._closed) {
			throw new Error(`Cannot add a data consumer to a closed mediasoup collector`);
		}
		dataConsumer.observer.once('close', () => {
			this._dataConsumers.delete(dataConsumer.id);
		});
		this._dataConsumers.set(dataConsumer.id, {
			dataConsumer,
			transportId,
			internal: !!internal,
		});
	}
	
	public createFetchers(): (() => Promise<void>)[] {
		const result: (() => Promise<void>)[] = [];
		for (const watchedTransport of this._transports.values()) {
			result.push(this._pollTransportStats(watchedTransport));
		}

		for (const watchedMediaProducer of this._mediaProducers.values()) {
			result.push(this._pollMediaProducerStats(watchedMediaProducer));
		}

		for (const watchedMediaConsumer of this._mediaConsumers.values()) {
			result.push(this._pollMediaConsumerStats(watchedMediaConsumer));
		}

		for (const watchedDataProducer of this._dataProducers.values()) {
			result.push(this._pollDataProducerStats(watchedDataProducer));
		}

		for (const watchedDataConsumer of this._dataConsumers.values()) {
			result.push(this._pollDataConsumerStats(watchedDataConsumer));
		}
		
		return result;
	}

	private _pollTransportStats( { transport, type }: WatchedTransport): () => Promise<void> {
		let pollTransportStats: () => Promise<SfuTransport[]>;
		switch (type) {
			case 'WebRtcTransport':
				if (this.config.pollWebRtcTransportStats?.(transport.id)) {
					pollTransportStats = () => collectWebRtcTransportStats(
						false,
						transport
					);
				} else {
					pollTransportStats = () => Promise.resolve([collectNoTransportStats(
						false,
						transport
					)]);
				}
				break;
			case 'DirectTransport':
				if (this.config.pollDirectTransportStats?.(transport.id)) {
					pollTransportStats = () => collectDirectTransportStats(
						false,
						transport
					);
				} else {
					pollTransportStats = () => Promise.resolve([collectNoTransportStats(
						false,
						transport
					)]);
				}
				break;
			case 'PlainTransport':
				if (this.config.pollPlainRtpTransportStats?.(transport.id)) {
					pollTransportStats = () => collectPlainTransportStats(
						false,
						transport
					);
				} else {
					pollTransportStats = () => Promise.resolve([collectNoTransportStats(
						false,
						transport
					)]);
				}
				break;
			case 'PipeTransport':
				if (this.config.pollPipeTransportStats?.(transport.id)) {
					pollTransportStats = () => collectPipeTransportStats(
						false,
						transport
					);
				} else {
					pollTransportStats = () => Promise.resolve([collectNoTransportStats(
						false,
						transport
					)]);
				}
				break;
		}
		return () => pollTransportStats().then(transportStats => {
			// put it to the storage
			transportStats.forEach(stats => this._statsWriter.updateTransport(stats));
		});
	}

	private _pollMediaProducerStats( { producer, internal, transportId, ssrcToPadIds }: WatchedMediaProducer): () => Promise<void> {
		let pollInboundRtpPadStats: () => Promise<SfuInboundRtpPad[]>;
		if (this.config.pollProducerStats?.(producer.id)) {
			pollInboundRtpPadStats = () => collectMediaProducerStats(
				transportId,
				internal,
				producer,
				ssrcToPadIds
			);
		} else {
			pollInboundRtpPadStats = () => Promise.resolve([collectNoMediaProducerStats(
				transportId,
				internal,
				producer,
				ssrcToPadIds
			)]);
		}
		return () => pollInboundRtpPadStats().then(inboundRtpPadStats => {
			// put it to the storage
			inboundRtpPadStats.forEach(stats => this._statsWriter.updateInboundRtpPad(stats));
		});
	}

	private _pollMediaConsumerStats( { consumer, internal, transportId, ssrcToPadIds }: WatchedMediaConsumer): () => Promise<void> {
		let pollOutboundRtpPadStats: () => Promise<SfuOutboundRtpPad[]>;
		if (this.config.pollConsumerStats?.(consumer.id)) {
			pollOutboundRtpPadStats = () => collectMediaConsumerStats(
				transportId,
				internal,
				consumer,
				ssrcToPadIds
			);
		} else {
			pollOutboundRtpPadStats = () => Promise.resolve([collectNoMediaConsumerStats(
				transportId,
				internal,
				consumer,
				ssrcToPadIds
			)]);
		}
		return () => pollOutboundRtpPadStats().then(outboundRtpPadStats => {
			// put it to the storage
			outboundRtpPadStats.forEach(stats => this._statsWriter.updateOutboundRtpPad(stats));
		});
	}

	private _pollDataProducerStats( { dataProducer, internal, transportId }: WatchedDataProducer): () => Promise<void> {
		let pollInboundRtpPadStats: () => Promise<SfuSctpChannel[]>;
		if (this.config.pollDataProducerStats?.(dataProducer.id)) {
			pollInboundRtpPadStats = () => collectDataProducerStats(
				transportId,
				internal,
				dataProducer,
			);
		} else {
			pollInboundRtpPadStats = () => Promise.resolve([collectNoDataProducerStats(
				transportId,
				internal,
				dataProducer,
			)]);
		}
		return () => pollInboundRtpPadStats().then(inboundRtpPadStats => {
			// put it to the storage
			inboundRtpPadStats.forEach(stats => this._statsWriter.updateSctpChannel(stats));
		});
	}

	private _pollDataConsumerStats( { dataConsumer, internal, transportId }: WatchedDataConsumer): () => Promise<void> {
		let pollOutboundRtpPadStats: () => Promise<SfuSctpChannel[]>;
		if (this.config.pollDataConsumerStats?.(dataConsumer.id)) {
			pollOutboundRtpPadStats = () => collectDataConsumerStats(
				transportId,
				internal,
				dataConsumer,
			);
		} else {
			pollOutboundRtpPadStats = () => Promise.resolve([collectNoDataConsumerStats(
				transportId,
				internal,
				dataConsumer,
			)]);
		}
		return () => pollOutboundRtpPadStats().then(outboundRtpPadStats => {
			// put it to the storage
			outboundRtpPadStats.forEach(stats => this._statsWriter.updateSctpChannel(stats));
		});
	}

	public get closed(): boolean {
		return this._closed;
	}

	public close(): void {
		if (this._closed) {
			return;
		}
		this._closed = true;

		this._unsubscribe();
		this._transports.clear();
		this._mediaProducers.clear();
		this._mediaConsumers.clear();
		this._dataProducers.clear();
		this._dataConsumers.clear();
	}

	protected abstract onClose(): void;
	
}