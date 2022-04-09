import { Transport } from "./Transport";
import { ClientOptions, WebSocket }  from 'ws';
import { EventEmitter } from "events";
import { createLogger } from "../utils/logger";
import { Queue } from "../utils/Queue";

const logger = createLogger(`WebsocketTransport`)

export type WebsocketTransportConfig = {
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
    socketOptions?: ClientOptions;
}

type WebsocketTransportConstructorConfig = WebsocketTransportConfig & {
    maxRetry: number,
}

const supplyDefaultConfig = () => {
    const result: WebsocketTransportConstructorConfig = {
        url: "cannot be this",
        maxRetry: 3
    };
    return result;
}

const ON_RECEIVED_EVENT_NAME = "onReceived";


export class WebsocketTransport implements Transport {
    public static create(config?: WebsocketTransportConfig): WebsocketTransport {
        const appliedConfig = Object.assign(supplyDefaultConfig(), config);
        const result = new WebsocketTransport(appliedConfig);
        logger.info(`${WebsocketTransport.name} is created`);
        return result;
    }
    private _cancelTimer?: () => void;
    private _config: WebsocketTransportConfig;
    private _emitter: EventEmitter = new EventEmitter();
    private _buffer: Queue<Uint8Array> = new Queue();
    private _closed: boolean = false;
    private _ws?: WebSocket;
    private constructor(config: WebsocketTransportConstructorConfig) {
        this._config = config;
    }
    public get closed(): boolean {
        return this._closed;
    }


    public async send(message: Uint8Array): Promise<void> {
        if (this._closed) {
            throw new Error(`Cannot send data on a closed transport`);
        }
        if (0 < this._buffer.size) {
            this._buffer.push(message);
            return;
        }
        this._buffer.push(message);
        if (!this._ws) {
            this._ws = await this._connect();
        }
        while (!this._buffer.isEmpty) {
            const queuedMessage = this._buffer.pop();
            this._ws.send(queuedMessage, { binary: true });
        }
    }

    onReceived(listener: (data: string) => void): Transport {
        if (this._closed) {
            throw new Error(`Cannot receive messages on a closed transport`);
        }
        this._emitter.on(ON_RECEIVED_EVENT_NAME, listener);
        return this;        
    }

    offReceived(listener: (data: string) => void): Transport {
        if (this._closed) {
            return this;
        }
        this._emitter.off(ON_RECEIVED_EVENT_NAME, listener);
        return this;
    }

    public close(): void {
        if (this._closed) {
            return;
        }
        try {
            if (this._ws) {
                this._ws.close();
            }
            this._buffer.clear();
        } finally {
            this._closed = true;
        }
        
        if (this._cancelTimer) {
            this._cancelTimer();
        }
        [ON_RECEIVED_EVENT_NAME].forEach(eventType => this._emitter.removeAllListeners(eventType));
    }


    private async _connect(tried = 0): Promise<WebSocket> {
        if (this._closed) {
            return Promise.reject(`The transport is already closed`);
        }
        const url = this._config.url;
        const socketOptions = this._config.socketOptions;
        return new Promise<WebSocket>((resolve, reject) => {
            const ws = new WebSocket(url, socketOptions);
            const opened = () => {
                logger.info(`Connection is established to ${url}`);
                resolve(ws);
            };
            if (ws.readyState === WebSocket.OPEN) {
                opened();
            } else {
                ws.onopen = () => {
                    opened();
                };
                ws.onerror = (error: any) => {
                    reject(error);
                };
            }
        }).catch(async (err: any) => {
            if (this._config.maxRetry && tried < this._config.maxRetry) {
                logger.info(`Connection to ${url} is failed. Tried: ${tried}, Error:`, err);
                await this._waitBeforeReconnect(tried + 1);
                // if the transport is closed during waiting, 
                // the call to connect again is going to be rejected
                return await this._connect(tried + 1);
            }
            throw new Error(`Cannot connect to ${url}.`);
        });
    }

    private async _waitBeforeReconnect(executed: number) {
        const base = executed + 1;
        const max = 1 / base;
        const random = Math.random();
        const exp = 1 + Math.max(0.1, Math.min(random, max));
        const timeout = Math.floor(Math.min(Math.pow(base, exp), 60) * 1000);
        return new Promise<void>((resolve) => {
            const timer = setTimeout(() => {
                this._cancelTimer = undefined;
                resolve();
            }, timeout);
            this._cancelTimer = () => {
                clearTimeout(timer);
                this._cancelTimer = undefined;
            };
            logger.info(`Enforced waiting before reconnect is ${timeout}ms`);
        });
    }
}