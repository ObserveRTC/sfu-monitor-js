import { SctpStream } from "./SfuSample";

class SfuSctpStreamBuilder {

    private _transportId: string | null = null;
    private _streamId: string | null = null;
    private _label?: string | undefined;
    private _protocol?: string | undefined;
    private _sctpSmoothedRoundTripTime?: number | undefined;
    private _sctpCongestionWindow?: number | undefined;
    private _sctpReceiverWindow?: number | undefined;
    private _sctpMtu?: number | undefined;
    private _sctpUnackData?: number | undefined;
    private _messageReceived?: number | undefined;
    private _messageSent?: number | undefined;
    private _bytesReceived?: number | undefined;
    private _bytesSent?: number | undefined;

    constructor() {
        this._transportId = null;
    }


    withTransportId(value: string): SfuSctpStreamBuilder {
        this._transportId = value;
        return this;
    }

    withStreamId(value: string): SfuSctpStreamBuilder {
        this._streamId = value;
        return this;
    }

    withLabel(value: string): SfuSctpStreamBuilder {
        this._label = value;
        return this;
    }

    withProtocol(value: string): SfuSctpStreamBuilder {
        this._protocol = value;
        return this;
    }

    withSctpSmoothedRoundTripTime(value: number): SfuSctpStreamBuilder {
        this._sctpSmoothedRoundTripTime = value;
        return this;
    }

    withSctpCongestionWindow(value: number): SfuSctpStreamBuilder {
        this._sctpCongestionWindow = value;
        return this;
    }

    withSctpReceiverWindow(value: number): SfuSctpStreamBuilder {
        this._sctpReceiverWindow = value;
        return this;
    }

    withSctpMtu(value: number): SfuSctpStreamBuilder {
        this._sctpMtu = value;
        return this;
    }

    withSctpUnackData(value: number): SfuSctpStreamBuilder {
        this._sctpUnackData = value;
        return this;
    }

    withMessageReceived(value: number): SfuSctpStreamBuilder {
        this._messageReceived = value;
        return this;
    }

    withMessageSent(value: number): SfuSctpStreamBuilder {
        this._messageSent = value;
        return this;
    }

    withBytesReceived(value: number): SfuSctpStreamBuilder {
        this._bytesReceived = value;
        return this;
    }

    withBytesSent(value: number): SfuSctpStreamBuilder {
        this._bytesSent = value;
        return this;
    }

    build(): SctpStream {
        if (this._transportId === null) {
            throw new Error("TransportId cannot be null");
        }
        if (this._streamId === null) {
            throw new Error("StreamId cannot be null");
        }
        return {
            transportId: this._transportId,
            streamId: this._streamId,
            label:  this._label,
            protocol: this._protocol,
            sctpSmoothedRoundTripTime: this._sctpSmoothedRoundTripTime,
            sctpCongestionWindow: this._sctpCongestionWindow,
            sctpReceiverWindow: this._sctpReceiverWindow,
            sctpMtu: this._sctpMtu,
            sctpUnackData: this._sctpUnackData,
            messageReceived: this._messageReceived,
            messageSent: this._messageSent,
            bytesReceived: this._bytesReceived,
            bytesSent: this._bytesSent,
        };
    }
}

export function builder(): SfuSctpStreamBuilder {
    return new SfuSctpStreamBuilder();
}
