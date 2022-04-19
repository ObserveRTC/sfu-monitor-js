import { Samples } from "@observertc/schemas"
import { Codec, CodecConfig, createCodec } from "./codecs/Codec";
import { RestTransport, RestTransportConfig } from "./transports/RestTransport";
import { Transport, TransportConfig } from "./transports/Transport";
import { EventEmitter } from "events";
import { WebsocketTransport, WebsocketTransportConfig } from "./transports/WebsocketTransport";
import { createLogger } from "./utils/logger";

const logger = createLogger(`Sender`);

const ON_ERROR_EVENT_NAME = "onError";
const ON_CLOSED_EVENT_NAME = "onClosed";

export type SenderConfig = {
    /**
     * Configure the codec used to transport samples or receieve 
     * feedback from the server.
     * 
     * Possible values: json, protobuf
     * 
     * DEFAULT: json
     * 
     */
    format?: CodecConfig;
    /**
     * Websocket configuration to transport the samples
     */
    websocket?: WebsocketTransportConfig;

    /**
     * Configuration to setup a REST api transport method for the samples.
     */
    rest?: RestTransportConfig;
}

type SenderConstructConfig = SenderConfig & {
    transport: TransportConfig,
}

const supplyDefaultConfig = () => {
    const defaultConfig: SenderConstructConfig = {
        transport: {}
    };
    return defaultConfig;
}

function createTransport(config: TransportConfig): Transport {
    if (config.websocket) {
        return WebsocketTransport.create(config.websocket);
    }
    if (config.rest) {
        return RestTransport.create(config.rest);
    }
    throw new Error(`No transport is manifested for config ${config}`);
}

export class Sender {
    public static create(config?: SenderConfig) {
        const appliedConfig = Object.assign(supplyDefaultConfig(), config);
        const result = new Sender(appliedConfig);
        return result;
    }
    private _closed = false;
    private _config: SenderConstructConfig;
    private _codec: Codec<Samples, Uint8Array>;
    private _emitter: EventEmitter = new EventEmitter();
    private _transport: Transport
    private constructor(config: SenderConstructConfig) {
        this._config = config;
        this._codec = createCodec<Samples>(this._config.format);
        this._transport = createTransport({
            websocket: config.websocket,
            rest: config.rest,
        }).setFormat(this._config.format ?? "json");
        
    }

    public get closed() {
        return this._closed;
    }

    public send(samples: Samples): void {
        if (this._closed) {
            throw new Error(`Cannot use an already closed Sender`);
        }
        const message = this._codec.encode(samples);
        
        // --- for observer decoding tests ---
        // const messageInBase64 = require("js-base64").Base64.fromUint8Array(message);
        // logger.info({
        //     original: JSON.stringify(samples),
        //     messageInBase64
        // });
        this._transport.send(message).catch(err => {
            if (!this._closed) {
                this._close(err);
            }
        });
    }

    /*eslint-disable @typescript-eslint/no-explicit-any */
    onError(listener: (err: any) => void): Sender {
        if (this._closed) {
            throw new Error(`Cannot subscribe / unsubscribe events of a closed Transport`);
        }
        this._emitter.once(ON_ERROR_EVENT_NAME, listener);
        return this;
    }

    /*eslint-disable @typescript-eslint/no-explicit-any */
    offError(listener: (err: any) => void): Sender {
        if (this._closed) {
            return this;
        }
        this._emitter.off(ON_ERROR_EVENT_NAME, listener);
        return this;
    }

    onClosed(listener: () => void): Sender {
        if (this._closed) {
            throw new Error(`Cannot subscribe / unsubscribe events of a closed Transport`);
        }
        this._emitter.once(ON_CLOSED_EVENT_NAME, listener);
        return this;
    }

    offClosed(listener: () => void): Sender {
        if (this._closed) {
            return this;
        }
        this._emitter.off(ON_CLOSED_EVENT_NAME, listener);
        return this;
    }

    public close(): void {
        if (this._closed) {
            return;
        }
        this._close();
    }

    public _close(err: any = undefined): void {
        if (this._closed) {
            logger.warn(`Attempted to close the Sender twice`);
            return;
        }
        try {
            if (!this._transport.closed) {
                this._transport.close();
            }
        } finally {
            this._closed = true;
            logger.info(`Closed`);
        }
        
        if (err) {
            this._emitter.emit(ON_ERROR_EVENT_NAME, err);
        } else {
            this._emitter.emit(ON_CLOSED_EVENT_NAME);
        }
        [
            ON_CLOSED_EVENT_NAME,
            ON_ERROR_EVENT_NAME
        ].forEach(eventType => this._emitter.removeAllListeners(eventType));
    }
}