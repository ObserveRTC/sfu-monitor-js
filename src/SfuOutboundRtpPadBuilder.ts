import { SfuOutboundRtpPad } from "./SfuSample";

export class SfuOutboundRtpPadBuilder {
    static builder() {
        throw new Error("Method not implemented.");
    }
    
    public static create(): SfuOutboundRtpPadBuilder {
        return new SfuOutboundRtpPadBuilder();
    }

    private _transportId: string | null = null;
    private _rtpStreamId: string | null = null;
    private _padId?: string | null = null;
    private _piped: boolean = false;
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
    
    withTransportId(value: string): SfuOutboundRtpPadBuilder {
        this._transportId = value;
        return this;
    }

    withRtpStreamId(value: string): SfuOutboundRtpPadBuilder {
        this._rtpStreamId = value;
        return this;
    }

    withPadId(value?: string): SfuOutboundRtpPadBuilder {
        this._padId = value;
        return this;
    }

    withPiped(value: boolean): SfuOutboundRtpPadBuilder {
        this._piped = value;
        return this;
    }

    withSsrc(value?: number): SfuOutboundRtpPadBuilder {
        this._ssrc = value;
        return this;
    }

    withMediaType(value?: string): SfuOutboundRtpPadBuilder {
        this._mediaType = value;
        return this;
    }

    withPayloadType(value?: number): SfuOutboundRtpPadBuilder {
        this._payloadType = value;
        return this;
    }

    withMimeType(value?: string): SfuOutboundRtpPadBuilder {
        this._mimeType = value;
        return this;
    }

    withClockRate(value?: number): SfuOutboundRtpPadBuilder {
        this._clockRate = value;
        return this;
    }

    withSdpFmtpLine(value?: string): SfuOutboundRtpPadBuilder {
        this._sdpFmtpLine = value;
        return this;
    }

    withRid(value?: string): SfuOutboundRtpPadBuilder {
        this._rid = value;
        return this;
    }

    withRtxSsrc(value?: number): SfuOutboundRtpPadBuilder {
        this._rtxSsrc = value;
        return this;
    }

    withTargetBitrate(value?: number): SfuOutboundRtpPadBuilder {
        this._targetBitrate = value;
        return this;
    }

    withVoiceActivityFlag(value?: boolean): SfuOutboundRtpPadBuilder {
        this._voiceActivityFlag = value;
        return this;
    }

    withFirCount(value?: number): SfuOutboundRtpPadBuilder {
        this._firCount = value;
        return this;
    }

    withPliCount(value?: number): SfuOutboundRtpPadBuilder {
        this._pliCount = value;
        return this;
    }

    withNackCount(value?: number): SfuOutboundRtpPadBuilder {
        this._nackCount = value;
        return this;
    }

    withSliCount(value?: number): SfuOutboundRtpPadBuilder {
        this._sliCount = value;
        return this;
    }

    withPacketsSent(value?: number): SfuOutboundRtpPadBuilder {
        this._packetsSent = value;
        return this;
    }

    withPacketsDiscarded(value?: number): SfuOutboundRtpPadBuilder {
        this._packetsDiscarded = value;
        return this;
    }

    withPacketsRetransmitted(value?: number): SfuOutboundRtpPadBuilder {
        this._packetsRetransmitted = value;
        return this;
    }

    withPacketsFailedEncryption(value?: number): SfuOutboundRtpPadBuilder {
        this._packetsFailedEncryption = value;
        return this;
    }

    withPacketsDuplicated(value?: number): SfuOutboundRtpPadBuilder {
        this._packetsDuplicated = value;
        return this;
    }

    withFecPacketsSent(value?: number): SfuOutboundRtpPadBuilder {
        this._fecPacketsSent = value;
        return this;
    }

    withFecPacketsDiscarded(value?: number): SfuOutboundRtpPadBuilder {
        this._fecPacketsDiscarded = value;
        return this;
    }

    withBytesSent(value?: number): SfuOutboundRtpPadBuilder {
        this._bytesSent = value;
        return this;
    }

    withRtcpSrSent(value?: number): SfuOutboundRtpPadBuilder {
        this._rtcpSrSent = value;
        return this;
    }

    withRtcpRrReceived(value?: number): SfuOutboundRtpPadBuilder {
        this._rtcpRrReceived = value;
        return this;
    }

    withRtxPacketsSent(value?: number): SfuOutboundRtpPadBuilder {
        this._rtxPacketsSent = value;
        return this;
    }

    withRtxPacketsDiscarded(value?: number): SfuOutboundRtpPadBuilder {
        this._rtxPacketsDiscarded = value;
        return this;
    }

    withFramesSent(value?: number): SfuOutboundRtpPadBuilder {
        this._framesSent = value;
        return this;
    }

    withFramesEncoded(value?: number): SfuOutboundRtpPadBuilder {
        this._framesEncoded = value;
        return this;
    }

    withKeyFramesEncoded(value?: number): SfuOutboundRtpPadBuilder {
        this._keyFramesEncoded = value;
        return this;
    }

    withAttachments(value?: string): SfuOutboundRtpPadBuilder {
        this._attachments = value;
        return this;
    }

    build(): SfuOutboundRtpPad {
        if (this._transportId === null) {
            throw new Error("TransportId cannot be null");
        }
        if (this._rtpStreamId === null) {
            throw new Error("StreamId cannot be null");
        }
        if (this._padId === null) {
            throw new Error("PadId cannot be null");
        }
        return {
            transportId: this._transportId,
            rtpStreamId: this._rtpStreamId,
            padId: this._padId,
            piped: this._piped,
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
