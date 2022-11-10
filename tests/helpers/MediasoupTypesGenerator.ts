import EventEmitter from "events";
import * as Types from "../../src/mediasoup/MediasoupTypes";
import { v4 as uuidv4 } from "uuid";
import { SfuInboundRtpPad, SfuOutboundRtpPad, SfuSctpChannel, SfuTransport } from "@observertc/schemas";
import { StatsWriter } from "../../src/entries/StatsStorage";

export function makeStatsWriterRelayer({
    removeTransport,
    updateTransport,
    removeInboundRtpPad,
    updateInboundRtpPad,
    removeOutboundRtpPad,
    updateOutboundRtpPad,
    removeSctpChannel,
    updateSctpChannel,
}: {
    removeTransport?: (transportId: string) => void;
    updateTransport?: (stats: SfuTransport) => void;
    removeInboundRtpPad?: (rtpPadId: string) => void;
    updateInboundRtpPad?: (stats: SfuInboundRtpPad) => void;
    removeOutboundRtpPad?: (rtpPadId: string) => void;
    updateOutboundRtpPad?: (stats: SfuOutboundRtpPad) => void;
    removeSctpChannel?: (sctpStreamId: string) => void;
    updateSctpChannel?: (stats: SfuSctpChannel) => void;
}) {
    const errorHandler = (methodName: string) => {
        return () => {
            throw new Error(`${methodName} is called and handler has not been provided`);
        };
    };
    const result: StatsWriter = {
        removeTransport: removeTransport ?? errorHandler("removeTransport"),
        updateTransport: updateTransport ?? errorHandler("updateTransport"),

        removeInboundRtpPad: removeInboundRtpPad ?? errorHandler("removeInboundRtpPad"),
        updateInboundRtpPad: updateInboundRtpPad ?? errorHandler("updateInboundRtpPad"),

        removeOutboundRtpPad: removeOutboundRtpPad ?? errorHandler("removeOutboundRtpPad"),
        updateOutboundRtpPad: updateOutboundRtpPad ?? errorHandler("updateOutboundRtpPad"),

        removeSctpChannel: removeSctpChannel ?? errorHandler("removeSctpChannel"),
        updateSctpChannel: updateSctpChannel ?? errorHandler("updateSctpChannel"),
    };
    return result;
}

const DEFAULT_TRANSPORT_ID = uuidv4();
const DEFAULT_PRODUCER_ID = uuidv4();
const DEFAULT_CONSUMER_ID = uuidv4();
const DEFAULT_DATA_PRODUCER_ID = uuidv4();
const DEFAULT_DATA_CONSUMER_ID = uuidv4();
const DEFAULT_PRODUCER_SSRC = generateIntegerBetween(11111111, 9999999999);
const DEFAULT_CONSUMER_SSRC = generateIntegerBetween(11111111, 9999999999);

export function generateFloat(min = 0.0, max = 100.0): number {
    const result = Math.random() * (max - min + 1) + min;
    return result;
}

export function generateIntegerBetween(min = 0, max = 1000): number {
    const float = generateFloat(min, max);
    const result = Math.floor(float);
    return result;
}

export function generateFrom<T>(...params: T[]): T {
    if (!params) {
        throw new Error(`Cannot generate random items from an empty array`);
    }
    const result = params[Math.floor(Math.random() * params.length)];
    return result;
}

export function createProducerStats(stats?: any): Types.MediasoupProducerStats {
    const result: Types.MediasoupProducerStats = {
        ssrc: DEFAULT_PRODUCER_SSRC,
        type: "inbound-rtp",
        ...(stats || {}),
    };
    return result;
}
export interface ProvidedProducer extends Types.MediasoupProducer {
    close(): void;
}
export function createProducer(stats?: any): ProvidedProducer {
    const emitter = new EventEmitter();
    const kind = generateFrom<"audio" | "video">("audio", "video");
    const producerStats = createProducerStats(stats);
    const result: ProvidedProducer = {
        kind,
        paused: false,
        id: DEFAULT_PRODUCER_ID,
        getStats: async () => {
            return [producerStats];
        },
        observer: {
            once: (eventType: "close", listener: Types.MediasoupCloseListener) => {
                emitter.once(eventType, listener);
            },
        },
        close: () => {
            emitter.emit("close");
        },
    };
    return result;
}

export function createConsumerStats(stats?: any): Types.MediasoupConsumerStats {
    const result: Types.MediasoupConsumerStats = {
        ssrc: DEFAULT_CONSUMER_SSRC,
        type: "outbound-rtp",
        ...(stats || {}),
    };
    return result;
}
export interface ProvidedConsumer extends Types.MediasoupConsumer {
    close(): void;
}
export function createConsumer(stats?: any): ProvidedConsumer {
    const emitter = new EventEmitter();
    const kind = generateFrom<"audio" | "video">("audio", "video");
    const producerStats = createProducerStats(stats);
    const consumerStats = createConsumerStats(stats);
    const result: ProvidedConsumer = {
        kind,
        id: DEFAULT_CONSUMER_ID,
        paused: false,
        producerId: DEFAULT_PRODUCER_ID,
        getStats: async () => {
            return [producerStats, consumerStats];
        },
        observer: {
            once: (eventType: "close", listener: Types.MediasoupCloseListener) => {
                emitter.once(eventType, listener);
            },
        },
        close: () => {
            emitter.emit("close");
        },
    };
    return result;
}

