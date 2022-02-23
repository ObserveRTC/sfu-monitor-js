import { Samples, AvroSamples } from "@observertc/schemas"
import { Codec, CodecConfig, createCodec } from "./codecs/Codec";
import { createTransport, Transport, TransportConfig, TransportState } from "./transports/Transport"
import { createLogger } from "./utils/logger";

const logger = createLogger(`Sender`);

export type SenderConfig = {
    codec?: CodecConfig;
    debounceTimeInMs?: number;
}

type SenderConstructConfig = SenderConfig & {
    transport: TransportConfig,
}

const defaultConfig: SenderConstructConfig = {
    transport: {}
}

export class Sender {
    public static create(config?: SenderConfig) {
        const appliedConfig = Object.assign(defaultConfig, config);
        return new Sender(appliedConfig);
    }
    private _closed = false;
    private _config: SenderConstructConfig;
    private _codec: Codec<Samples, ArrayBuffer>;
    private _transport: Transport
    private constructor(config: SenderConstructConfig) {
        this._config = config;
        const codecConfig = this._config.codec;
        this._codec = createCodec<Samples>(codecConfig);
        this._transport = createTransport(this._config.transport);
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