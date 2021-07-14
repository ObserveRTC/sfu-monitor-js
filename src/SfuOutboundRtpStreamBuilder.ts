import { SfuOutboundRtpStream } from "./SfuSample";

export class SfuOutboundRtpStreamBuilder {
    static builder() {
        throw new Error("Method not implemented.");
    }
    
    public static create(): SfuOutboundRtpStreamBuilder {
        return new SfuOutboundRtpStreamBuilder();
    }

    private _transportId: string | null = null;
    private _trackId?: string | undefined;
    private _inboundStreamId?: string | undefined;
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
    
    withTransportId(value: string): SfuOutboundRtpStreamBuilder {
        this._transportId = value;
        return this;
    }

    withTrackId(value?: string): SfuOutboundRtpStreamBuilder {
        this._trackId = value;
        return this;
    }

    withStreamId(value: string): SfuOutboundRtpStreamBuilder {
        this._streamId = value;
        return this;
    }

    withInboundStreamId(value?: string): SfuOutboundRtpStreamBuilder {
        this._inboundStreamId = value;
        return this;
    }

    withSsrc(value?: number): SfuOutboundRtpStreamBuilder {
        this._ssrc = value;
        return this;
    }

    withMediaType(value?: string): SfuOutboundRtpStreamBuilder {
        this._mediaType = value;
        return this;
    }

    withPayloadType(value?: number): SfuOutboundRtpStreamBuilder {
        this._payloadType = value;
        return this;
    }

    withMimeType(value?: string): SfuOutboundRtpStreamBuilder {
        this._mimeType = value;
        return this;
    }

    withClockRate(value?: number): SfuOutboundRtpStreamBuilder {
        this._clockRate = value;
        return this;
    }

    withSdpFmtpLine(value?: string): SfuOutboundRtpStreamBuilder {
        this._sdpFmtpLine = value;
        return this;
    }

    withRid(value?: string): SfuOutboundRtpStreamBuilder {
        this._rid = value;
        return this;
    }

    withRtxSsrc(value?: number): SfuOutboundRtpStreamBuilder {
        this._rtxSsrc = value;
        return this;
    }

    withTargetBitrate(value?: number): SfuOutboundRtpStreamBuilder {
        this._targetBitrate = value;
        return this;
    }

    withVoiceActivityFlag(value?: boolean): SfuOutboundRtpStreamBuilder {
        this._voiceActivityFlag = value;
        return this;
    }

    withFirCount(value?: number): SfuOutboundRtpStreamBuilder {
        this._firCount = value;
        return this;
    }

    withPliCount(value?: number): SfuOutboundRtpStreamBuilder {
        this._pliCount = value;
        return this;
    }

    withNackCount(value?: number): SfuOutboundRtpStreamBuilder {
        this._nackCount = value;
        return this;
    }

    withSliCount(value?: number): SfuOutboundRtpStreamBuilder {
        this._sliCount = value;
        return this;
    }

    withPacketsSent(value?: number): SfuOutboundRtpStreamBuilder {
        this._packetsSent = value;
        return this;
    }

    withPacketsDiscarded(value?: number): SfuOutboundRtpStreamBuilder {
        this._packetsDiscarded = value;
        return this;
    }

    withPacketsRetransmitted(value?: number): SfuOutboundRtpStreamBuilder {
        this._packetsRetransmitted = value;
        return this;
    }

    withPacketsFailedEncryption(value?: number): SfuOutboundRtpStreamBuilder {
        this._packetsFailedEncryption = value;
        return this;
    }

    withPacketsDuplicated(value?: number): SfuOutboundRtpStreamBuilder {
        this._packetsDuplicated = value;
        return this;
    }

    withFecPacketsSent(value?: number): SfuOutboundRtpStreamBuilder {
        this._fecPacketsSent = value;
        return this;
    }

    withFecPacketsDiscarded(value?: number): SfuOutboundRtpStreamBuilder {
        this._fecPacketsDiscarded = value;
        return this;
    }

    withBytesSent(value?: number): SfuOutboundRtpStreamBuilder {
        this._bytesSent = value;
        return this;
    }

    withRtcpSrSent(value?: number): SfuOutboundRtpStreamBuilder {
        this._rtcpSrSent = value;
        return this;
    }

    withRtcpRrReceived(value?: number): SfuOutboundRtpStreamBuilder {
        this._rtcpRrReceived = value;
        return this;
    }

    withRtxPacketsSent(value?: number): SfuOutboundRtpStreamBuilder {
        this._rtxPacketsSent = value;
        return this;
    }

    withRtxPacketsDiscarded(value?: number): SfuOutboundRtpStreamBuilder {
        this._rtxPacketsDiscarded = value;
        return this;
    }

    withFramesSent(value?: number): SfuOutboundRtpStreamBuilder {
        this._framesSent = value;
        return this;
    }

    withFramesEncoded(value?: number): SfuOutboundRtpStreamBuilder {
        this._framesEncoded = value;
        return this;
    }

    withKeyFramesEncoded(value?: number): SfuOutboundRtpStreamBuilder {
        this._keyFramesEncoded = value;
        return this;
    }

    withAttachments(value?: string): SfuOutboundRtpStreamBuilder {
        this._attachments = value;
        return this;
    }

    build(): SfuOutboundRtpStream {
        if (this._transportId === null) {
            throw new Error("TransportId cannot be null");
        }
        if (this._streamId === null) {
            throw new Error("StreamId cannot be null");
        }
        return {
            transportId: this._transportId,
            trackId: this._trackId,
            inboundStreamId: this._inboundStreamId,
            streamId: this._streamId,
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