export function createDataProducerStats(stats?: any): Types.MediasoupDataProducerStats {
    const result: Types.MediasoupDataProducerStats = {
        ssrc: generateIntegerBetween(11111111, 9999999999),
        type: "data-producer",
        ...(stats || {}),
    };
    return result;
}
export interface ProvidedDataProducer extends Types.MediasoupDataProducer {
    close(): void;
}
export function createDataProducer(stats?: any): ProvidedDataProducer {
    const emitter = new EventEmitter();
    const dataProducerStats = createDataProducerStats(stats);
    const result: ProvidedDataProducer = {
        id: DEFAULT_PRODUCER_ID,
        getStats: async () => {
            return [dataProducerStats];
        },
        observer: {
            once: (eventType: "close", listener: Types.MediasoupCloseListener) => {
                emitter.once(eventType, listener);
            },
        },
        close: () => {
            emitter.emit("close");
        },
    };
    return result;
}

export function createDataConsumerStats(stats?: any): Types.MediasoupDataConsumerStats {
    const result: Types.MediasoupDataConsumerStats = {
        ssrc: generateIntegerBetween(11111111, 9999999999),
        type: "outbound-rtp",
        ...(stats || {}),
    };
    return result;
}
export interface ProvidedDataConsumer extends Types.MediasoupDataConsumer {
    close(): void;
}
export function createDataConsumer(stats?: any): ProvidedDataConsumer {
    const emitter = new EventEmitter();
    const dataConsumerStats = createDataConsumerStats(stats);
    const result: ProvidedDataConsumer = {
        id: DEFAULT_DATA_CONSUMER_ID,
        dataProducerId: DEFAULT_DATA_PRODUCER_ID,
        getStats: async () => {
            return [dataConsumerStats];
        },
        observer: {
            once: (eventType: "close", listener: Types.MediasoupCloseListener) => {
                emitter.once(eventType, listener);
            },
        },
        close: () => {
            emitter.emit("close");
        },
    };
    return result;
}

export function createWebRtcTransportStats(stats?: any): Types.MediasoupWebRtcTransportStats {
    const result: Types.MediasoupWebRtcTransportStats = {
        type: "webrtc-transport",
        ...(stats || {}),
    };
    return result;
}
export interface ProvidedTransport extends Types.MediasoupTransport {
    produce(stats?: Types.MediasoupProducerStats): ProvidedProducer;
    consume(stats?: Types.MediasoupConsumerStats): ProvidedConsumer;
    produceData(stats?: Types.MediasoupDataProducerStats): ProvidedDataProducer;
    consumeData(stats?: Types.MediasoupDataConsumerStats): ProvidedDataConsumer;
    close(): void;
}
export function createTransport(stats: Types.MediasoupTransportStatsType): ProvidedTransport {
    const emitter = new EventEmitter();
    const kind = generateFrom<"audio" | "video">("audio", "video");
    const result: ProvidedTransport = {
        id: DEFAULT_TRANSPORT_ID,
        getStats: async () => {
            return [stats];
        },
        observer: {
            on: (eventType: Types.MediasoupTransportEventTypes, listener: Types.MediasoupTransportListener) => {
                emitter.on(eventType, listener);
            },
            once: (eventType: "close", listener: Types.MediasoupCloseListener) => {
                emitter.once(eventType, listener);
            },
            removeListener: (
                eventType: Types.MediasoupTransportEventTypes,
                listener: Types.MediasoupTransportListener
            ) => {
                emitter.removeListener(eventType, listener);
            },
        },
        produce: (stats?: Types.MediasoupProducerStats) => {
            const producer = createProducer(stats);
            emitter.emit("newproducer", producer);
            return producer;
        },
        produceData: (stats?: Types.MediasoupDataProducerStats) => {
            const dataProducer = createDataProducer(stats);
            emitter.emit("newdataproducer", dataProducer);
            return dataProducer;
        },
        consume: (stats?: Types.MediasoupConsumerStats) => {
            const consumer = createConsumer(stats);
            emitter.emit("newconsumer", consumer);
            return consumer;
        },
        consumeData: (stats?: Types.MediasoupDataConsumerStats) => {
            const dataConsumer = createDataConsumer(stats);
            emitter.emit("newdataconsumer", dataConsumer);
            return dataConsumer;
        },
        close: () => {
            emitter.emit("close");
        },
    };
    return result;
}

export function createWebRtcTransport(): ProvidedTransport {
    const stats = createWebRtcTransportStats();
    const transport = createTransport(stats);
    return transport;
}
