import { SfuSample, SfuTransport, SctpStream, SfuOutboundRtpPad, SfuInboundRtpPad } from "./SfuSample";

const TIME_ZONE_OFFSET_IN_HOURS = new Date().getTimezoneOffset();

export class SfuSampleBuilder {

    public static create() {
        const now = Date.now();
        return new SfuSampleBuilder()
            .withTimestamp(now)
            .withTimeZoneOffsetInHours(TIME_ZONE_OFFSET_IN_HOURS);
    }

    private _sfuId?: string;
    private _sfuName?: string;
    private _timestamp?: number;
    private _timeZoneOffsetInHours?: number;
    private _sfuTransports?: SfuTransport[];
    private _sctpStream?: SctpStream[];
    private _inboundRtpPads?: SfuInboundRtpPad[];
    private _outboundRtpPads?: SfuOutboundRtpPad[];
    private _marker?: string;

    private constructor() {
        // empty
    }

    withSfuId(sfuId: string): SfuSampleBuilder {
        this._sfuId = sfuId;
        return this;
    }

    withSfuName(sfuName: string): SfuSampleBuilder {
        this._sfuName = sfuName;
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

    addInboundRtpPad(inboundRtpPad: SfuInboundRtpPad): SfuSampleBuilder {
        if (this._inboundRtpPads === null || this._inboundRtpPads === undefined) {
            this._inboundRtpPads = [];
        }
        this._inboundRtpPads!.push(inboundRtpPad);
        return this;
    }

    addOutboundRtpPad(outboundRtpPad: SfuOutboundRtpPad): SfuSampleBuilder {
        if (this._outboundRtpPads === null || this._outboundRtpPads === undefined) {
            this._outboundRtpPads = [];
        }
        this._outboundRtpPads!.push(outboundRtpPad);
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
            sfuName: this._sfuName,
            outboundRtpStreams: this._outboundRtpPads,
            inboundRtpStreams: this._inboundRtpPads,
            sctpStreams: this._sctpStream,
            sfuTransports: this._sfuTransports,
            timestamp: this._timestamp!,
            timeZoneOffsetInHours: this._timeZoneOffsetInHours,
            marker: this._marker,
        };
    }
}
