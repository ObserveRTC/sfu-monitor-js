import { SfuRtpSink } from "./SfuSample";

export class SfuRtpSinkBuilder {
    static builder() {
        throw new Error("Method not implemented.");
    }
    
    public static create(): SfuRtpSinkBuilder {
        return new SfuRtpSinkBuilder();
    }

    private _transportId: string | null = null;
    private _sinkId?: string | null = null;
    private _streamId: string | null = null;
    private _ssrc?: number | undefined;
    private _mediaType?: string | undefined;
    private _payloadType?: number | undefined;
    private _mimeType?: string | undefined;
    private _clockRate?: number | undefined;
    private _sdpFmtpLine?: string | undefined;
    private _rid?: string | undefined;
    private _rtxSsrc?: number | undefined;
    private _targetBitrate?: number | undefined;
    private _voiceActivityFlag?: boolean | undefined;
    private _firCount?: number | undefined;
    private _pliCount?: number | undefined;
    private _nackCount?: number | undefined;
    private _sliCount?: number | undefined;
    private _packetsSent?: number | undefined;
    private _packetsDiscarded?: number | undefined;
    private _packetsRetransmitted?: number | undefined;
    private _packetsFailedEncryption?: number | undefined;
    private _packetsDuplicated?: number | undefined;
    private _fecPacketsSent?: number | undefined;
    private _fecPacketsDiscarded?: number | undefined;
    private _bytesSent?: number | undefined;
    private _rtcpSrSent?: number | undefined;
    private _rtcpRrReceived?: number | undefined;
    private _rtxPacketsSent?: number | undefined;
    private _rtxPacketsDiscarded?: number | undefined;
    private _framesSent?: number | undefined;
    private _framesEncoded?: number | undefined;
    private _keyFramesEncoded?: number | undefined;
    private _attachments?: string | undefined;

    private constructor() {
        // empty
    }
    
    withTransportId(value: string): SfuRtpSinkBuilder {
        this._transportId = value;
        return this;
    }

    withStreamId(value: string): SfuRtpSinkBuilder {
        this._streamId = value;
        return this;
    }

    withSinkId(value?: string): SfuRtpSinkBuilder {
        this._sinkId = value;
        return this;
    }

    withSsrc(value?: number): SfuRtpSinkBuilder {
        this._ssrc = value;
        return this;
    }

    withMediaType(value?: string): SfuRtpSinkBuilder {
        this._mediaType = value;
        return this;
    }

    withPayloadType(value?: number): SfuRtpSinkBuilder {
        this._payloadType = value;
        return this;
    }

    withMimeType(value?: string): SfuRtpSinkBuilder {
        this._mimeType = value;
        return this;
    }

    withClockRate(value?: number): SfuRtpSinkBuilder {
        this._clockRate = value;
        return this;
    }

    withSdpFmtpLine(value?: string): SfuRtpSinkBuilder {
        this._sdpFmtpLine = value;
        return this;
    }

    withRid(value?: string): SfuRtpSinkBuilder {
        this._rid = value;
        return this;
    }

    withRtxSsrc(value?: number): SfuRtpSinkBuilder {
        this._rtxSsrc = value;
        return this;
    }

    withTargetBitrate(value?: number): SfuRtpSinkBuilder {
        this._targetBitrate = value;
        return this;
    }

    withVoiceActivityFlag(value?: boolean): SfuRtpSinkBuilder {
        this._voiceActivityFlag = value;
        return this;
    }

    withFirCount(value?: number): SfuRtpSinkBuilder {
        this._firCount = value;
        return this;
    }

    withPliCount(value?: number): SfuRtpSinkBuilder {
        this._pliCount = value;
        return this;
    }

    withNackCount(value?: number): SfuRtpSinkBuilder {
        this._nackCount = value;
        return this;
    }

    withSliCount(value?: number): SfuRtpSinkBuilder {
        this._sliCount = value;
        return this;
    }

