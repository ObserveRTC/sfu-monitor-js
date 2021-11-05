import { randomUUID } from "crypto";
import { EventEmitter } from "events"
import { uuid } from "uuidv4";
import { factory } from "./ConfigLog4j";
import { SfuSample } from "./SfuSample";
import * as WebSocket from 'ws';
 
const logger = factory.getLogger("SfuObserver.Comlink");

const ON_CONNECTED_EVENT_NAME = "onConnected";
const ON_CLOSED_EVENT_NAME = "onClosed";
const ON_ERROR_EVENT_NAME = "onError";

interface Builder {
    withEndpoint(endpoint: string): this;
    build(): Comlink;
}

export class Comlink {
    public static builder(): Builder {
        const comlink = new Comlink();
        // let _endpoint: string | null = null;
        // let _reconnectWaitingTimeInMs: number = 10000;
        return {
            withEndpoint(endpoint: string): Builder {
                // _endpoint = endpoint;
                comlink._url = endpoint;
                return this;
            },

            build(): Comlink {
                if (comlink._url === null) {
                    throw new Error(`Endpoint cannot be null`);
                }
                return comlink;
            }
        }
    }
    
    public readonly id : string;
    private _closed: boolean = false;
    private _buffer: string[];
    private _emitter: EventEmitter;
    private _url: string | null = null;
    private _ws: WebSocket | null = null;
    private _connecting: boolean = false;
    private _maxRetry: number = 30;

    private constructor() {
        this.id = uuid()
        this._buffer = [];
        this._emitter = new EventEmitter();
    }

    public get closed() {
        return this._closed;
    }

    public get url() {
        return this._url;
    }

    public onConnected(listener: () => void): Comlink {
        this._emitter.addListener(ON_CONNECTED_EVENT_NAME, listener);
        return this;
    }

    public onError(listener: (error: WebSocket.ErrorEvent) => void): Comlink {
        this._emitter.addListener(ON_ERROR_EVENT_NAME, listener);
        return this;
    }

    public onClosed(listener: () => void): Comlink {
        this._emitter.addListener(ON_CLOSED_EVENT_NAME, listener);
        return this;
    }

    setMaxRetry(maxRetry: number) {
        this._maxRetry = maxRetry;
        return this;
    }

    public async send(message: string): Promise<void> {
        if (this._closed) {
            logger.warn(`Attempted to send message on a closed comlink (${this.url})`);
            return;
        }
        if (this._ws === null || this._ws.readyState !== WebSocket.OPEN) {
            if (!this._connecting) {
                this._connect().catch(error => {
                    logger.error(`Connection failed, comlink will be closed`, error);
                    if (!this._closed) {
                        this.close();
                    }
                });
            }
            this._buffer.push(message);
            logger.debug(`Message is buffered`);
            return;
        }
        try {
            if (0 < this._buffer.length) {
                for (const prevMessage of this._buffer) {
                    if (!prevMessage) {
                        continue;
                    }
                    this._ws.send(prevMessage);
                }
                this._buffer = [];
                logger.info(`Buffered messages are sent, buffer is reset`);
            }
            this._ws.send(message);
            logger.debug(`Message is sent`);
        } catch (error: any) {
            logger.warn("Websocket encountered an error while sending message", error);
            this._ws = null;
            this._buffer.push(message);
        }
    }

    public close() {
        if (this._closed) {
            return;
        }
        this._close();
    }

    private _close(): void {
        if (this._ws) {
            this._ws.close();
        }
        this._emitter.emit(ON_CLOSED_EVENT_NAME);
        this._closed = true;
        logger.info(`Comlink to ${this._url} is closed`);
    }

    private async _connect(retried: number = 0): Promise<void> {
        if (this._url === null) {
            throw new Error(`Cannot connect to undefined or null URL`);
        }
        if (this._maxRetry < retried) {
            throw new Error(`Cannot connect to url ${this._url}`);
        }
        this._connecting = true;
        if (0 < retried) {
            await this._waitBeforeReconnect(retried);
        }
        const url = this._url;
        logger.info(`Connecting to remote endpoint ${url}, attempt: ${retried + 1}, maxRetry: ${this._maxRetry}`);
        try {
            const ws = new WebSocket(url);
            ws.onclose = this._onClose.bind(this);
            ws.onerror = this._onError.bind(this);
            await new Promise<void>((resolve, reject) => {
                const opened = () => {
                    this._ws = ws;
                    resolve();
                    this._emitter.emit(ON_CONNECTED_EVENT_NAME);
                    this._connecting = false;
                    logger.info(`Connection is established to ${url}`);
                };
                if (ws.readyState === WebSocket.OPEN) {
                    opened();
                } else {
                    ws.onopen = () => {
                        opened();
                    };
                    ws.onerror = error => {
                        reject(error);
                    };
                }
            });
        } catch (error: any) {
            logger.warn(`Connection failed to url ${url}, retried: ${retried}`, error);
            return await this._connect(retried + 1);
        }
    }

    private async _waitBeforeReconnect(executed: number) {
        const base = executed + 1;
        const max = 1 / base;
        const random = Math.random();
        const exp = 1 + Math.max(0.1, Math.min(random, max));
        const timeout = Math.floor(Math.min(Math.pow(base, exp), 60) * 1000);
        return new Promise<void>((resolve) => {
            logger.info(`Enforced waiting before reconnect is ${timeout}ms`);
            setTimeout(() => {
                resolve();
            }, timeout);
        })
        
    }

    private _onClose(): void {
        // no empty line
    }

    private _onError(error: WebSocket.ErrorEvent): void {
        this._emitter.emit(ON_ERROR_EVENT_NAME, error);
    }
}