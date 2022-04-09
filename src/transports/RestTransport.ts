import { Transport } from "./Transport";
import { EventEmitter } from "events";
import { createLogger } from "../utils/logger";
import { Queue } from "../utils/Queue";
import * as http from "http";
import * as https from "https";

const logger = createLogger(`RestTransport`)

export type RestTransportConfig = {
    /**
     * The target url the websocket is opened for 
     */
    url: string;
    /**
     * Protocol to connect to a REST API server
     * 
     * possible values: "http", "https"
     * 
     * DEFAULT: https
     */    
    protocol?: "http" | "https";

    /**
     * In case of https protocol, this is the key
     * 
     * DEFAULT: undefined
     */
    key?: string;
    /**
     * In case of https protocol, this is the cert
     * 
     * DEFAULT: undefined
     */
    cert?: string;
}

const supplyDefaultConfig = () => {
    const result: RestTransportConfig = {
        url: "cannot be this",
        protocol: "http",
        
    };
    return result;
}

const ON_RECEIVED_EVENT_NAME = "onReceived";


export class RestTransport implements Transport {
    public static create(config?: RestTransportConfig): RestTransport {
        const appliedConfig = Object.assign(supplyDefaultConfig(), config);
        const result = new RestTransport(appliedConfig);
        logger.info(`${RestTransport.name} is created`);
        return result;
    }
    private _config: RestTransportConfig;
    private _emitter: EventEmitter = new EventEmitter();
    private _buffer: Queue<Uint8Array> = new Queue();
    private _closed = false;
    private constructor(config: RestTransportConfig) {
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
        while (!this._buffer.isEmpty) {
            const queuedMessage = this._buffer.pop();
            if (!queuedMessage) continue;
            const length = queuedMessage.length;
            const request = this._createRequest(length);
            if (!request) continue;
            
            request.write(queuedMessage);
            request.end();
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
            this._buffer.clear();
        } finally {
            this._closed = true;
        }
        [ON_RECEIVED_EVENT_NAME].forEach(eventType => this._emitter.removeAllListeners(eventType));
    }

    private _createRequest(length: number): http.ClientRequest | undefined {
        const { url, protocol } = this._config;
        const options: http.RequestOptions | https.RequestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Length': length,
            }
        }
        const responseHandler = (res: http.IncomingMessage) => {
            logger.debug(`STATUS: ${res.statusCode}`);
            logger.debug(`HEADERS: ${JSON.stringify(res.headers)}`);
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                logger.debug(`BODY: ${chunk}`);
            });
            res.on('end', () => {
                logger.debug('No more data in response.');
            });
        };
        if (protocol === "http") {
            return http.request(url, options, responseHandler);
        } 
        if (protocol === "https") {
            const { key, cert } = this._config;
            if (!key || !cert) {
                logger.error(`without key or cert https is not possible`);
                return;
            }
            Object.assign(options, {
                key,
                cert
            })
            return https.request(url, options, responseHandler);
        }
        logger.warn(`Unrecognized protocol ${protocol}`);
    }
}