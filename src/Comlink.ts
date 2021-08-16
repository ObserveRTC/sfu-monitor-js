import { randomUUID } from "crypto";
import { EventEmitter } from "events"
import { uuid } from "uuidv4";
import { factory } from "./ConfigLog4j";
import { SfuSample } from "./SfuSample";
import * as WebSocket from 'ws';
 
const logger = factory.getLogger("Comlink");

const ON_CONNECTED_EVENT_NAME = "onConnected";
const ON_CLOSED_EVENT_NAME = "onClosed";
const ON_ERROR_EVENT_NAME = "onError";

interface Builder {
    withEndpoint(endpoint: string): this;
    withReconnectWaitingTimeInMs(waitingTimeInMs: number): this;
    build(): Comlink;
}

function sleep(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

export class Comlink {
    public static builder(): Builder {
        let _endpoint: string | null = null;
        let _reconnectWaitingTimeInMs: number = 1000;
        return {
            withEndpoint(endpoint: string): Builder {
                _endpoint = endpoint;
                return this;
            },

            withReconnectWaitingTimeInMs(waitingTimeInMs: number): Builder {
                _reconnectWaitingTimeInMs = waitingTimeInMs;
                return this;
            },

            build(): Comlink {
                if (_endpoint === null) {
                    throw new Error(`Endpoint cannot be null`);
                }
                return new Comlink(
                    _endpoint,
                    _reconnectWaitingTimeInMs
                );
            }
        }
    }
    
    public readonly id : string;
    private _closed: boolean = false;
    private _buffer: string[];
    private _emitter: EventEmitter;
    private _ws: WebSocket;
    private _reconnectWaitingTimeInMs: number;

    private constructor(wsUrl: string, reconnectWaitingTimeInMs: number) {
        this.id = uuid()
        this._buffer = [];
        this._emitter = new EventEmitter();
        this._ws = this._makeWebsocket(wsUrl, undefined);
        this._reconnectWaitingTimeInMs = reconnectWaitingTimeInMs;
    }

    public get url() {
        return this._ws.url;
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

    public async send(message: string): Promise<void> {
        this._buffer.push(message);
        const length = this._buffer.length;
        for (let i = 0; i < length; ++i) {
            const bufferedMessage = this._buffer.shift();
            if (bufferedMessage === undefined) {
                continue;
            }
            await this._send(bufferedMessage);
        }
    }

    public close() {
        if (this._closed) {
            return;
        }
        this._close();
    }

    private _close(): void {
        this._ws.close();
        this._emitter.emit(ON_CLOSED_EVENT_NAME);
        this._closed = true;
    }

    private async _send(message: string): Promise<void> {
        let retry = false;
        do {
            try {
                this._ws.send(message);
            } catch (error) {
                logger.warn("Websocket encountered an error while sending message", error);
                for (let attempt = 0; attempt < 3 && retry === false; ++attempt) {
                    await sleep(this._reconnectWaitingTimeInMs);
                    retry = this._reconnect();
                }
                if (!retry) {
                    logger.error("Cannot reconnect to websocket");
                    this._emitter.emit(ON_ERROR_EVENT_NAME, error);
                    this._close();
                }
            }
        } while(retry);
    }

    private _reconnect(): boolean {
        const url = this._ws.url;
        const protocol = this._ws.protocol;
        try {
            this._ws = this._makeWebsocket(url, protocol);
        } catch (error) {
            logger.warn("Cannot connect to server.", error);
            return false;
        }
        return true;
    }

    private _makeWebsocket(url: string, protocol: string | undefined): WebSocket {
        const result = new WebSocket(url, protocol);
        if (result.readyState === WebSocket.OPEN) {
            this._emitter.emit(ON_CONNECTED_EVENT_NAME);
        }
        result.onopen = () => this._onOpen();
        result.onclose = () => this._onClose();
        result.onerror = (error: WebSocket.ErrorEvent) => this._onError(error);
        return result;
    }

    private _onOpen(): void {
        this._emitter.emit(ON_CONNECTED_EVENT_NAME);
    }

    private _onClose(): void {
        // no empty line
    }

    private _onError(error: WebSocket.ErrorEvent): void {
        this._emitter.emit(ON_ERROR_EVENT_NAME, error);
    }
}