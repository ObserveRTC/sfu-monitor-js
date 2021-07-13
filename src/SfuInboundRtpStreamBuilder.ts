import { SfuInboundRtpStream } from "./SfuSample";

class SfuInboundRtpStreamBuilder {

    private _transportId: string | null = null;
    private _trackId?: string | undefined;
    private _outboundStreamId?: string | undefined;
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
    private _packetsLost?: number | undefined;
    private _packetsReceived?: number | undefined;
    private _packetsDiscarded?: number | undefined;
    private _packetsRepaired?: number | undefined;
    private _packetsFailedDecryption?: number | undefined;
    private _packetsDuplicated?: number | undefined;
    private _fecPacketsReceived?: number | undefined;
    private _fecPacketsDiscarded?: number | undefined;
    private _bytesReceived?: number | undefined;
    private _rtcpSrReceived?: number | undefined;
    private _rtcpRrSent?: number | undefined;
    private _rtxPacketsReceived?: number | undefined;
    private _rtxPacketsDiscarded?: number | undefined;
    private _framesReceived?: number | undefined;
    private _framesDecoded?: number | undefined;
    private _keyFramesDecoded?: number | undefined;
    private _fractionLost?: number | undefined;
    private _jitter?: number | undefined;
    private _roundTripTime?: number | undefined;
    private _attachments?: string | undefined;

    constructor() {
    
    }
    
    withTransportId(value: string): SfuInboundRtpStreamBuilder {
        this._transportId = value;
        return this;
    }

    withTrackId(value?: string): SfuInboundRtpStreamBuilder {
        this._trackId = value;
        return this;
    }

    withStreamId(value: string): SfuInboundRtpStreamBuilder {
        this._streamId = value;
        return this;
    }

    withOutboundStreamId(value?: string): SfuInboundRtpStreamBuilder {
        this._outboundStreamId = value;
        return this;
    }

    withSsrc(value?: number): SfuInboundRtpStreamBuilder {
        this._ssrc = value;
        return this;
    }

    withMediaType(value?: string): SfuInboundRtpStreamBuilder {
        this._mediaType = value;
        return this;
    }

    withPayloadType(value?: number): SfuInboundRtpStreamBuilder {
        this._payloadType = value;
        return this;
    }

    withMimeType(value?: string): SfuInboundRtpStreamBuilder {
        this._mimeType = value;
        return this;
    }

    withClockRate(value?: number): SfuInboundRtpStreamBuilder {
        this._clockRate = value;
        return this;
    }

    withSdpFmtpLine(value?: string): SfuInboundRtpStreamBuilder {
        this._sdpFmtpLine = value;
        return this;
    }

    withRid(value?: string): SfuInboundRtpStreamBuilder {
        this._rid = value;
        return this;
    }

    withRtxSsrc(value?: number): SfuInboundRtpStreamBuilder {
        this._rtxSsrc = value;
        return this;
    }

    withTargetBitrate(value?: number): SfuInboundRtpStreamBuilder {
        this._targetBitrate = value;
        return this;
    }

    withVoiceActivityFlag(value?: boolean): SfuInboundRtpStreamBuilder {
        this._voiceActivityFlag = value;
        return this;
    }

    withFirCount(value?: number): SfuInboundRtpStreamBuilder {
        this._firCount = value;
        return this;
    }

    withPliCount(value?: number): SfuInboundRtpStreamBuilder {
        this._pliCount = value;
        return this;
    }

    withNackCount(value?: number): SfuInboundRtpStreamBuilder {
        this._nackCount = value;
        return this;
    }

    withSliCount(value?: number): SfuInboundRtpStreamBuilder {
        this._sliCount = value;
        return this;
    }

    withPacketsLost(value?: number): SfuInboundRtpStreamBuilder {
        this._packetsLost = value;
        return this;
    }

    withPacketsReceived(value?: number): SfuInboundRtpStreamBuilder {
        this._packetsReceived = value;
        return this;
    }

