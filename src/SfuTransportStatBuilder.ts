import { SfuTransport } from "./SfuSample";

export class SfuTransportStatBuilder {
    
    public static create(): SfuTransportStatBuilder {
        return new SfuTransportStatBuilder();
    }

    private _transportId: string | null = null;
    private _serviceId?: string | undefined;
    private _dtlsState?: string | undefined;
    private _iceState?: string | undefined;
    private _sctpState?: string | undefined;
    private _iceRole?: string | undefined;
    private _localAddress?: string | undefined;
    private _localPort?: number | undefined;
    private _protocol?: string | undefined;
    private _remoteAddress?: string | undefined;
    private _remotePort?: number | undefined;
    private _rtpBytesReceived?: number | undefined;
    private _rtpBytesSent?: number | undefined;
    private _rtpPacketsReceived?: number | undefined;
    private _rtpPacketsSent?: number | undefined;
    private _rtpPacketsLost?: number | undefined;
    private _rtxBytesReceived?: number | undefined;
    private _rtxBytesSent?: number | undefined;
    private _rtxPacketsReceived?: number | undefined;
    private _rtxPacketsSent?: number | undefined;
    private _rtxPacketsDiscarded?: number | undefined;
    private _sctpBytesReceived?: number | undefined;
    private _sctpBytesSent?: number | undefined;
    private _sctpPacketsReceived?: number | undefined;
    private _sctpPacketsSent?: number | undefined;

    private constructor() {
        this._transportId = null;
    }

    withTransportId(value: string): SfuTransportStatBuilder {
        this._transportId = value;
        return this;
    }

    withServiceId(value?: string): SfuTransportStatBuilder {
        this._serviceId = value;
        return this;
    }

    withDtlsState(value?: string): SfuTransportStatBuilder {
        this._dtlsState = value;
        return this;
    }

    withIceState(value?: string): SfuTransportStatBuilder {
        this._iceState = value;
        return this;
    }

    withSctpState(value?: string): SfuTransportStatBuilder {
        this._sctpState = value;
        return this;
    }

    withIceRole(value?: string): SfuTransportStatBuilder {
        this._iceRole = value;
        return this;
    }

    withLocalAddress(value?: string): SfuTransportStatBuilder {
        this._localAddress = value;
        return this;
    }

    withLocalPort(value?: number): SfuTransportStatBuilder {
        this._localPort = value;
        return this;
    }

    withProtocol(value?: string): SfuTransportStatBuilder {
        if (value === null || value === undefined) {
            return this;
        }
        const saved = value.toLowerCase();
        if (saved !== "udp" && saved !== "tcp") {
            throw new Error("Transport protocol must be UDP or TCP. currently it is: " + value);
        }
        return this;
    }

    withRemoteAddress(value?: string): SfuTransportStatBuilder {
        this._remoteAddress = value;
        return this;
    }

    withRemotePort(value?: number): SfuTransportStatBuilder {
        this._remotePort = value;
        return this;
    }

    withRtpBytesReceived(value?: number): SfuTransportStatBuilder {
        this._rtpBytesReceived = value;
        return this;
    }

    withRtpBytesSent(value?: number): SfuTransportStatBuilder {
        this._rtpBytesSent = value;
        return this;
    }

    withRtpPacketsReceived(value?: number): SfuTransportStatBuilder {
        this._rtpPacketsReceived = value;
        return this;
    }

    withRtpPacketsSent(value?: number): SfuTransportStatBuilder {
        this._rtpPacketsSent = value;
        return this;
    }

    withRtpPacketsLost(value?: number): SfuTransportStatBuilder {
        this._rtpPacketsLost = value;
        return this;
    }

    withRtxBytesReceived(value?: number): SfuTransportStatBuilder {
        this._rtxBytesReceived = value;
        return this;
    }

    withRtxBytesSent(value?: number): SfuTransportStatBuilder {
        this._rtxBytesSent = value;
        return this;
    }

    withRtxPacketsReceived(value?: number): SfuTransportStatBuilder {
        this._rtxPacketsReceived = value;
        return this;
    }

    withRtxPacketsSent(value?: number): SfuTransportStatBuilder {
        this._rtxPacketsSent = value;
        return this;
    }

    withRtxPacketsDiscarded(value?: number): SfuTransportStatBuilder {
        this._rtxPacketsDiscarded = value;
        return this;
    }

    withSctpBytesReceived(value?: number): SfuTransportStatBuilder {
        this._sctpBytesReceived = value;
        return this;
    }

    withSctpBytesSent(value?: number): SfuTransportStatBuilder {
        this._sctpBytesSent = value;
        return this;
    }

    withSctpPacketsReceived(value?: number): SfuTransportStatBuilder {
        this._sctpPacketsReceived = value;
        return this;
    }

    withSctpPacketsSent(value?: number): SfuTransportStatBuilder {
        this._sctpPacketsSent = value;
        return this;
    }

    build(): SfuTransport {
        if (this._transportId === null) {
            throw new Error("TransportId cannot be null");
        }
        return {
            transportId: this._transportId,
            serviceId: this._serviceId,
            dtlsState: this._dtlsState,
            iceState: this._iceState,
            sctpState: this._sctpState,
            iceRole: this._iceRole,
            localAddress: this._localAddress,
            localPort: this._localPort,
            protocol: this._protocol, 
            remoteAddress: this._remoteAddress,
            remotePort: this._remotePort,
            rtpBytesReceived: this._rtpBytesReceived,
            rtpBytesSent: this._rtpBytesSent,
            rtpPacketsReceived: this._rtpPacketsReceived,
            rtpPacketsSent: this._rtpPacketsSent,
            rtpPacketsLost: this._rtpPacketsLost,
            rtxBytesReceived: this._rtxBytesReceived,
            rtxBytesSent: this._rtxBytesSent,
            rtxPacketsReceived: this._rtxPacketsReceived,
            rtxPacketsSent: this._rtxPacketsSent,
            rtxPacketsDiscarded: this._rtxPacketsDiscarded,
            sctpBytesReceived: this._sctpBytesReceived,
            sctpBytesSent: this._sctpBytesSent,
            sctpPacketsReceived: this._sctpPacketsReceived,
            sctpPacketsSent: this._sctpPacketsSent,
        };
    }
}
