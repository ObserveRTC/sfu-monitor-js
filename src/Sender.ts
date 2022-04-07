import { Samples } from "@observertc/schemas"
import { Codec, CodecConfig, createCodec } from "./codecs/Codec";
import { RestTransport, RestTransportConfig } from "./transports/RestTransport";
import { Transport, TransportConfig, TransportState } from "./transports/Transport"
import { WebsocketTransport, WebsocketTransportConfig } from "./transports/WebsocketTransport";
import { createLogger } from "./utils/logger";

const logger = createLogger(`Sender`);

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
        return new Sender(appliedConfig);
    }
    private _closed = false;
    private _config: SenderConstructConfig;
    private _codec: Codec<Samples, ArrayBuffer>;
    private _transport: Transport
    private constructor(config: SenderConstructConfig) {
        this._config = config;
        this._codec = createCodec<Samples>(this._config.format);
        this._transport = createTransport({
            websocket: config.websocket,
            rest: config.rest,
        });
    }
    
    public close(): void {
        if (this._closed) {
            logger.warn(`Attempted to close the Sender twice`);
            return;
        }
        this._closed = true;
        if (!this._transport.closed) {
            this._transport.close();
        }
    }

    public get closed() {
        return this._closed;
    }

    public async send(samples: Samples): Promise<void> {
        if (this._closed) {
            throw new Error(`Cannot use an already closed Sender`);
        }
        const message = this._codec.encode(samples);
        switch (this._transport.state) {
            case TransportState.Created:
                await this._transport.connect();
                break;
            case TransportState.Closed:
                logger.error(`Transport is closed, sending is not possible`);
                this.close();
                return;
            case TransportState.Connecting:
                break;
            case TransportState.Connected:
                break;
        }
        await this._transport.send(message);
    }
}