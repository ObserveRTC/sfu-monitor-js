import { makeUrl, Transport } from "./Transport";
import { EventEmitter } from "events";
import { createLogger } from "../utils/logger";
import * as http from "http";
import * as https from "https";
import { CodecConfig } from "../codecs/Codec";
import { Sleeper } from "../utils/Sleeper";

const logger = createLogger(`RestTransport`)

export type RestTransportConfig = {
    /**
     * Flag indicating if the Transport should be closed if request sending is failed
     */
    closeIfFailed?: boolean
    /**
     * The maximum number of retrying to send one message
     */
    maxRetries?: number;
    /**
     * The target url the websocket is opened for 
     */
    urls: string[];
    /**
     * Protocol to connect to a REST API server
     * 
     * possible values: "http", "https"
     * 
     * DEFAULT: https
     */    
    protocol?: "http" | "https";
}

const supplyDefaultConfig = () => {
    const result: RestTransportConfig = {
        urls: [],
        protocol: "http",
        
    };
    return result;
}

const ON_RECEIVED_EVENT_NAME = "onReceived";


export class RestTransport implements Transport {
    public static create(config?: RestTransportConfig): RestTransport {
        const appliedConfig = Object.assign(supplyDefaultConfig(), config);
        if (appliedConfig.urls.length < 1) {
            throw new Error(`Target URLs must be provided in config`);
        }
        const result = new RestTransport(appliedConfig);
        logger.info(`Created`, appliedConfig);
        return result;
    }
    private _sleeper = new Sleeper();
    private _format?: CodecConfig;
    private _config: RestTransportConfig;
    private _emitter: EventEmitter = new EventEmitter();
    private _sendingCounter = 0;
    private _sent?: Promise<void>;
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
        const id = ++this._sendingCounter;
        const clear = () => {
            if (id === this._sendingCounter) {
                this._sent = undefined;
            }
        };
        const prerequisite = this._sent ?? Promise.resolve();
        this._sent = prerequisite.then(() => this._send(message)).then(() => {
            clear();
        }).catch(err => {
            logger.warn(`Error occurred while posting data`, err);
            clear();
        });
    }

    public setFormat(format: CodecConfig): Transport {
        this._format = format;
        return this;
    }

    public onReceived(listener: (data: string) => void): Transport {
        if (this._closed) {
            throw new Error(`Cannot receive messages on a closed transport`);
        }
        this._emitter.on(ON_RECEIVED_EVENT_NAME, listener);
        return this;        
    }

    public offReceived(listener: (data: string) => void): Transport {
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
            this._sent = undefined;
        } finally {
            this._closed = true;
        }
        [ON_RECEIVED_EVENT_NAME].forEach(eventType => this._emitter.removeAllListeners(eventType));
    }

    private _send(message: Uint8Array, tried = 0): Promise<void> {
        if (this._closed) {
            return Promise.reject(`Cannot send mesage on an already closed transport`);
        }
        return new Promise<void>((resolve, _reject) => {
            const { urls, protocol, maxRetries, closeIfFailed } = this._config;
            const baseUrl = urls[tried % urls.length];
            const canRetry = tried + 1 < ((maxRetries ?? 0) * urls.length);
            const reject = async (err: Error) => {
                logger.warn(`Request failed. canRetry: ${canRetry}`, err);
                if (canRetry) {
                    await this._sleeper.sleep();
                    this._send(message, tried + 1).then(resolve).catch(reject);
                    return;
                }
                if (closeIfFailed) {
                    if (!this._closed) {
                        this.close();
                    }
                }
            }
            const options: http.RequestOptions | https.RequestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Content-Length': message.length,
                }
            }
            const responseHandler = (res: http.IncomingMessage) => {
                const ok = res.statusCode === undefined || res.statusCode === 200;
                const myLogger = ok ? logger.debug : logger.warn;
                myLogger(`Response Status: ${res.statusCode}`);
                myLogger(`Response Header: ${JSON.stringify(res.headers)}`);
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    myLogger(`Response body: ${chunk}`);
                });
                res.on('end', () => {
                    myLogger('No more data in response.');
                    resolve();
                });
            };
            let request: http.ClientRequest | undefined;
            const url = makeUrl(baseUrl, this._format);
            if (protocol === "http") {
                request = http.request(url, options, responseHandler);
            } else if (protocol === "https") {
                request = https.request(url, options, responseHandler);
            }
            if (!request) {
                reject(new Error(`Unrecognized protocol ${protocol}`));
                return;
            }
            request.on('error', (err: Error) => {
                reject(err);
            });
            request.write(message);
            request.end();
            logger.debug(`Sending message to ${url}`);
        });
    }
}