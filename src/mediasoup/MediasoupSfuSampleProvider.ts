import { uuid } from "uuidv4";
import { SfuSample } from "../SfuSample";
import { SfuSampleBuilder } from "../SfuSampleBuilder";
import { SfuSampleProvider as SfuSampleProvider } from "../SfuSampleProvider";
import { MediasoupVisitor } from "./MediasoupVisitor";

interface Builder {
    withMediasoupVisitor(visitor: MediasoupVisitor) : this;
    build() : MediasoupSfuSampleProvider;
}

export class MediasoupSfuSampleProvider implements SfuSampleProvider {
    
    public static builder(): Builder {
        let _visitor: MediasoupVisitor | null = null;
        const result: Builder = {
            withMediasoupVisitor(visitor: MediasoupVisitor): Builder {
                _visitor = visitor;
                return result;
            },
            build() : MediasoupSfuSampleProvider {
                if (_visitor === null) {
                    throw new Error("Cannot instantiate Mediasoup Sample Provider without a visitor");
                }
                return new MediasoupSfuSampleProvider(_visitor);
            }
        }
        return result;
    }
    private readonly _sfuId: string = uuid();
    private _visitor : MediasoupVisitor;
    private _marker: string | null = null;
    private _extensionType: string | null= null;
    private _extensionPayload: string | null = null;

    private constructor(visitor : MediasoupVisitor) {
        this._visitor = visitor;
    }

    async getSample(): Promise<SfuSample> {
        const builder = SfuSampleBuilder.create().withSfuId(this._sfuId);
        const promises = [
            // 0 -> transports
            this._visitor.visitTransports(),
        ];
        const responses = await Promise.all(promises);
        const transports = responses[0];
        for await (const inboundRtpStream of this._visitor.visitInboundRtpStreams()) {
            builder.addInboundRtpStream(inboundRtpStream);
        }
        for await (const outboundRtpStream of this._visitor.visitOutboundRtpStreams()) {
            builder.addOutboundRtpStream(outboundRtpStream);
        }
        for await (const transportStat of this._visitor.visitTransports()) {
            builder.addTransportStat(transportStat);
        }
        for await (const sctpStream of this._visitor.visitSctpStreams()) {
            builder.addSctpStream(sctpStream);
        }
        if (this._marker !== null) {
            builder.withMarker(this._marker);
        }
        return builder.build();
    }

    markSamples(marker?: string): this {
        if (marker === null || marker === undefined) {
            this._marker = null;
            return this;
        }
        this._marker = marker;
        return this;
    }

    sendExtensionStats(payloadType: string, payload: string) : this {
        return this;
    }
}