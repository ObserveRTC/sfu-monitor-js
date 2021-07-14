import { SfuSample, SfuTransport, SctpStream, SfuInboundRtpStream, SfuOutboundRtpStream } from "./SfuSample";

const TIME_ZONE_OFFSET_IN_HOURS = new Date().getTimezoneOffset();

export class SfuSampleBuilder {

    public static create() {
        const now = Date.now();
        return new SfuSampleBuilder()
            .withTimestamp(now)
            .withTimeZoneOffsetInHours(TIME_ZONE_OFFSET_IN_HOURS);
    }

    private _sfuId?: string;
    private _timestamp?: number;
    private _timeZoneOffsetInHours?: number;
    private _sfuTransports?: SfuTransport[];
    private _sctpStream?: SctpStream[];
    private _inboundRtpStreams?: SfuInboundRtpStream[];
    private _outboundRtpStreams?: SfuOutboundRtpStream[];
    private _marker?: string;

    private constructor() {
        // empty
    }

    withSfuId(sfuId: string): SfuSampleBuilder {
        this._sfuId = sfuId;
        return this;
    }

    withMarker(marker: string): SfuSampleBuilder {
        this._marker = marker;
        return this;
    }

    withTimestamp(timestamp: number) {
        this._timestamp = timestamp;
        return this;
    }

    withTimeZoneOffsetInHours(timeZoneOffsetInHours: number): SfuSampleBuilder {
        this._timeZoneOffsetInHours = timeZoneOffsetInHours;
        return this;
    }

    addTransportStat(sfuTransport: SfuTransport): SfuSampleBuilder {
        if (this._sfuTransports === null || this._sfuTransports === undefined) {
            this._sfuTransports = [];
        }
        this._sfuTransports!.push(sfuTransport);
        return this;
    }

    addInboundRtpStream(sfuRtpStream: SfuInboundRtpStream): SfuSampleBuilder {
        if (this._inboundRtpStreams === null || this._inboundRtpStreams === undefined) {
            this._inboundRtpStreams = [];
        }
        this._inboundRtpStreams!.push(sfuRtpStream);
        return this;
    }

    addOutboundRtpStream(sfuRtpStream: SfuOutboundRtpStream): SfuSampleBuilder {
        if (this._outboundRtpStreams === null || this._outboundRtpStreams === undefined) {
            this._outboundRtpStreams = [];
        }
        this._outboundRtpStreams!.push(sfuRtpStream);
        return this;
    }

    addSctpStream(sctpStream: SctpStream): SfuSampleBuilder {
        if (this._sctpStream === null || this._sctpStream === undefined) {
            this._sctpStream = [];
        }
        this._sctpStream!.push(sctpStream);
        return this;
    }

    build(): SfuSample {
        if (this._sfuId === null) {
            throw new Error("Cannot build a sample without id");
        }

        return {
            sfuId: this._sfuId!,
            inboundRtpStreams: this._inboundRtpStreams,
            outboudRtpStreams: this._outboundRtpStreams,
            sctpStreams: this._sctpStream,
            sfuTransports: this._sfuTransports,
            timestamp: this._timestamp!,
            timeZoneOffsetInHours: this._timeZoneOffsetInHours,
            marker: this._marker,
        };
    }
}
