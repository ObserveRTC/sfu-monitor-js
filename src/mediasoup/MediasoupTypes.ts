export type MediasoupSurrogateEventTypes = "newworker";

export type MediasoupNewWorkerListener = (router: MediasoupWorker) => void;
export type MediasoupSurrogateListener = MediasoupCloseListener | MediasoupNewWorkerListener;
interface MediasoupSurrogateObserver {
    on(eventType: MediasoupSurrogateEventTypes, listener: MediasoupNewWorkerListener): void;
    removeListener(eventType: MediasoupSurrogateEventTypes, listener: MediasoupSurrogateListener): void;
}

export interface MediasoupSurrogate {
    version: string;
    observer: MediasoupSurrogateObserver;
}

export type MediasoupWorkerEventTypes = "newrouter";

export type MediasoupNewRouterListener = (router: MediasoupRouter) => void;
export type MediasoupWorkerListener = MediasoupCloseListener | MediasoupNewRouterListener;
interface MediasoupWorkerObserver {
    on(eventType: MediasoupWorkerEventTypes, listener: MediasoupNewRouterListener): void;
    once(eventType: "close", listener: MediasoupCloseListener): void;
    removeListener(eventType: MediasoupWorkerEventTypes, listener: MediasoupWorkerListener): void;
}

export interface MediasoupWorker {
    pid: number;
    observer: MediasoupWorkerObserver;
}

export type MediasoupRouterEventTypes = "newtransport";

export type MediasoupNewTransportListener = (transport: MediasoupTransport) => void;
export type MediasoupRouterListener = MediasoupCloseListener | MediasoupNewTransportListener;
interface MediasoupRouterObserver {
    on(eventType: MediasoupRouterEventTypes, listener: MediasoupNewTransportListener): void;
    once(eventType: "close", listener: MediasoupCloseListener): void;
    removeListener(eventType: MediasoupRouterEventTypes, listener: MediasoupRouterListener): void;
}

export interface MediasoupRouter {
    id: string;
    observer: MediasoupRouterObserver;
}

export type MediasoupTransportEventTypes = "newproducer" | "newconsumer" | "newdataproducer" | "newdataconsumer";
export type MediasoupCloseListener = () => void;
export type MediasoupNewConsumerListener = (consumer: MediasoupConsumer) => void;
export type MediasoupNewProducerListener = (producer: MediasoupProducer) => void;
export type MediasoupNewDataProducerListener = (dataProducer: MediasoupDataProducer) => void;
export type MediasoupNewDataConsumerListener = (dataConsumer: MediasoupDataConsumer) => void;
export type MediasoupTransportListener =
    | MediasoupCloseListener
    | MediasoupNewConsumerListener
    | MediasoupNewProducerListener
    | MediasoupNewDataProducerListener
    | MediasoupNewDataConsumerListener;

interface MediasoupTransportObserver {
    on(eventType: MediasoupTransportEventTypes, listener: MediasoupTransportListener): void;
    once(eventType: "close", listener: MediasoupCloseListener): void;
    removeListener(eventType: MediasoupTransportEventTypes, listener: MediasoupTransportListener): void;
}

export interface MediasoupTransport {
    id: string;
    getStats(): Promise<MediasoupTransportStats[]>;
    observer: MediasoupTransportObserver;
    
    /* eslint-disable @typescript-eslint/no-explicit-any */
    iceState?: any; // only webrtc transport have
    
    /* eslint-disable @typescript-eslint/no-explicit-any */
    tuple?: any; // plain and pipe transport have it
}

interface MediasoupCommonObserver {
    once(eventType: "close", listener: MediasoupCloseListener): void;
}

export interface MediasoupProducer {
    readonly id: string;
    kind: "audio" | "video";
    paused: boolean;
    getStats(): Promise<MediasoupProducerStats[]>;
    observer: MediasoupCommonObserver;
}

export type MediasoupConsumerPolledStats = MediasoupConsumerStats | MediasoupProducerStats;
export interface MediasoupConsumer {
    readonly id: string;
    readonly producerId: string;
    paused: boolean;
    kind: "audio" | "video";
    getStats(): Promise<MediasoupConsumerPolledStats[]>;
    observer: MediasoupCommonObserver;
}

export interface MediasoupDataProducer {
    readonly id: string;
    getStats(): Promise<MediasoupDataProducerStats[]>;
    observer: MediasoupCommonObserver;
}

export interface MediasoupDataConsumer {
    readonly id: string;
    readonly dataProducerId: string;
    getStats(): Promise<MediasoupDataConsumerStats[]>;
    observer: MediasoupCommonObserver;
}

