import { SfuSample, SfuTransport, SctpStream, SfuRtpSource, SfuRtpSink } from "./SfuSample";

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
    private _rtpSources?: SfuRtpSource[];
    private _rtpSinks?: SfuRtpSink[];
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

    addRtpSource(sfuRtpSource: SfuRtpSource): SfuSampleBuilder {
        if (this._rtpSources === null || this._rtpSources === undefined) {
            this._rtpSources = [];
        }
        this._rtpSources!.push(sfuRtpSource);
        return this;
    }

    addRtpSink(sfuRtpSink: SfuRtpSink): SfuSampleBuilder {
        if (this._rtpSinks === null || this._rtpSinks === undefined) {
            this._rtpSinks = [];
        }
        this._rtpSinks!.push(sfuRtpSink);
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
            rtpSources: this._rtpSources,
            rtpSinks: this._rtpSinks,
            sctpStreams: this._sctpStream,
            sfuTransports: this._sfuTransports,
            timestamp: this._timestamp!,
            timeZoneOffsetInHours: this._timeZoneOffsetInHours,
            marker: this._marker,
        };
    }
}
