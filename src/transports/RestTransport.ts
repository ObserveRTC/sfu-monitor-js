import { Transport, TransportState } from "./Transport";
import { EventEmitter } from "events";
import { createLogger } from "../utils/logger";
import axios, { AxiosRequestConfig } from 'axios';

const logger = createLogger(`RestTransport`)

export type RestTransportConfig = {
    /**
     * The target url the websocket is opened for 
     */
    url: string;
     /**
     * The maximum number of try to connect to the server
     * 
     * DEFAULT: 3
     */
    maxRetry?: number;
    /**
     * An optional field for additional socket option from ws package
     */
    restConfig?: AxiosRequestConfig;
}

type RestTransportConstructorConfig = RestTransportConfig & {
    maxRetry: number,
}

type Request = () => Promise<void>;

const supplyDefaultConfig = () => {
    const result: RestTransportConstructorConfig = {
        url: "cannot be this",
        maxRetry: 3,
    };
    return result;
}

const ON_STATE_CHANGED_EVENT_NAME = "onStateChanged";
const ON_RECEIVED_EVENT_NAME = "onReceived";
const ON_ERROR_EVENT_NAME = "onError";

export class RestTransport implements Transport {
    public static create(config?: RestTransportConfig): RestTransport {
        const appliedConfig = Object.assign(supplyDefaultConfig(), config);
        return new RestTransport(appliedConfig)
    }
    private _config: RestTransportConfig;
    private _state: TransportState = TransportState.Created;
    private _requests: Map<Number, Request> = new Map();
    private _emitter: EventEmitter = new EventEmitter();
    private constructor(config: RestTransportConstructorConfig) {
        this._config = config;
    }
    public get closed(): boolean {
        return this._state === TransportState.Closed;
    }

    public connect(): Promise<void> {
        if (this._state === TransportState.Closed) {
            return Promise.reject(`The transport is already closed`);
        }
        if (this._state === TransportState.Connected) {
            return Promise.resolve();
        }
        this._setState(TransportState.Connected);
        return Promise.resolve();
    }

    public get state(): TransportState {
        return this._state;
    }

    public async send(message: Uint8Array): Promise<void> {
        if (this._state !== TransportState.Connected) {
            throw new Error(`Transport must be Connected state to send any data`);
        }
        const { url, restConfig } = this._config;
        const index = this._requests.size;
        this._requests.set(index, () => {
            return axios.post(url, message, restConfig)
                .then(response => {
                    this._requests.delete(index);
                    const nextRequest = this._requests.get(index + 1);
                    if (!nextRequest) return;
                    nextRequest();
                })
                .catch(err => {
                    this._requests.delete(index);
                    logger.warn(`Error while sending message`, err);
                });
        });
    }

    onReceived(listener: (data: string) => void): Transport {
        if (this._state === TransportState.Closed) {
            throw new Error(`Cannot subscribe / unsubscribe events of a closed Transport`);
        }
        this._emitter.on(ON_RECEIVED_EVENT_NAME, listener);
        return this;        
    }

    offReceived(listener: (data: string) => void): Transport {
        if (this._state === TransportState.Closed) {
            throw new Error(`Cannot subscribe / unsubscribe events of a closed Transport`);
        }
        this._emitter.off(ON_RECEIVED_EVENT_NAME, listener);
        return this;
    }

    onStateChanged(listener: (newState: TransportState) => void): Transport {
        if (this._state === TransportState.Closed) {
            throw new Error(`Cannot subscribe / unsubscribe events of a closed Transport`);
        }
        this._emitter.on(ON_STATE_CHANGED_EVENT_NAME, listener);
        return this;
    }

    offStateChanged(listener: (newState: TransportState) => void): Transport {
        if (this._state === TransportState.Closed) {
            throw new Error(`Cannot subscribe / unsubscribe events of a closed Transport`);
        }
        this._emitter.off(ON_STATE_CHANGED_EVENT_NAME, listener);
        return this;
    }

    /*eslint-disable @typescript-eslint/no-explicit-any */
    onError(listener: (err: any) => void): Transport {
        if (this._state === TransportState.Closed) {
            throw new Error(`Cannot subscribe / unsubscribe events of a closed Transport`);
        }
        this._emitter.on(ON_ERROR_EVENT_NAME, listener);
        return this;
    }

    /*eslint-disable @typescript-eslint/no-explicit-any */
    offError(listener: (err: any) => void): Transport {
        if (this._state === TransportState.Closed) {
            throw new Error(`Cannot subscribe / unsubscribe events of a closed Transport`);
        }
        this._emitter.off(ON_ERROR_EVENT_NAME, listener);
        return this;
    }

    public async close(): Promise<void> {
        if (this._state === TransportState.Closed) {
            return Promise.resolve();
        }
        [ON_ERROR_EVENT_NAME, ON_RECEIVED_EVENT_NAME].forEach(eventType => this._emitter.removeAllListeners(eventType));
        this._setState(TransportState.Closed);
        this._emitter.removeAllListeners(ON_STATE_CHANGED_EVENT_NAME);
    }

    private _setState(state: TransportState): void {
        if (this._state === state) return;
        const prevState = this._state;
        this._state = state;
        this._emitter.emit(ON_STATE_CHANGED_EVENT_NAME, {
            prevState,
            state,
        });
    }
}