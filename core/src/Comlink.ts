import { EventEmitter } from "events"
import { factory } from "./ConfigLog4j";
 
const logger = factory.getLogger("Comlink");

const ON_CONNECTED_EVENT_NAME = "onConnected";
const ON_CLOSED_EVENT_NAME = "onClosed";
const ON_ERROR_EVENT_NAME = "onError";

interface Builder {
    withPortNumber(port: number): this;
    withNoSsl(): this;
    withServiceId(serviceId: string): this;
    withMediaUnitId(mediaUnitId: string): this;
    withHost(host: string): this;
    withReconnectWaitingTimeInMs(waitingTimeInMs: number): this;
    build(): Comlink;
}

function sleep(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

export class Comlink {
    public static builder(): Builder {
        let _serviceId: string | null = null;
        let _mediaUnitId: string | null = null;
        let _host: string | null = null;
        let _portNumber: number | null = null;
        let _reconnectWaitingTimeInMs: number = 1000;
        let _noSSL = false;
        return {
            withPortNumber(port: number): Builder {
                _portNumber = port;
                return this;
            },

            withNoSsl(): Builder {
                _noSSL = true;
                return this;
            },

            withServiceId(serviceId: string): Builder {
                _serviceId = serviceId;
                return this;
            },

            withMediaUnitId(mediaUnitId: string): Builder {
                _mediaUnitId = mediaUnitId;
                return this;
            },
            
            withHost(host: string): Builder {
                _host = host;
                return this;
            },

            withReconnectWaitingTimeInMs(waitingTimeInMs: number): Builder {
                _reconnectWaitingTimeInMs = waitingTimeInMs;
                return this;
            },

            build(): Comlink {
                if (_host === null || _serviceId === null || _mediaUnitId === null) {
                    throw new Error(`Neither of the following parameter can be null: serviceId: ${_serviceId}, mediaUnitId: ${_mediaUnitId}, host: ${_host}`);
                }
                let endpoint;
                if (_portNumber !== null) {
                    endpoint = `${_host}:${_portNumber}`;
                } else {
                    endpoint = `${_host}`;
                }
                let wsProtocol = _noSSL ? "ws" : "wss";
                
                const wsUrl = `${wsProtocol}://${endpoint}/sfusamples/${_serviceId}/${_mediaUnitId}`;
                return new Comlink(
                    wsUrl,
                    _reconnectWaitingTimeInMs
                );
            }
        }
    }
    
    private _buffer: string[];
    private _emitter: EventEmitter;
    private _ws: WebSocket;
    private _reconnectWaitingTimeInMs: number;

    private constructor(wsUrl: string, reconnectWaitingTimeInMs: number) {
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

    public onError(listener: () => void): Comlink {
        this._emitter.addListener(ON_ERROR_EVENT_NAME, listener);
        return this;
    }

    public onClosed(listener: () => void): Comlink {
        this._emitter.addListener(ON_CLOSED_EVENT_NAME, listener);
        return this;
    }

    public async send(sample: SfuSample): Promise<void> {
        const serializedSample = JSON.stringify(sample);
        this._buffer.push(serializedSample);
        const length = this._buffer.length;
        for (let i = 0; i < length; ++i) {
            const message = this._buffer.shift();
            if (message === undefined) {
                continue;
            }
            await this._send(message);
        }
    }

    private _close(): void {
        this._ws.close();
        this._emitter.emit(ON_CLOSED_EVENT_NAME);
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
        result.onerror = error => this._onError(error);
        return result;
    }

    private _onOpen(): void {
        this._emitter.emit(ON_CONNECTED_EVENT_NAME);
    }

    private _onClose(): void {
        
    }

    private _onError(error: Event): void {
        this._emitter.emit(ON_ERROR_EVENT_NAME, error);
    }
}