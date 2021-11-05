import { SfuInboundRtpPad } from "./SfuSample";

export class SfuInboundRtpPadBuilder {
    
    public static create(): SfuInboundRtpPadBuilder {
        // because I want to control the new keyword!
        return new SfuInboundRtpPadBuilder();
    }

    private _transportId: string | null = null;
    private _rtpStreamId: string | null = null;
    private _internal?: boolean | undefined = false;
    private _skipMeasurements?: boolean | undefined = false;
    private _padId: string | null = null;
    private _outboundPadId: string | undefined;
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

    private constructor() {
        // empty
    }
    
    withTransportId(value: string): SfuInboundRtpPadBuilder {
        this._transportId = value;
        return this;
    }

    withRtpStreamId(value: string): SfuInboundRtpPadBuilder {
        this._rtpStreamId = value;
        return this;
    }

    withPadId(value: string): SfuInboundRtpPadBuilder {
        this._padId = value;
        return this;
    }

    withSkipMeasurements(value?: boolean): SfuInboundRtpPadBuilder {
        this._skipMeasurements = value;
        return this;
    }

    withInternal(value?: boolean): SfuInboundRtpPadBuilder {
        this._internal = value;
        return this;
    }

    withOutboundPadId(value: string): SfuInboundRtpPadBuilder {
        this._outboundPadId = value;
        return this;
    }

    withSsrc(value?: number): SfuInboundRtpPadBuilder {
        this._ssrc = value;
        return this;
    }

    withMediaType(value?: string): SfuInboundRtpPadBuilder {
        this._mediaType = value;
        return this;
    }

    withPayloadType(value?: number): SfuInboundRtpPadBuilder {
        this._payloadType = value;
        return this;
    }

    withMimeType(value?: string): SfuInboundRtpPadBuilder {
        this._mimeType = value;
        return this;
    }

    withClockRate(value?: number): SfuInboundRtpPadBuilder {
        this._clockRate = value;
        return this;
    }

    withSdpFmtpLine(value?: string): SfuInboundRtpPadBuilder {
        this._sdpFmtpLine = value;
        return this;
    }

    withRid(value?: string): SfuInboundRtpPadBuilder {
        this._rid = value;
        return this;
    }

    withRtxSsrc(value?: number): SfuInboundRtpPadBuilder {
        this._rtxSsrc = value;
        return this;
    }

    withTargetBitrate(value?: number): SfuInboundRtpPadBuilder {
        this._targetBitrate = value;
        return this;
    }

    withVoiceActivityFlag(value?: boolean): SfuInboundRtpPadBuilder {
        this._voiceActivityFlag = value;
        return this;
    }

    withFirCount(value?: number): SfuInboundRtpPadBuilder {
        this._firCount = value;
        return this;
    }

    withPliCount(value?: number): SfuInboundRtpPadBuilder {
        this._pliCount = value;
        return this;
    }

    withNackCount(value?: number): SfuInboundRtpPadBuilder {
        this._nackCount = value;
        return this;
    }

    withSliCount(value?: number): SfuInboundRtpPadBuilder {
        this._sliCount = value;
        return this;
    }

    withPacketsLost(value?: number): SfuInboundRtpPadBuilder {
        this._packetsLost = value;
        return this;
    }

    withPacketsReceived(value?: number): SfuInboundRtpPadBuilder {
        this._packetsReceived = value;
        return this;
    }

    withPacketsDiscarded(value?: number): SfuInboundRtpPadBuilder {
        this._packetsDiscarded = value;
        return this;
    }

    withPacketsRepaired(value?: number): SfuInboundRtpPadBuilder {
        this._packetsRepaired = value;
        return this;
    }

    withPacketsFailedDecryption(value?: number): SfuInboundRtpPadBuilder {
        this._packetsFailedDecryption = value;
        return this;
    }

    withPacketsDuplicated(value?: number): SfuInboundRtpPadBuilder {
        this._packetsDuplicated = value;
        return this;
    }

    withFecPacketsReceived(value?: number): SfuInboundRtpPadBuilder {
        this._fecPacketsReceived = value;
        return this;
    }

    withFecPacketsDiscarded(value?: number): SfuInboundRtpPadBuilder {
        this._fecPacketsDiscarded = value;
        return this;
    }

    withBytesReceived(value?: number): SfuInboundRtpPadBuilder {
        this._bytesReceived = value;
        return this;
    }

    withRtcpSrReceived(value?: number): SfuInboundRtpPadBuilder {
        this._rtcpSrReceived = value;
        return this;
    }

    withRtcpRrSent(value?: number): SfuInboundRtpPadBuilder {
        this._rtcpRrSent = value;
        return this;
    }

    withRtxPacketsReceived(value?: number): SfuInboundRtpPadBuilder {
        this._rtxPacketsReceived = value;
        return this;
    }

    withRtxPacketsDiscarded(value?: number): SfuInboundRtpPadBuilder {
        this._rtxPacketsDiscarded = value;
        return this;
    }

    withFramesReceived(value?: number): SfuInboundRtpPadBuilder {
        this._framesReceived = value;
        return this;
    }

    withFramesDecoded(value?: number): SfuInboundRtpPadBuilder {
        this._framesDecoded = value;
        return this;
    }

    withKeyFramesDecoded(value?: number): SfuInboundRtpPadBuilder {
        this._keyFramesDecoded = value;
        return this;
    }

    withFractionLost(value?: number): SfuInboundRtpPadBuilder {
        this._fractionLost = value;
        return this;
    }

    withJitter(value?: number): SfuInboundRtpPadBuilder {
        this._jitter = value;
        return this;
    }

    withRoundTripTime(value?: number) : SfuInboundRtpPadBuilder {
        this._roundTripTime = value;
        return this;
    }

    withAttachments(value?: string): SfuInboundRtpPadBuilder {
        this._attachments = value;
        return this;
    }

    build(): SfuInboundRtpPad {
        if (this._transportId === null) {
            throw new Error("TransportId cannot be null");
        }
        if (this._rtpStreamId === null) {
            throw new Error("StreamId cannot be null");
        }
        if (this._padId === null) {
            throw new Error("SourceId cannot be null");
        }
        return {
            transportId: this._transportId,
            rtpStreamId: this._rtpStreamId,
            padId: this._padId,
            internal: this._internal,
            skipMeasurements: this._skipMeasurements,
            outboundPadId: this._outboundPadId,
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
