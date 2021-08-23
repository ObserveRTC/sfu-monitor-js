import { uuid } from "uuidv4";
import { SfuSample } from "../SfuSample";
import { SfuSampleBuilder } from "../SfuSampleBuilder";
import { SfuSampleProvider as SfuSampleProvider } from "../SfuSampleProvider";
import { MediasoupVisitor } from "./MediasoupVisitor";

interface Builder {
    withSfuName(value: string) : this;
    withSfuId(value: string) : this;
    withMediasoupVisitor(visitor: MediasoupVisitor) : this;
    build() : MediasoupSfuSampleProvider;
}

export class MediasoupSfuSampleProvider implements SfuSampleProvider {
    
    public static builder(): Builder {
        let _visitor: MediasoupVisitor | null = null;
        let _sfuId = uuid();
        let _sfuName: string | null = null;
        const result: Builder = {
            withMediasoupVisitor(visitor: MediasoupVisitor): Builder {
                _visitor = visitor;
                return result;
            },
            withSfuName(value: string) {
                _sfuName = value;
                return result;
            },
            withSfuId(value: string) {
                _sfuId = value;
                return result;
            },
            build() : MediasoupSfuSampleProvider {
                if (_visitor === null) {
                    throw new Error("Cannot instantiate Mediasoup Sample Provider without a visitor");
                }
                return new MediasoupSfuSampleProvider(_visitor, _sfuId, _sfuName);
            }
        }
        return result;
    }
    private _sfuId: string;
    private _sfuName: string | null;
    private _visitor : MediasoupVisitor;
    private _marker: string | null = null;
    private _extensionType: string | null= null;
    private _extensionPayload: string | null = null;

    private constructor(visitor : MediasoupVisitor, sfuId : string, sfuName: string | null) {
        this._sfuId = sfuId;
        this._sfuName = sfuName;
        this._visitor = visitor;
    }

    async getSample(): Promise<SfuSample> {
        const builder = SfuSampleBuilder.create().withSfuId(this._sfuId);
        if (this._sfuName !== null) {
            builder.withSfuName(this._sfuName);
        }
        const promises = [
            // 0 -> transports
            this._visitor.visitTransports(),
        ];
        const responses = await Promise.all(promises);
        const transports = responses[0];
        for await (const rtpSource of this._visitor.visitRtpSources()) {
            builder.addRtpSource(rtpSource);
        }
        for await (const rtpSink of this._visitor.visitRtpSinks()) {
            builder.addRtpSink(rtpSink);
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