    withPacketsSent(value?: number): SfuRtpSinkBuilder {
        this._packetsSent = value;
        return this;
    }

    withPacketsDiscarded(value?: number): SfuRtpSinkBuilder {
        this._packetsDiscarded = value;
        return this;
    }

    withPacketsRetransmitted(value?: number): SfuRtpSinkBuilder {
        this._packetsRetransmitted = value;
        return this;
    }

    withPacketsFailedEncryption(value?: number): SfuRtpSinkBuilder {
        this._packetsFailedEncryption = value;
        return this;
    }

    withPacketsDuplicated(value?: number): SfuRtpSinkBuilder {
        this._packetsDuplicated = value;
        return this;
    }

    withFecPacketsSent(value?: number): SfuRtpSinkBuilder {
        this._fecPacketsSent = value;
        return this;
    }

    withFecPacketsDiscarded(value?: number): SfuRtpSinkBuilder {
        this._fecPacketsDiscarded = value;
        return this;
    }

    withBytesSent(value?: number): SfuRtpSinkBuilder {
        this._bytesSent = value;
        return this;
    }

    withRtcpSrSent(value?: number): SfuRtpSinkBuilder {
        this._rtcpSrSent = value;
        return this;
    }

    withRtcpRrReceived(value?: number): SfuRtpSinkBuilder {
        this._rtcpRrReceived = value;
        return this;
    }

    withRtxPacketsSent(value?: number): SfuRtpSinkBuilder {
        this._rtxPacketsSent = value;
        return this;
    }

    withRtxPacketsDiscarded(value?: number): SfuRtpSinkBuilder {
        this._rtxPacketsDiscarded = value;
        return this;
    }

    withFramesSent(value?: number): SfuRtpSinkBuilder {
        this._framesSent = value;
        return this;
    }

    withFramesEncoded(value?: number): SfuRtpSinkBuilder {
        this._framesEncoded = value;
        return this;
    }

    withKeyFramesEncoded(value?: number): SfuRtpSinkBuilder {
        this._keyFramesEncoded = value;
        return this;
    }

    withAttachments(value?: string): SfuRtpSinkBuilder {
        this._attachments = value;
        return this;
    }

    build(): SfuRtpSink {
        if (this._transportId === null) {
            throw new Error("TransportId cannot be null");
        }
        if (this._streamId === null) {
            throw new Error("StreamId cannot be null");
        }
        if (this._sinkId === null) {
            throw new Error("SinkId cannot be null");
        }
        return {
            transportId: this._transportId,
            streamId: this._streamId,
            sinkId: this._sinkId,
            ssrc: this._ssrc,
            mediaType: this._mediaType,
            payloadType: this._payloadType,
            mimeType: this._mimeType,
            clockRate: this._clockRate,
            sdpFmtpLine: this._sdpFmtpLine,
            rid: this._rid,
            rtxSsrc: this._rtxSsrc,
            targetBitrate: this._targetBitrate,
            voiceActivityFlag: this._voiceActivityFlag,
            firCount: this._firCount,
            pliCount: this._pliCount,
            nackCount: this._nackCount,
            sliCount: this._sliCount,
            packetsSent: this._packetsSent,
            packetsDiscarded: this._packetsDiscarded,
            packetsRetransmitted: this._packetsRetransmitted,
            packetsFailedEncryption: this._packetsFailedEncryption,
            packetsDuplicated: this._packetsDuplicated,
            fecPacketsSent: this._fecPacketsSent,
            fecPacketsDiscarded: this._fecPacketsDiscarded,
            bytesSent: this._bytesSent,
            rtcpSrSent: this._rtcpSrSent,
            rtcpRrReceived: this._rtcpRrReceived,
            rtxPacketsSent: this._rtxPacketsSent,
            rtxPacketsDiscarded: this._rtxPacketsDiscarded,
            framesSent: this._framesSent,
            framesEncoded: this._framesEncoded,
            keyFramesEncoded: this._keyFramesEncoded,
            attachments: this._attachments,
        };
    }
}
