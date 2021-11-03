import { Comlink } from '../Comlink';
import { SfuObserver } from "../SfuObserver";
import { SfuSample } from '../SfuSample';
import { MediasoupWrapper } from './MediasoupWrapper';
import { SfuSampleRelayer } from '../SfuSampleRelayer';
import { MediasoupSfuSampleProvider } from './MediasoupSfuSampleProvider';
import { MediasoupVisitor } from './MediasoupVisitor';
import EventEmitter = require('events');
import { factory } from "../ConfigLog4j";

const logger = factory.getLogger("MediasoupSfuObserver");

const ON_ERROR_EVENT_NAME = "onError";
const ON_SAMPLE_EVENT_NAME = "onSample";


interface Builder {
    withMediasoup(mediasoup: any) : this;
    withSfuId(value: string) : this;
    withSfuName(value: string) : this;
    withPollingInterval(intervalInMs: number) : this;
    withEndpoint(endpoint: string): this;
    watchAllTransport(value: boolean): this;
    build() : MediasoupSfuObserver;
}

export class MediasoupSfuObserver implements SfuObserver{

    public static builder(): Builder {
        let _comlink: Comlink | null = null;
        let _mediasoup: any = null;
        let _pollingIntervalInMs = 5000;
        let _watchAllTransport = true;
        let _sfuId : string | null = null;
        let _sfuName : string | null = null;
        const result : Builder = {
            withMediasoup(mediasoup: any): Builder {
                _mediasoup = mediasoup;
                return result;
            },
            withSfuId(value: string) : Builder {
                _sfuId = value;
                return this;
            },
            withSfuName(value: string): Builder {
                _sfuName = value;
                return this;
            },
            withPollingInterval(intervalInMs: number): Builder {
                _pollingIntervalInMs = intervalInMs;
                return result;
            },
            withEndpoint(endpoint: string): Builder {
                _comlink = Comlink.builder().withEndpoint(endpoint).build();
                return result;
            },
            watchAllTransport(value: boolean): Builder {
                _watchAllTransport = value;
                return result;
            },
            build(): MediasoupSfuObserver {
                if (_mediasoup === null) {
                    throw new Error("mediasoup object cannot be null for MediasoupSfuObserver");
                }
                const mediasoupWrapper = MediasoupWrapper.builder()
                    .withMediasoup(_mediasoup)
                    .watchAllTransports(_watchAllTransport)
                    .build();
                const mediasoupVisitor = MediasoupVisitor.builder()
                    .withMediasoupWrapper(mediasoupWrapper)
                    .build();
                const mediasoupSfuSampleProviderBuilder = MediasoupSfuSampleProvider.builder()
                    .withMediasoupVisitor(mediasoupVisitor);
                if (_sfuId !== null) {
                    mediasoupSfuSampleProviderBuilder.withSfuId(_sfuId);
                }
                const mediasoupSfuSampleProvider = mediasoupSfuSampleProviderBuilder
                    .build();
                const mediasoupSfuObserver = new MediasoupSfuObserver(_pollingIntervalInMs, mediasoupSfuSampleProvider);
                if (_comlink !== null) {
                    mediasoupSfuObserver._comlink = _comlink;
                }
                mediasoupSfuObserver._watchTransportMethod = (transport: any) => {
                    mediasoupWrapper.watchTransport(transport);
                };
                logger.info("SfuObserver is loaded 2");
                return mediasoupSfuObserver;
            }
        };
        return result;
    }
    private _emitter : EventEmitter = new EventEmitter();
    private _comlink :Comlink | null = null;
    private _pollingIntervalInMs: number;
    private _sampleRelayer : SfuSampleRelayer;
    private _sampleProvider: MediasoupSfuSampleProvider;
    private _watchTransportMethod?: (transport: any) => void;

    private constructor(pollingIntervalInMs: number, sampleProvider: MediasoupSfuSampleProvider) {
        this._pollingIntervalInMs = pollingIntervalInMs;
        this._sampleProvider = sampleProvider;
        this._sampleRelayer = new SfuSampleRelayer(sampleProvider, this._pollingIntervalInMs);
        this._sampleRelayer
            .onStarted(() => {
                logger.info("Sample Relayer has been started");
            })
            .onStopped(() => {
                logger.info("Sample Relayer has been stopped");
            })
            .onError(error => {
                this._emitter.emit(ON_ERROR_EVENT_NAME, error);
            })
            .onSample(sample => {
                this._process(sample);
            })
    }

    watchTransport(transport: any): this {
        if (this._watchTransportMethod === undefined) {
            logger.warn(`Cannot watch transport, because the udnerlying method has not been bound`);
            return this;
        }
        this._watchTransportMethod(transport);
        return this;
    }

    onError(listener: (event: Event) => void): this {
        this._emitter.addListener(ON_ERROR_EVENT_NAME, listener);
        return this;
    }

    onSample(listener: (sample: SfuSample) => void): this {
        this._emitter.addListener(ON_SAMPLE_EVENT_NAME, listener);
        return this;
    }

    start(): this {
        this._sampleRelayer.start();
        return this;
    }

    stop(): this {
        this._sampleRelayer.stop();
        return this;
    }

    markSamples(marker?: string): this {
        this._sampleProvider.markSamples(marker);
        return this;
    }

    sendExtensionStats(payloadType: string, payload: string) : this {
        this._sampleProvider.sendExtensionStats(payloadType, payload);
        return this;
    }

    _process(sample: SfuSample): void {
        this._emitter.emit(ON_SAMPLE_EVENT_NAME, sample);
        if (this._comlink === null) {
            logger.warn("No comlink has added, sample will not be sent to anywhere");
            return;
        }
        const serializedSample = JSON.stringify(sample);
        try {
            this._comlink.send(serializedSample);
        } catch (error) {
            this._comlink.close();
        }
    }
}