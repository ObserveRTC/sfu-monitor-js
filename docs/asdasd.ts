
interface Observer<E extends Record<string, any[]>> {
    addListener<K extends keyof E>(eventName: K, listener: (...args: E[K]) => void): Observer<E>;
    removeListener<K extends keyof E>(eventName: K, listener: (...args: E[K]) => void): Observer<E>;
    once<K extends keyof E>(eventName: K, listener: (...args: E[K]) => void): Observer<E>;
}

export type MediasoupObserverEventMap = {
    newworker: [MediasoupWorkerSurrogate];
};

export interface MediasoupSurrogate {
    version: string;
    observer: Observer<MediasoupObserverEventMap>
}


export type MediasoupWorkerObserverEventMap = {
    newrouter: [MediasoupRouterSurrogate];
    newwebrtcserver: [],
    close: []
};

export interface MediasoupWorkerSurrogate {
    pid: number;
    observer: Observer<MediasoupWorkerObserverEventMap>;
}

export type MediasoupRouterObserverEventMap = {
    newtransport: [MediasoupTransportSurrogate];
    newrtpobserver: [],
    close: []
};

export type MediasoupRouterEventTypes = "newtransport";

export interface MediasoupRouterSurrogate {
    id: string;
    observer: Observer<MediasoupRouterObserverEventMap>;
}


export type MediasoupTransportObserverEventMap = {
    newproducer: [MediasoupProducerSurrogate];
    newconsumer: [MediasoupConsumerSurrogate];
    newdataproducer: [MediasoupDataProducerSurrogate];
    newdataconsumer: [MediasoupDataConsumerSurrogate];
    close: [],
    trace: [],
};


export interface MediasoupTransportSurrogate {
    id: string;
    getStats(): Promise<MediasoupTransportStats[]>;
    observer: Observer<MediasoupTransportObserverEventMap>;
    
    /* eslint-disable @typescript-eslint/no-explicit-any */
    iceState?: any; // only webrtc transport have
    
    /* eslint-disable @typescript-eslint/no-explicit-any */
    tuple?: any; // plain and pipe transport have it
}

interface MediasoupCommonObserverEventMap {
    close: undefined
}

export interface MediasoupProducerSurrogate {
    readonly id: string;
    kind: "audio" | "video";
    paused: boolean;
    getStats(): Promise<MediasoupProducerStats[]>;
    observer: {
        once<K extends keyof MediasoupCommonObserverEventMap>(eventType: K, listener: (data: MediasoupCommonObserverEventMap[K]) => void): void;
    };
}

export type MediasoupConsumerPolledStats = MediasoupConsumerStats | MediasoupProducerStats;
export interface MediasoupConsumerSurrogate {
    readonly id: string;
    readonly producerId: string;
    paused: boolean;
    kind: "audio" | "video";
    getStats(): Promise<MediasoupConsumerPolledStats[]>;
    observer: {
        once<K extends keyof MediasoupCommonObserverEventMap>(eventType: K, listener: (data: MediasoupCommonObserverEventMap[K]) => void): void;
    };
}

export interface MediasoupDataProducerSurrogate {
    readonly id: string;
    getStats(): Promise<MediasoupDataProducerStats[]>;
    observer: {
        once<K extends keyof MediasoupCommonObserverEventMap>(eventType: K, listener: (data: MediasoupCommonObserverEventMap[K]) => void): void;
    };
}

export interface MediasoupDataConsumerSurrogate {
    readonly id: string;
    readonly dataProducerId: string;
    getStats(): Promise<MediasoupDataConsumerStats[]>;
    observer: {
        once<K extends keyof MediasoupCommonObserverEventMap>(eventType: K, listener: (data: MediasoupCommonObserverEventMap[K]) => void): void;
    };
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

export type MediasoupTransportType = 
    "webrtc-transport" | "plain-rtp-transport" | "pipe-transport" | "direct-transport" |
    "WebRtcTransport" | "PlainTransport" | "PipeTransport" | "DirectTransport"
    ;

export type MediasoupTransportStatsType =
    | MediasoupWebRtcTransportStats
    | MediasoupPlainTransportStats
    | MediasoupPipeTransportStats
    | MediasoupDirectTransportStats;

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

export type MediasoupPlainTransportStats = {
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

export type MediasoupPipeTransportStats = {
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

export type MediasoupDirectTransportStats = {
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
    | MediasoupPlainTransportStats
    | MediasoupPipeTransportStats
    | MediasoupDirectTransportStats
    | {
          type: string;
      };