export type MediasoupProducerStats = {
    bitrate?: number;
    // bitrateByLayer?: Record<string, number>,
    byteCount?: number;
    firCount?: number;
    fractionLost?: number;
    jitter?: number;
    kind?: string;
    mimeType?: string;
    nackCount?: number;
    nackPacketCount?: number;
    packetCount?: number;
    packetsDiscarded?: number;
    packetsLost?: number;
    packetsRepaired?: number;
    packetsRetransmitted?: number;
    pliCount?: number;
    rid?: string;
    roundTripTime?: number;
    rtxPacketsDiscarded?: number;
    rtxSsrc?: number;
    score?: number;
    timestamp?: number;

    // mandatory types
    ssrc: number;
    type: "inbound-rtp";
};

export type MediasoupConsumerStats = {
    bitrate?: number;
    byteCount?: number;
    firCount?: number;
    fractionLost?: number;
    kind?: string;
    mimeType?: string;
    nackCount?: number;
    nackPacketCount?: number;
    packetCount?: number;
    packetsDiscarded?: number;
    packetsLost?: number;
    packetsRepaired?: number;
    packetsRetransmitted?: number;
    pliCount?: number;
    roundTripTime?: number;
    rtxSsrc?: number;
    score?: number;
    timestamp?: number;

    // mandatory fields
    ssrc: number;
    type: "outbound-rtp";
};

export type MediasoupDataProducerStats = {
    label?: string;
    protocol?: string;
    messagesReceived?: number;
    bytesReceived?: number;

    // mandatory fields
    type: "data-producer";
};

export type MediasoupDataConsumerStats = {
    label?: string;
    protocol?: string;
    messagesSent?: number;
    bytesSent?: number;

    // mandatory fields
    type: "data-consumer";
};

type EndpointsTuple = {
    localIp?: string;
    localPort?: number;
    protocol?: string;
    remoteIp?: string;
    remotePort?: number;
};

export type MediasoupTransportType = "webrtc-transport" | "plain-rtp-transport" | "pipe-transport" | "direct-transport";

export type MediasoupTransportStatsType =
    | MediasoupWebRtcTransportStats
    | MediasoupPlainTransport
    | MediasoupPipeTransport
    | MediasoupDirectTransport;

export type MediasoupWebRtcTransportStats = {
    bytesReceived?: number;
    bytesSent?: number;
    dtlsState?: string;
    iceRole?: string;
    iceSelectedTuple?: EndpointsTuple;
    iceState?: string;
    probationBytesSent?: number;
    probationSendBitrate?: number;
    recvBitrate?: number;
    rtpBytesReceived?: number;
    rtpBytesSent?: number;
    rtpRecvBitrate?: number;
    rtpSendBitrate?: number;
    rtxBytesReceived?: number;
    rtxBytesSent?: number;
    rtxRecvBitrate?: number;
    rtxSendBitrate?: number;
    sctpState?: string;
    sendBitrate?: number;
    timestamp?: number;

    // mandatory types
    transportId: string;
    type: "webrtc-transport";
};

export type MediasoupPlainTransport = {
    bytesReceived?: number;
    bytesSent?: number;
    comedia?: boolean;
    rtcpMux?: boolean;
    probationBytesSent?: number;
    probationSendBitrate?: number;
    recvBitrate?: number;
    rtpBytesReceived?: number;
    rtpBytesSent?: number;
    rtpRecvBitrate?: number;
    rtpSendBitrate?: number;
    rtxBytesReceived?: number;
    rtxBytesSent?: number;
    rtxRecvBitrate?: number;
    rtxSendBitrate?: number;
    sendBitrate?: number;
    timestamp?: number;
    tuple?: EndpointsTuple;

    // mandatory fields
    transportId: string;
    type: "plain-rtp-transport";
};

export type MediasoupPipeTransport = {
    probationBytesSent?: number;
    probationSendBitrate?: number;
    recvBitrate?: number;
    rtpBytesReceived?: number;
    rtpBytesSent?: number;
    rtpRecvBitrate?: number;
    rtpSendBitrate?: number;
    rtxBytesReceived?: number;
    rtxBytesSent?: number;
    rtxRecvBitrate?: number;
    rtxSendBitrate?: number;
    sendBitrate?: number;
    timestamp?: number;
    tuple?: EndpointsTuple;

    // mandatory fields
    transportId: string;
    type: "pipe-transport";
};

export type MediasoupDirectTransport = {
    probationBytesSent?: number;
    probationSendBitrate?: number;
    recvBitrate?: number;
    rtpBytesReceived?: number;
    rtpBytesSent?: number;
    rtpRecvBitrate?: number;
    rtpSendBitrate?: number;
    rtxBytesReceived?: number;
    rtxBytesSent?: number;
    rtxRecvBitrate?: number;
    rtxSendBitrate?: number;
    sendBitrate?: number;
    timestamp?: number;

    // mandatory fields
    transportId: string;
    type: "direct-transport";
};

export type MediasoupTransportStats =
    | MediasoupWebRtcTransportStats
    | MediasoupPlainTransport
    | MediasoupPipeTransport
    | MediasoupDirectTransport
    | {
          type: string;
      };