    withPacketsDiscarded(value?: number): SfuInboundRtpStreamBuilder {
        this._packetsDiscarded = value;
        return this;
    }

    withPacketsRepaired(value?: number): SfuInboundRtpStreamBuilder {
        this._packetsRepaired = value;
        return this;
    }

    withPacketsFailedDecryption(value?: number): SfuInboundRtpStreamBuilder {
        this._packetsFailedDecryption = value;
        return this;
    }

    withPacketsDuplicated(value?: number): SfuInboundRtpStreamBuilder {
        this._packetsDuplicated = value;
        return this;
    }

    withFecPacketsReceived(value?: number): SfuInboundRtpStreamBuilder {
        this._fecPacketsReceived = value;
        return this;
    }

    withFecPacketsDiscarded(value?: number): SfuInboundRtpStreamBuilder {
        this._fecPacketsDiscarded = value;
        return this;
    }

    withBytesReceived(value?: number): SfuInboundRtpStreamBuilder {
        this._bytesReceived = value;
        return this;
    }

    withRtcpSrReceived(value?: number): SfuInboundRtpStreamBuilder {
        this._rtcpSrReceived = value;
        return this;
    }

    withRtcpRrSent(value?: number): SfuInboundRtpStreamBuilder {
        this._rtcpRrSent = value;
        return this;
    }

    withRtxPacketsReceived(value?: number): SfuInboundRtpStreamBuilder {
        this._rtxPacketsReceived = value;
        return this;
    }

    withRtxPacketsDiscarded(value?: number): SfuInboundRtpStreamBuilder {
        this._rtxPacketsDiscarded = value;
        return this;
    }

    withFramesReceived(value?: number): SfuInboundRtpStreamBuilder {
        this._framesReceived = value;
        return this;
    }

    withFramesDecoded(value?: number): SfuInboundRtpStreamBuilder {
        this._framesDecoded = value;
        return this;
    }

    withKeyFramesDecoded(value?: number): SfuInboundRtpStreamBuilder {
        this._keyFramesDecoded = value;
        return this;
    }

    withFractionLost(value?: number): SfuInboundRtpStreamBuilder {
        this._fractionLost = value;
        return this;
    }

    withJitter(value?: number): SfuInboundRtpStreamBuilder {
        this._jitter = value;
        return this;
    }

    withRoundTripTime(value?: number) : SfuInboundRtpStreamBuilder {
        this._roundTripTime = value;
        return this;
    }

    withAttachments(value?: string): SfuInboundRtpStreamBuilder {
        this._attachments = value;
        return this;
    }

    build(): SfuInboundRtpStream {
        if (this._transportId === null) {
            throw new Error("TransportId cannot be null");
        }
        if (this._streamId === null) {
            throw new Error("StreamId cannot be null");
        }
        return {
            transportId: this._transportId,
            trackId: this._trackId,
            outboundStreamId: this._outboundStreamId,
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
            packetsLost: this._packetsLost,
            packetsReceived: this._packetsReceived,
            packetsDiscarded: this._packetsDiscarded,
            packetsRepaired: this._packetsRepaired,
            packetsFailedDecryption: this._packetsFailedDecryption,
            packetsDuplicated: this._packetsDuplicated,
            fecPacketsReceived: this._fecPacketsReceived,
            fecPacketsDiscarded: this._fecPacketsDiscarded,
            bytesReceived: this._bytesReceived,
            rtcpSrReceived: this._rtcpSrReceived,
            rtcpRrSent: this._rtcpRrSent,
            rtxPacketsReceived: this._rtxPacketsReceived,
            rtxPacketsDiscarded: this._rtxPacketsDiscarded,
            framesReceived: this._framesReceived,
            framesDecoded: this._framesDecoded,
            keyFramesDecoded: this._keyFramesDecoded,
            fractionLost: this._fractionLost,
            jitter: this._jitter,
            roundTripTime: this._roundTripTime,
            attachments: this._attachments,
        };
    }

    
}

export function builder(): SfuInboundRtpStreamBuilder {
    return new SfuInboundRtpStreamBuilder();
}
